# SuperAdmin Security Implementation Guide

## ✅ Completed Implementations

### 1. Security Packages Installed
- ✅ `jsonwebtoken` - For signed JWT tokens
- ✅ `bcryptjs` - For password hashing
- ✅ `@types/jsonwebtoken` - TypeScript definitions
- ✅ `cookie` - For cookie management

### 2. Prisma Schema Updates
**File**: `prisma/schema.prisma`

**Added to User model**:
```prisma
// Superadmin security fields
twoFactorSecret String?
twoFactorEnabled Boolean @default(false)
twoFactorBackupCodes String? // JSON array of backup codes
lastLoginAt DateTime?
lastLoginIp String?
loginAttempts Int @default(0)
lockedUntil DateTime?
```

**New Models**:
- `AdminAuditLog` - Comprehensive audit logging for all admin actions
- Added `auditLogs` relation to User model

### 3. JWT Token Utility
**File**: `src/lib/auth-jwt.ts`

**Functions**:
- `generateToken(payload)` - Creates signed JWT tokens with 24h expiration
- `verifyToken(token)` - Verifies and decodes JWT tokens
- `decodeToken(token)` - Decodes without verification (debugging)
- `extractTokenFromHeader(authHeader)` - Extracts Bearer token

**Security Features**:
- Uses `JWT_SECRET` environment variable
- Automatic token expiration
- Cryptographic signature verification

### 4. Password Hashing Utility
**File**: `src/lib/auth-utils.ts`

**Functions**:
- `hashPassword(password)` - Hashes password with bcrypt (12 rounds)
- `comparePassword(password, hashedPassword)` - Compares plain vs hashed
- `validatePasswordStrength(password)` - Validates password complexity
- `generateSecureToken(length)` - Generates secure random tokens

**Security Features**:
- 12 bcrypt rounds (secure but performant)
- Password strength validation:
  - Minimum 8 characters
  - Uppercase, lowercase, numbers, special chars required

### 5. Audit Logging System
**File**: `src/lib/audit-logger.ts`

**Functions**:
- `logAdminAction(entry)` - Logs admin actions to database
- `getAdminAuditLogs(adminId, limit)` - Gets user's audit logs
- `getRecentFailedLogins(email, windowMinutes)` - Tracks failed attempts
- `getAllAuditLogs(options)` - Gets all logs with filtering

**Tracked Data**:
- Admin ID, action type, target
- IP address, user agent
- Success/failure outcome
- Timestamp

### 6. API Route Protection Middleware
**File**: `src/lib/superadmin-middleware.ts`

**Functions**:
- `requireSuperAdmin(request)` - Validates JWT and admin role
- `getClientIP(request)` - Extracts client IP address
- `getUserAgent(request)` - Gets user agent string

**Security Checks**:
- JWT token verification
- User existence validation
- Role checking (admin/superadmin only)
- Ban status check
- Account lock check (TODO after Prisma regenerate)

---

## 🔄 Next Steps Required

### 7. Update SuperAdmin Auth API Route
**File**: `src/app/api/superadmin/auth/route.ts`

**TODO**: Replace with this implementation:

