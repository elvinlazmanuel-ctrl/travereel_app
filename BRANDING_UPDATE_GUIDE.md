# Branding Rebrand Implementation Guide

## ✅ Completed Updates

### 1. Core Color System ✅
**File**: `src/app/globals.css`

Updated CSS custom properties with new brand colors:

| Variable | Old Value | New Value | Hex |
|----------|-----------|-----------|-----|
| `--primary` | `oklch(0.637 0.237 25.33)` | `oklch(0.25 0.05 270)` | `#0B0B2A` |
| `--secondary` | `oklch(0.65 0.18 185)` | `oklch(0.30 0.06 270)` | `#22255A` |
| `--accent` | `oklch(0.80 0.18 85)` | `oklch(0.55 0.15 250)` | `#2F5C9B` |
| `--ring` | `oklch(0.637 0.237 25.33)` | `oklch(0.55 0.15 250)` | `#2F5C9B` |

**New Brand Color Variables:**
```css
--brand-primary: #0B0B2A;
--brand-secondary: #22255A;
--brand-accent-1: #2F5C9B;
--brand-accent-2: #5CA5CD;
--brand-accent-3: #E58BEA;
```

**Updated Gradients:**
- `--gradient-primary`: `#0B0B2A → #22255A`
- `--gradient-accent`: `#2F5C9B → #5CA5CD`
- `--gradient-vibrant`: `#2F5C9B → #E58BEA`
- `--gradient-sunset`: `#5CA5CD → #E58BEA`
- `--gradient-ocean`: `#2F5C9B → #5CA5CD`
- `--gradient-forest`: `#2F5C9B → #22255A`
- `--gradient-sky`: `#0B0B2A → #2F5C9B`
- `--gradient-dawn`: `#E58BEA → #5CA5CD`

**Dark Mode Updates:**
All colors adjusted for proper contrast in dark mode while maintaining the new brand palette.

---

### 2. Logo Update ✅
**File**: `src/app/layout.tsx`

Changed logo references from `/logo.png` to `/new-logo.png`:
- Favicon icon
- Apple touch icon
- PWA manifest references
- Windows tile color: `#FF6B6B → #0B0B2A`

**New Logo**: `public/new-logo.png`
- Features a globe with an airplane orbiting around it
- Uses blue and purple gradient colors matching the new palette
- Transparent background for versatility

---

### 3. Superadmin Components ✅
Updated button and accent colors in:

**SuperAdminAuth.tsx:**
- Logo background: `#FF6B6B → #2F5C9B`
- Login button: `#FF6B6B → #2F5C9B`

**SuperAdminDashboard.tsx:**
- Sidebar logo background: `#FF6B6B → #2F5C9B`
- Active tab background: `#FF6B6B → #2F5C9B`
- User avatar background: `#FF6B6B → #2F5C9B`

**FeatureToggles.tsx:**
- "Add Feature" button: `#FF6B6B → #2F5C9B`
- "Create" button: `#FF6B6B → #2F5C9B`

---

## 📋 Remaining Updates Required

The following components still have **hardcoded old colors** and need manual updates:

### Priority 1 - High Visibility Components

#### SettingsPage.tsx (13 instances)
**Old Colors**: `#FF6B6B`, `#FF8C42`, `#2EC4B6`

```typescript
// Lines to update:
527: border-[#FF6B6B]/20 → border-brand-primary/20
529: from-[#FF6B6B]/20 to-[#FF8C42]/20 → from-brand-accent-1/20 to-brand-accent-2/20
535: bg-[#FF8C42] → bg-brand-accent-2
557: hover:border-[#FF8C42] hover:text-[#FF8C42] → hover:border-brand-accent-2
658: text-[#2EC4B6] → text-brand-accent-2
735: bg-[#FF6B6B] border-[#FF6B6B]/30 → bg-brand-primary border-brand-primary/30
761: border-[#FF6B6B]/20 → border-brand-primary/20
766: from-[#FF6B6B]/20 to-[#FF8C42]/20 → from-brand-accent-1/20 to-brand-accent-2/20
781: bg-[#FF8C42] → bg-brand-accent-2
789: bg-[#FF6B6B] → bg-brand-primary
844: hover:border-[#FF8C42] → hover:border-brand-accent-2
850: text-[#2EC4B6] → text-brand-accent-2
863: bg-[#FF8C42] → bg-brand-accent-2
925: bg-[#FF8C42] → bg-brand-accent-2
963: bg-[#FF8C42] → bg-brand-accent-2
```

#### PWAInstallPrompt.tsx (2 instances)
```typescript
104: from-[#FF6B6B] to-[#FF8C42] → from-brand-primary to-brand-accent-2
132: from-[#FF6B6B] to-[#FF8C42] → from-brand-primary to-brand-accent-2
```

