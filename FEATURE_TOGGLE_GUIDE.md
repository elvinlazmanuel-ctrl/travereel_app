# Feature Toggle System with API Key Management

## Overview

The Travereel app now includes a comprehensive feature toggle system that allows superadmins to dynamically control features like **"Where to Stay"** and **"Travel Insurance"** without code changes. The system includes secure API key management with AES-256-GCM encryption.

---

## 📦 What's Implemented

### 1. **Database Schema Enhancement**
- Extended `FeatureToggle` model with:
  - `apiKey` - Encrypted API key storage
  - `apiConfig` - JSON configuration for API endpoints and settings
  - `metadata` - JSON metadata for additional feature configuration
  - `createdAt` - Timestamp for auditing

### 2. **API Key Encryption** (`src/lib/api-key-encryption.ts`)
- **AES-256-GCM** encryption for secure API key storage
- **Scrypt** key derivation for password-based encryption
- **Masking** for secure display (shows only first/last 4 characters)
- Functions:
  - `encryptApiKey(apiKey)` - Encrypts API key before storage
  - `decryptApiKey(encryptedKey)` - Decrypts API key for use
  - `maskApiKey(apiKey)` - Masks key for UI display
  - `isValidApiKeyFormat(apiKey)` - Validates key format

### 3. **Enhanced API Routes** (`/api/superadmin/features`)
- **GET** - Fetch all features (API keys masked)
- **POST** - Create new feature with optional API key
- **PUT** - Update feature toggle, API key, or configuration
- All routes protected with `requireSuperAdmin` middleware
- Complete audit logging for all changes

### 4. **Seed Script** (`scripts/seed-feature-toggles.ts`)
Pre-configured features:
- ✅ `where_to_stay` - Hotel booking widget (Booking.com)
- ✅ `travel_insurance` - Insurance recommendations (SafetyWing, WorldNomads, Allianz)
- ✅ `ai_itinerary_generator` - AI-powered itinerary creation
- ✅ `weather_forecast` - 7-day weather predictions
- ✅ `currency_converter` - Real-time currency conversion
- ✅ `premium_subscriptions` - Stripe subscription system
- ✅ `push_notifications` - Web push notifications

---

## 🚀 Deployment Steps

### Step 1: Run Database Migration

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add API key management fields to feature_toggles table
ALTER TABLE "feature_toggles" 
ADD COLUMN IF NOT EXISTS "apiKey" TEXT,
ADD COLUMN IF NOT EXISTS "apiConfig" TEXT,
ADD COLUMN IF NOT EXISTS "metadata" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "feature_toggles_key_idx" ON "feature_toggles"("key");
CREATE INDEX IF NOT EXISTS "feature_toggles_category_idx" ON "feature_toggles"("category");
```

### Step 2: Add Encryption Secret to Environment Variables

Add to your `.env` file:

```env
# API Key Encryption (generate a strong key)
API_KEY_ENCRYPTION_SECRET=your-super-secret-encryption-key-change-this-in-production
```

Generate a secure key:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 3: Run Seed Script

```bash
npx tsx scripts/seed-feature-toggles.ts
```

This will create/update all feature toggles in the database.

### Step 4: Configure API Keys via Superadmin Dashboard

1. Login to superadmin dashboard: `/superadmin-auth`
2. Navigate to **Feature Toggles**
3. Click on **"Where to Stay"** or **"Travel Insurance"**
4. Enter API key in the configuration panel
5. Save (API key will be encrypted automatically)

---

## 🔒 Security Features

### API Key Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: Scrypt (memory-hard function)
- **Salt**: 16 bytes random salt per encryption
- **IV**: 16 bytes initialization vector
- **Auth Tag**: 16 bytes for integrity verification

### API Response Sanitization
- API keys are **never** returned in plaintext
- Masked format: `sk-p••••••••••••••••abcd`
- Only first 4 and last 4 characters visible

### Access Control
- All feature management routes require superadmin authentication
- JWT token validation with role checking
- Audit logging for all changes (IP, user agent, timestamp)

---

## 💻 Frontend Usage

### Check if Feature is Enabled

Create a custom hook:

```typescript
// hooks/useFeatureToggle.ts
import { useState, useEffect } from 'react'

interface FeatureToggle {
  key: string
  enabled: boolean
  apiConfig?: any
}