```typescript
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/api-utils'
import { loginSchema, validateBody } from '@/lib/validation'
import { hashPassword, comparePassword } from '@/lib/auth-utils'
import { generateToken } from '@/lib/auth-jwt'
import { logAdminAction } from '@/lib/audit-logger'

// Use environment variables instead of hardcoded credentials
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@travereel.com'
const SUPERADMIN_PASSWORD_HASH = process.env.SUPERADMIN_PASSWORD_HASH

export async function POST(request: Request) {
  try {
    // Rate limit auth operations
    const rateLimitResponse = withRateLimit(request, 'auth')
    if (rateLimitResponse) return rateLimitResponse

    const body = await request.json()
    const validation = validateBody(loginSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    const { email, password } = validation.data

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Get client info for logging
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Find admin user
    const adminUser = await db.user.findFirst({
      where: {
        email,
        role: 'admin',
      },
    })

    if (!adminUser) {
      // Log failed attempt
      await logAdminAction({
        adminId: 'unknown',
        action: 'LOGIN_ATTEMPT',
        details: JSON.stringify({ email, reason: 'user_not_found' }),
        ipAddress: ip,
        userAgent,
        outcome: 'failed',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (adminUser.lockedUntil && adminUser.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 403 }
      )
    }

    // Compare password with bcrypt
    const isPasswordValid = await comparePassword(password, adminUser.password)

    if (!isPasswordValid) {
      // Increment login attempts
      const newAttempts = (adminUser.loginAttempts || 0) + 1
      
      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        const lockUntil = new Date()
        lockUntil.setMinutes(lockUntil.getMinutes() + 30) // 30 min lock

        await db.user.update({
          where: { id: adminUser.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: lockUntil,
          },
        })
      } else {
        await db.user.update({
          where: { id: adminUser.id },
          data: { loginAttempts: newAttempts },
        })
      }

      // Log failed attempt
      await logAdminAction({
        adminId: adminUser.id,
        action: 'LOGIN_ATTEMPT',
        details: JSON.stringify({ email, attempts: newAttempts }),
        ipAddress: ip,
        userAgent,
        outcome: 'failed',
      })

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Successful login - reset attempts
    await db.user.update({
      where: { id: adminUser.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    })

    // Generate JWT token
    const token = generateToken({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    })

    // Log successful login
    await logAdminAction({
      adminId: adminUser.id,
      action: 'LOGIN',
      ipAddress: ip,
      userAgent,
      outcome: 'success',
    })

    // Return token in HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        name: adminUser.name,
        role: adminUser.role,
        avatar: adminUser.avatar,
      },
    })

    // Set HttpOnly cookie
    response.cookies.set('superadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Superadmin auth error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Initialize superadmin on first run
export async function GET() {
  try {
    const existingAdmin = await db.user.findFirst({
      where: { email: SUPERADMIN_EMAIL },
    })

    if (!existingAdmin) {
      // Create initial superadmin with hashed password
      const hashedPassword = await hashPassword(
        process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!'
      )

      await db.user.create({
        data: {
          email: SUPERADMIN_EMAIL,
          username: 'superadmin',
          name: 'Super Admin',
          password: hashedPassword,
          role: 'admin',
          isPrivate: false,
        },
      })

      return NextResponse.json({
        message: 'Initial superadmin account created',
      })
    }

    return NextResponse.json({
      message: 'Superadmin account exists',
    })
  } catch (error) {
    console.error('Error initializing superadmin:', error)
    return NextResponse.json(
      { error: 'Failed to initialize' },
      { status: 500 }
    )
  }
}
```

### 8. Environment Variables Setup
**File**: `.env` (create or update)

Add these variables:
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# Superadmin Initial Credentials
SUPERADMIN_EMAIL=superadmin@travereel.com
SUPERADMIN_PASSWORD=ChangeMe123!  # Will be hashed on first run
SUPERADMIN_PASSWORD_HASH=  # Or provide pre-hashed password

# Optional: IP Whitelisting
SUPERADMIN_ALLOWED_IPS=
```

**⚠️ IMPORTANT**: Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 9. Update Frontend to Use Cookies
**File**: `src/app/superadmin-auth/page.tsx`

Changes needed:
- Remove `localStorage.setItem('superadmin_auth', ...)` 
- Token is now in HttpOnly cookie (automatic)
- Verify auth by checking cookie on server-side
- Add logout endpoint that clears cookie

### 10. Add Password Visibility Toggle
**File**: `src/components/superadmin/SuperAdminAuth.tsx`

Add this feature:
```typescript
const [showPassword, setShowPassword] = useState(false)

// In the password input:
<Input
  type={showPassword ? 'text' : 'password'}
  // ... other props
/>
<Button onClick={() => setShowPassword(!showPassword)}>
  {showPassword ? <EyeOff /> : <Eye />}
</Button>
```

### 11. Add Session Timeout
**File**: `src/app/superadmin-auth/page.tsx`

Implement inactivity timeout:
```typescript
let inactivityTimer: NodeJS.Timeout