#### ExternalShare.tsx (2 instances)
```typescript
111: from-[#FF6B6B] to-[#FF8C42] → from-brand-primary to-brand-accent-2
124: from-[#FF6B6B] to-[#FF8C42] → from-brand-primary to-brand-accent-2
```

#### StepDays.tsx (6 instances)
```typescript
87: from-[#FF6B6B] via-[#FF8C42] to-[#FFBA49] → from-brand-primary via-brand-accent-1 to-brand-accent-2
99: from-[#FF6B6B]/5 to-[#FF8C42]/5 → from-brand-primary/5 to-brand-accent-2/5
100: text-[#FF6B6B] → text-brand-primary
108: from-[#2EC4B6]/5 to-[#FFBA49]/5 → from-brand-accent-2/5 to-brand-accent-3/5
109: text-[#2EC4B6] → text-brand-accent-2
127: from-[#FFBA49]/5 to-[#FF8C42]/5 → from-brand-accent-3/5 to-brand-accent-2/5
```

#### StepTravelType.tsx (4 instances)
```typescript
20: border-[#FF6B6B] → border-brand-primary
30: border-[#FF8C42] → border-brand-accent-2
40: border-[#2EC4B6] → border-brand-accent-2
50: border-[#FFBA49] → border-brand-accent-3
```

---

### Priority 2 - Superadmin Components

#### PlatformSettings.tsx (8 instances)
```typescript
69: '#FF6B6B' → '#2F5C9B'
70: '#FF8C42' → '#5CA5CD'
165: color: '#FF6B6B' → color: '#2F5C9B'
226: '#FF6B6B' → '#2F5C9B'
234: '#FF6B6B' → '#2F5C9B'
245: '#FF8C42' → '#5CA5CD'
253: '#FF8C42' → '#5CA5CD'
264: backgroundColor: '#FF6B6B' → backgroundColor: '#2F5C9B'
278: color: '#FF8C42' → color: '#5CA5CD'
323: backgroundColor: '#FF6B6B' → backgroundColor: '#2F5C9B'
337: color: '#2EC4B6' → color: '#5CA5CD'
377: backgroundColor: '#FF6B6B' → backgroundColor: '#2F5C9B'
391: color: '#8338EC' → color: '#E58BEA'
458: backgroundColor: '#FF6B6B' → backgroundColor: '#2F5C9B'
```

#### DashboardOverview.tsx (3 instances)
```typescript
191: backgroundColor: '#E9C46A' → backgroundColor: '#E58BEA'
286: borderColor: '#FF6B6B40' → borderColor: '#2F5C9B40'
288: backgroundColor: '#FF6B6B10' → backgroundColor: '#2F5C9B10'
```

#### DataTablePage.tsx (2 instances)
```typescript
130: backgroundColor: '#FF6B6B20', color: '#FF6B6B', borderColor: '#FF6B6B40' → 
     backgroundColor: '#2F5C9B20', color: '#2F5C9B', borderColor: '#2F5C9B40'
709: backgroundColor: '#FF6B6B' → backgroundColor: '#2F5C9B'
```

---

### Priority 3 - Itinerary Components

#### AIGenerateResult.tsx (1 instance)
```typescript
304: '#2EC4B6' : '#FF6B6B' → '#5CA5CD' : '#2F5C9B'
```

---

## 🎨 Color Mapping Guide

### Old → New Color Mapping

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `#FF6B6B` (coral) | `#2F5C9B` (blue) | Primary actions, buttons, highlights |
| `#FF8C42` (orange) | `#5CA5CD` (light blue) | Secondary accents, hover states |
| `#FFBA49` (gold) | `#E58BEA` (purple) | Tertiary accents, special highlights |
| `#2EC4B6` (teal) | `#5CA5CD` (light blue) | Success states, info highlights |
| `#8338EC` (purple) | `#E58BEA` (light purple) | Special features, premium |
| `#E9C46A` (yellow) | `#E58BEA` (purple) | Warnings, attention |

### CSS Variable Usage

Instead of hardcoded colors, use CSS variables:

```tsx
// ❌ Old approach
className="bg-[#FF6B6B] text-white"

// ✅ New approach
className="bg-brand-primary text-white"

// Or with opacity
className="bg-brand-accent-1/20"
```

### Gradient Usage

```tsx
//  Old approach
className="bg-gradient-to-r from-[#FF6B6B] to-[#FF8C42]"

// ✅ New approach
className="bg-gradient-primary" // Uses --gradient-primary
// OR
className="bg-gradient-to-r from-brand-primary to-brand-secondary"
```

---

## 🔧 Quick Update Script

To speed up the remaining updates, you can use this find-and-replace pattern:

### Find and Replace Patterns

