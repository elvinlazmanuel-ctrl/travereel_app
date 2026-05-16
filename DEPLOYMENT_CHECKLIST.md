# 🔐 SuperAdmin Security Deployment Checklist

## Pre-Deployment Steps

### 1. Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output - you'll need it for the `.env` file.

### 2. Update Environment Variables
Create or update your `.env` file:
```env
JWT_SECRET=<paste-generated-secret-here>
SUPERADMIN_PASSWORD=<choose-strong-password>
```

### 3. Stop All Node Processes
**Windows:**
```powershell
taskkill /F /IM node.exe
```

**Linux/Mac:**
```bash
pkill -f node
```

### 4. Generate Prisma Types
```bash
npx prisma generate
```

### 5. Push Database Schema Changes
```bash
npx prisma db push
```

This will add:
- `twoFactorSecret`, `twoFactorEnabled`, `twoFactorBackupCodes`
- `lastLoginAt`, `lastLoginIp`, `loginAttempts`, `lockedUntil`
- New `AdminAuditLog` table

### 6. Migrate Existing Passwords
```bash
npx tsx scripts/migrate-passwords.ts
```

This script will:
- ✅ Hash all plain-text passwords with bcrypt
- ✅ Skip already-hashed passwords
- ✅ Verify hash integrity
- ✅ Report any errors

### 7. Initialize SuperAdmin Account
Start your dev server:
```bash
npm run dev
```

Then visit:
```
http://localhost:3000/api/superadmin/auth
```

This will create the initial superadmin account with:
- Email: `superadmin@travereel.com` (or from `.env`)
- Password: Hashed with bcrypt
- Role: `admin`

### 8. Test Login Flow
1. Visit `http://localhost:3000/superadmin-auth`
2. Login with your credentials
3. Verify:
   - ✅ Login succeeds
   - ✅ Cookie `superadmin_token` is set (check DevTools > Application > Cookies)
   - ✅ Dashboard loads
   - ✅ Password visibility toggle works
   - ✅ Session timeout is active (wait 30 min or check timer in console)

### 9. Test Logout
1. Click logout button
2. Verify:
   - ✅ Cookie is cleared
   - ✅ Redirected to login page
   - ✅ Cannot access dashboard without re-authenticating

### 10. Verify Audit Logging
Check the database for audit logs:
```bash
npx prisma studio
```

Look for:
- ✅ LOGIN entries in `AdminAuditLog`
- ✅ LOGOUT entries
- ✅ LOGIN_ATTEMPT entries (if you test with wrong password)

---

## Security Features Verification

### ✅ Implemented Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Password Hashing** | ✅ Complete | Bcrypt with 12 rounds |
| **JWT Tokens** | ✅ Complete | Signed, 24-hour expiration |
| **HttpOnly Cookies** | ✅ Complete | XSS protection |
| **Environment Variables** | ✅ Complete | No hardcoded secrets |
| **Audit Logging** | ✅ Complete | All admin actions tracked |
| **Session Timeout** | ✅ Complete | 30-min inactivity logout |
| **Password Visibility Toggle** | ✅ Complete | Eye icon in login form |
| **Logout Endpoint** | ✅ Complete | Clears HttpOnly cookie |
| **API Route Protection** | ✅ Complete | JWT verification middleware |
| **Login Tracking** | ✅ Complete | Last login time & IP |

### 🔜 Future Enhancements (Schema Ready)

| Feature | Status | Notes |
|---------|--------|-------|
| **2FA/TOTP** | 🔜 Ready | Schema fields added, needs UI |
| **Account Lockout** | 🔜 Ready | `lockedUntil` field added |
| **Brute Force Protection** | 🔜 Ready | `loginAttempts` field added |
| **IP Whitelisting** | 🔜 Ready | Config in `.env` |
| **Password Reset Flow** | 🔜 Planned | Token system ready |

---

## Production Deployment

### Vercel Environment Variables
Add these in Vercel Dashboard > Settings > Environment Variables:

```
JWT_SECRET=<your-production-secret>
SUPERADMIN_EMAIL=<your-admin-email>
SUPERADMIN_PASSWORD=<your-admin-password>
DATABASE_URL=<your-production-db-url>
```

### Security Headers
Ensure these headers are set in your Next.js config (`next.config.ts`):

```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### Database Migration
In production, use migrations instead of `db push`:

```bash
npx prisma migrate dev
npx prisma migrate deploy
```

---

## Troubleshooting

### Issue: Prisma generate fails
**Solution:** Stop all Node processes first
```bash
taskkill /F /IM node.exe
npx prisma generate
```

### Issue: Cookie not being set
**Check:**
1. Browser DevTools > Application > Cookies
2. Verify `superadmin_token` exists
3. Check if `Secure` flag is causing issues in development (should be false for http://)

### Issue: Login fails after migration
**Solution:** Run password migration script
```bash
npx tsx scripts/migrate-passwords.ts
```

### Issue: TypeScript errors on new fields
**Solution:** Regenerate Prisma types
```bash
npx prisma generate
```

### Issue: Session timeout not working
**Check:**
1. Console for timer logs
2. Browser DevTools > Performance > Timers
3. Verify activity events are firing

---

## Security Audit Commands

### Check for plain-text passwords
```bash
npx prisma db execute --stdin << EOF
SELECT email, password FROM "User" WHERE role = 'admin';
EOF
```
All passwords should start with `$2` (bcrypt hash).

### View recent audit logs
```bash
npx prisma db execute --stdin << EOF
SELECT * FROM "AdminAuditLog" ORDER BY "createdAt" DESC LIMIT 50;
EOF
```

### Check active sessions (by last login)
```bash
npx prisma db execute --stdin << EOF
SELECT email, "lastLoginAt", "lastLoginIp" FROM "User" WHERE role = 'admin';
EOF
```

---

## Post-Deployment Verification

### Manual Testing Checklist
- [ ] Login with correct credentials works
- [ ] Login with wrong credentials fails
- [ ] Cookie is HttpOnly and Secure (in production)
- [ ] Session timeout triggers after 30 min
- [ ] Logout clears cookie
- [ ] Cannot access `/superadmin-auth` dashboard without auth
- [ ] Audit logs are being created
- [ ] Password visibility toggle works
- [ ] All API routes require valid JWT

### Automated Testing (Future)
Consider adding:
- Jest tests for auth flow
- Integration tests for API routes
- E2E tests with Playwright

---

## Rollback Plan

If issues occur, you can rollback:

1. **Revert code changes:**
   ```bash
   git checkout HEAD~1
   ```

2. **Restore database (if needed):**
   ```bash
   npx prisma db push --force-reset
   ```

3. **Clear cookies in browser**

---

## Support

If you encounter issues:
1. Check this checklist
2. Review `SECURITY_IMPLEMENTATION_GUIDE.md`
3. Check browser DevTools console
4. Review server logs
5. Check Prisma Studio for database state

---

**Last Updated:** 2026-05-14
**Version:** 1.0.0