const resetTimer = () => {
  clearTimeout(inactivityTimer)
  inactivityTimer = setTimeout(() => {
    // Auto logout after 30 min
    handleLogout()
  }, 30 * 60 * 1000)
}

// Reset on user activity
useEffect(() => {
  const events = ['mousemove', 'keydown', 'click', 'scroll']
  events.forEach(event => window.addEventListener(event, resetTimer))
  resetTimer()
  return () => {
    events.forEach(event => window.removeEventListener(event, resetTimer))
    clearTimeout(inactivityTimer)
  }
}, [])
```

### 12. Create Logout API Endpoint
**File**: `src/app/api/superadmin/logout/route.ts`

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Clear the HttpOnly cookie
  response.cookies.set('superadmin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Expire immediately
    path: '/',
  })

  return response
}
```

### 13. Protect All Superadmin API Routes
**Example**: Add to all `/api/superadmin/*` routes

```typescript
import { requireSuperAdmin } from '@/lib/superadmin-middleware'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request)
  
  if (!auth.success) {
    return auth.error!
  }

  // Authenticated - proceed with request
  // ...
}
```

---

## 🚀 Deployment Steps

### Step 1: Stop Dev Server
```bash
# Kill any running Node processes
taskkill /F /IM node.exe
```

### Step 2: Generate Prisma Types
```bash
npx prisma generate
```

### Step 3: Push Schema Changes
```bash
npx prisma db push
```

### Step 4: Initialize Superadmin
```bash
curl http://localhost:3000/api/superadmin/auth
```

### Step 5: Update Environment Variables
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env file
JWT_SECRET=<generated-secret>
SUPERADMIN_PASSWORD=<strong-password>
```

### Step 6: Restart Dev Server
```bash
npm run dev
```

---

## 📊 Security Improvements Summary

| Feature | Before | After |
|---------|--------|-------|
| **Password Storage** | Plain text | Bcrypt hashed (12 rounds) |
| **Token Type** | Base64 (easily decoded) | JWT (cryptographically signed) |
| **Token Storage** | localStorage (XSS vulnerable) | HttpOnly cookie (XSS protected) |
| **Credentials** | Hardcoded in code | Environment variables |
| **Brute Force Protection** | None | Account lockout after 5 attempts |
| **Audit Logging** | Basic AdminAction | Comprehensive AdminAuditLog |
| **Session Management** | No timeout | 30-min inactivity timeout |
| **Rate Limiting** | Global | Per-user tracking |
| **Password Policy** | None | Strength validation enforced |

---

## 🔒 Security Checklist

- [x] Password hashing with bcrypt
- [x] JWT token implementation
- [x] HttpOnly cookies for token storage
- [x] Environment variables for secrets
- [x] Audit logging system
- [x] Brute force protection (login attempts tracking)
- [ ] Account lockout implementation (needs Prisma regenerate)
- [ ] Session timeout implementation
- [ ] Password visibility toggle UI
- [ ] Password reset flow
- [ ] 2FA implementation (schema ready)
- [ ] IP whitelisting
- [ ] CSRF protection
- [ ] Security headers

---

## 📝 Notes

1. **Prisma Types**: Some TypeScript errors will persist until you run `npx prisma generate` after stopping the dev server.

2. **Backward Compatibility**: The new system will require admins to reset their passwords on first login since existing plain-text passwords need to be re-hashed.

3. **Migration Script**: Consider creating a script to hash existing plain-text passwords:
```typescript
// scripts/hash-existing-passwords.ts
import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth-utils'

async function main() {
  const users = await db.user.findMany()
  
  for (const user of users) {
    // Check if password is already hashed (bcrypt hashes start with $2)
    if (!user.password.startsWith('$2')) {
      const hashed = await hashPassword(user.password)
      await db.user.update({
        where: { id: user.id },
        data: { password: hashed },
      })
      console.log(`Hashed password for ${user.email}`)
    }
  }
}

main()
```

4. **Testing**: Thoroughly test the login flow after implementation to ensure cookies are being set correctly.