1. **Replace all `#FF6B6B`** → `#2F5C9B`
2. **Replace all `#FF8C42`** → `#5CA5CD`
3. **Replace all `#FFBA49`** → `#E58BEA`
4. **Replace all `#2EC4B6`** → `#5CA5CD`
5. **Replace all `#8338EC`** → `#E58BEA`

**VS Code Multi-file Replace:**
1. Press `Ctrl+Shift+H` (Find in Files)
2. Enable "Use Regular Expression" (.*)
3. Search: `#FF6B6B`
4. Replace: `#2F5C9B`
5. Click "Replace All"
6. Repeat for other colors

---

## ✅ Testing Checklist

After completing all color updates:

### Visual Testing
- [ ] Homepage loads with new logo
- [ ] Favicon shows new logo in browser tab
- [ ] All buttons use new blue color (#2F5C9B)
- [ ] Gradients use new color combinations
- [ ] Superadmin dashboard uses new colors
- [ ] Settings page uses new colors
- [ ] Itinerary creation wizard uses new colors

### Dark Mode Testing
- [ ] Switch to dark mode
- [ ] Verify all colors have proper contrast
- [ ] Check text readability
- [ ] Verify gradients look good in dark mode

### Accessibility Testing
- [ ] Use browser dev tools to check contrast ratios
- [ ] Ensure WCAG AA compliance (4.5:1 for normal text)
- [ ] Test with color blindness simulator

### Component Testing
- [ ] SuperAdminAuth login page
- [ ] SuperAdminDashboard sidebar
- [ ] FeatureToggles page
- [ ] PlatformSettings page
- [ ] DataTablePage
- [ ] SettingsPage
- [ ] StepDays (itinerary wizard)
- [ ] StepTravelType
- [ ] PWAInstallPrompt
- [ ] ExternalShare
- [ ] AIGenerateResult

---

## 📊 Impact Analysis

### Files Modified (Completed)
1. ✅ `src/app/globals.css` - Complete color system
2. ✅ `src/app/layout.tsx` - Logo references
3. ✅ `src/components/superadmin/SuperAdminAuth.tsx` - Login button
4. ✅ `src/components/superadmin/SuperAdminDashboard.tsx` - Sidebar
5. ✅ `src/components/superadmin/FeatureToggles.tsx` - Buttons

### Files Needing Updates (Remaining)
1. ️ `src/components/settings/SettingsPage.tsx` - 13 instances
2. ⚠️ `src/components/superadmin/PlatformSettings.tsx` - 8 instances
3. ️ `src/components/itinerary/StepDays.tsx` - 6 instances
4. ️ `src/components/ui/PWAInstallPrompt.tsx` - 2 instances
5. ️ `src/components/ui/ExternalShare.tsx` - 2 instances
6. ⚠️ `src/components/itinerary/StepTravelType.tsx` - 4 instances
7. ⚠️ `src/components/superadmin/DashboardOverview.tsx` - 3 instances
8. ⚠️ `src/components/superadmin/DataTablePage.tsx` - 2 instances
9. ⚠️ `src/components/itinerary/AIGenerateResult.tsx` - 1 instance

**Total Remaining**: ~41 instances across 9 files

---

## 🚀 Deployment Notes

### Current Status
- ✅ Core branding system complete
- ✅ Logo updated
- ✅ Superadmin components updated
- ⚠️ User-facing components need manual updates

### Before Deploying
1. Complete all remaining color updates (see Priority 1-3 above)
2. Test in both light and dark mode
3. Verify logo displays correctly
4. Check all gradients and animations
5. Run accessibility audit

### After Deploying
1. Monitor for any visual regressions
2. Check browser console for errors
3. Verify PWA install prompt shows new logo
4. Test on mobile devices

---

## 📝 Additional Recommendations

### 1. Create a Theme Configuration File
Consider creating `src/lib/theme.ts` to centralize all brand colors:

```typescript
export const brandColors = {
  primary: '#0B0B2A',
  secondary: '#22255A',
  accent1: '#2F5C9B',
  accent2: '#5CA5CD',
  accent3: '#E58BEA',
} as const
```

### 2. Update Tailwind Config
Add brand colors to `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#0B0B2A',
        secondary: '#22255A',
        accent: {
          1: '#2F5C9B',
          2: '#5CA5CD',
          3: '#E58BEA',
        }
      }
    }
  }
}
```

### 3. Create a Migration Script
For future rebranding efforts, consider creating an automated script:

```bash
# Example: scripts/update-brand-colors.sh
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/#FF6B6B/#2F5C9B/g'
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/#FF8C42/#5CA5CD/g'
# etc.
```

---

**Last Updated**: 2026-05-20  
**Status**:  Partially Complete (Core system done, components need updates)  
**Next Steps**: Complete remaining 41 color replacements in 9 files
