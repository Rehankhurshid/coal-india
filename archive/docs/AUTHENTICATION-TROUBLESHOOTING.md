# Authentication & Group Creation Troubleshooting Guide

## Recent Authentication Fix

### Problem Identified

The OTP verification form was not properly storing the authentication session after successful verification. It was directly calling the API endpoint instead of using the `ClientAuthService.verifyOTP` method.

### Solution Applied

Updated `src/components/auth/otp-form.tsx` to use `ClientAuthService.verifyOTP` which:

1. Calls the verification API
2. Stores the session data in localStorage
3. Makes the authentication available for subsequent API calls

### Code Changes

```typescript
// Before (incorrect):
const response = await fetch('/api/auth/verify-otp', {...});

// After (correct):
const { ClientAuthService } = await import('@/lib/auth/client-auth');
const result = await ClientAuthService.verifyOTP(sessionId, otpValue);
```

## Testing Authentication & Group Creation

### 1. Test Authentication Flow

Visit `/test-auth` to run comprehensive authentication tests:

- View current authentication status
- Check localStorage session
- Run debug diagnostics
- Test group creation

### 2. Manual Testing Steps

#### Login Flow:

1. Go to `/login`
2. Enter employee ID (e.g., "3000")
3. Click "Send OTP"
4. In development mode, the OTP is displayed (default: "123456")
5. Enter the OTP or click "Skip" in development mode
6. Should redirect to home page

#### Verify Authentication:

1. Open browser DevTools
2. Go to Application > Local Storage
3. Look for `auth_session` key
4. Should contain: `accessToken`, `refreshToken`, `employeeId`, `expiresAt`

#### Test Group Creation:

1. Ensure you're logged in
2. Go to `/messaging` or `/test-auth`
3. Try creating a new group
4. Check console for any errors

### 3. Debug Endpoint

Access `/api/auth/debug` (requires authentication) to see:

- Authentication status
- Employee details
- Database tables
- RLS policies
- Test group creation result

### Common Issues & Solutions

#### Issue: "Authentication required" error

**Solution:**

1. Clear localStorage: `localStorage.clear()`
2. Log in again
3. Check that `auth_session` is stored

#### Issue: Group creation fails with "Failed to create group"

**Solution:**

1. Check `/api/auth/debug` for RLS policy issues
2. Ensure user exists in employees table
3. Check Supabase logs for detailed errors

#### Issue: Authentication works but expires quickly

**Solution:**

1. Check token expiry time in auth config
2. Ensure refresh token mechanism is working
3. Monitor network tab for 401 errors

### Authentication Architecture

```
Client Side:
1. Login Form → sends employee ID
2. OTP Form → verifies OTP using ClientAuthService
3. ClientAuthService → stores session in localStorage
4. API calls → include auth headers from ClientAuthService

Server Side:
1. /api/auth/login → creates session, sends OTP
2. /api/auth/verify-otp → validates OTP, returns tokens
3. getAuthenticatedUser → validates tokens on each request
4. Supabase RLS → enforces row-level security
```

### Key Files

- **Client Auth:** `/src/lib/auth/client-auth.ts`
- **Server Auth:** `/src/lib/auth/server-auth.ts`
- **Auth Config:** `/src/lib/auth/auth-config.ts`
- **OTP Form:** `/src/components/auth/otp-form.tsx`
- **Login Form:** `/src/components/auth/login-form.tsx`
- **Protected Route:** `/src/components/auth/protected-route.tsx`

### Environment Variables Required

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
AUTH_JWT_SECRET=your-jwt-secret
```

### Debugging Commands

```bash
# Check if tables exist in Supabase
npm run supabase db dump

# View server logs
npm run dev

# Clear all auth data (browser console)
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Testing Checklist

- [ ] Can log in with employee ID
- [ ] OTP verification works
- [ ] Session is stored in localStorage
- [ ] Can access protected routes
- [ ] Can create groups
- [ ] Can send messages
- [ ] Token refresh works
- [ ] Logout clears session

### Need Help?

1. Check browser console for errors
2. Visit `/test-auth` for diagnostics
3. Check `/api/auth/debug` response
4. Review Supabase logs
5. Ensure all environment variables are set