export function useFeatureToggle(key: string) {
  const [feature, setFeature] = useState<FeatureToggle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchFeature() {
      try {
        const res = await fetch('/api/superadmin/features')
        const data = await res.json()
        const feature = data.features.find((f: any) => f.key === key)
        setFeature(feature)
      } catch (error) {
        console.error('Failed to fetch feature toggle:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFeature()
  }, [key])

  return { enabled: feature?.enabled ?? false, feature, loading }
}
```

### Usage in Components

```typescript
// Example: HotelBookingWidget.tsx
import { useFeatureToggle } from '@/hooks/useFeatureToggle'

export default function HotelBookingWidget(props) {
  const { enabled, loading } = useFeatureToggle('where_to_stay')

  if (loading) return <Skeleton />
  if (!enabled) return null // Feature is disabled

  return (
    <div>
      {/* Hotel booking widget */}
    </div>
  )
}
```

### Accessing API Configuration

```typescript
// Example: TravelInsuranceRecommendations.tsx
import { useFeatureToggle } from '@/hooks/useFeatureToggle'

export default function TravelInsuranceRecommendations(props) {
  const { enabled, feature } = useFeatureToggle('travel_insurance')

  if (!enabled || !feature) return null

  const config = JSON.parse(feature.apiConfig || '{}')
  const providers = config.providers || []

  return (
    <div>
      {providers.map(provider => (
        <InsuranceCard key={provider} name={provider} />
      ))}
    </div>
  )
}
```

---

## 📊 Feature Configuration Examples

### Where to Stay (Booking.com)

```json
{
  "key": "where_to_stay",
  "enabled": true,
  "apiKey": "encrypted-api-key-here",
  "apiConfig": {
    "provider": "booking.com",
    "affiliateId": "your-affiliate-id",
    "endpoint": "https://api.booking.com"
  },
  "metadata": {
    "commission": "8%",
    "displayPosition": "itinerary-detail",
    "maxHotels": 5
  }
}
```

### Travel Insurance

```json
{
  "key": "travel_insurance",
  "enabled": true,
  "apiConfig": {
    "providers": ["SafetyWing", "WorldNomads", "Allianz"],
    "affiliateLinks": {
      "safetyWing": "https://safetywing.com?ref=travereel",
      "worldNomads": "https://worldnomads.com?ref=travereel"
    }
  },
  "metadata": {
    "commission": "10-15%",
    "defaultProvider": "SafetyWing"
  }
}
```

---

## 🔧 API Endpoints

### GET /api/superadmin/features
Fetch all feature toggles (requires authentication)

**Response:**
```json
{
  "features": [
    {
      "id": "...",
      "key": "where_to_stay",
      "label": "Where to Stay",
      "enabled": true,
      "category": "monetization",
      "apiKey": "sk-p••••••••abcd",  // Masked
      "apiConfig": "{...}",
      "metadata": "{...}"
    }
  ],
  "grouped": { "monetization": [...], "features": [...] },
  "categories": ["monetization", "features"]
}
```

### POST /api/superadmin/features
Create new feature toggle

**Body:**
```json
{
  "key": "new_feature",
  "label": "New Feature",
  "description": "Optional description",
  "category": "features",
  "enabled": true,
  "apiKey": "your-api-key-here",  // Will be encrypted
  "apiConfig": "{...}",
  "metadata": "{...}"
}
```

### PUT /api/superadmin/features
Update feature toggle

**Body:**
```json
{
  "key": "where_to_stay",
  "enabled": false,  // Disable feature
  "apiKey": "new-api-key"  // Update API key
}
```

---

## 📝 Best Practices

### 1. **Never commit API keys to Git**
- Use environment variables for development
- Store production keys in Supabase via superadmin dashboard

### 2. **Rotate API keys regularly**
- Update keys every 90 days
- Use the PUT endpoint to update without downtime

### 3. **Monitor feature usage**
- Check audit logs for feature changes
- Monitor API usage in provider dashboards

### 4. **Test with feature disabled**
- Always test UI with `enabled: false`
- Ensure graceful degradation

### 5. **Use metadata for tracking**
- Store commission rates in metadata
- Track affiliate IDs for revenue reporting

---

## 🐛 Troubleshooting

### Feature not showing up?
1. Check if feature is enabled in database
2. Verify seed script ran successfully
3. Check browser console for errors

### API key not working?
1. Verify key is correctly encrypted
2. Check API provider dashboard for key validity
3. Ensure `apiConfig` has correct endpoint

### Can't access superadmin features?
1. Verify JWT token in cookie
2. Check user role is 'admin' or 'superadmin'
3. Review audit logs for failed attempts

---

## 📈 Future Enhancements

- [ ] A/B testing support with percentage-based rollouts
- [ ] Feature usage analytics dashboard
- [ ] Automatic API key rotation
- [ ] Webhook notifications for feature changes
- [ ] Role-based feature access (admin vs superadmin)
- [ ] Feature dependency management
- [ ] Import/export feature configurations

---

## 📚 Related Files

- **Schema**: `prisma/schema.prisma` (FeatureToggle model)
- **Encryption**: `src/lib/api-key-encryption.ts`
- **API Routes**: `src/app/api/superadmin/features/route.ts`
- **Seed Script**: `scripts/seed-feature-toggles.ts`
- **UI Component**: `src/components/superadmin/FeatureToggles.tsx`
- **Frontend Components**:
  - `src/components/itinerary/HotelBookingWidget.tsx`
  - `src/components/itinerary/TravelInsuranceRecommendations.tsx`

---

## ✅ Checklist

- [x] Database schema updated
- [x] API key encryption implemented
- [x] Superadmin API routes protected
- [x] Audit logging added
- [x] Seed script created
- [x] Documentation written
- [ ] Run SQL migration in production
- [ ] Configure API keys for Where to Stay
- [ ] Configure API keys for Travel Insurance
- [ ] Update frontend components to check feature.enabled
- [ ] Test with features disabled
- [ ] Monitor audit logs

---

**Last Updated**: 2026-05-20  
**Version**: 1.0.0
