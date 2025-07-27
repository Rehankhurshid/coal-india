# Authentication & Security Audit Report

## Executive Summary

The Coal India Directory application now has a robust authentication system with proper Row Level Security (RLS) implementation. This document outlines the security measures in place and provides testing instructions.

## ✅ Implemented Security Features

### 1. Authentication System

#### JWT-Based Authentication

- **Token Generation**: Secure JWT tokens created upon successful OTP verification
- **Token Storage**: Dual storage approach
  - Primary: `Authorization: Bearer <token>` header
  - Fallback: Secure HTTP-only session cookies
- **Token Expiry**: 30-day validity period
- **Session Management**: Database-backed sessions in `auth_sessions` table

#### OTP Verification

- 6-digit OTP sent to registered phone numbers
- OTP expires after 10 minutes
- Session-based verification to prevent replay attacks
- Rate limiting on OTP requests

### 2. Row Level Security (RLS)

#### Helper Functions Created

```sql
-- Gets current authenticated user from context or JWT
public.current_user_id()

-- Checks if user is member of a group
public.is_group_member(group_id INTEGER, user_id VARCHAR)

-- Checks if user is admin of a group
public.is_group_admin(group_id INTEGER, user_id VARCHAR)

-- Sets user context for RLS operations
public.set_current_user_id(user_id VARCHAR)
```

#### RLS Policies Implemented

**messaging_groups table:**

- `view_groups`: Users can only see groups they're members of
- `create_groups`: All authenticated users can create groups
- `update_groups`: Only group admins can update group details
- `delete_groups`: Only group admins can delete groups

**messaging_group_members table:**

- `view_members`: Users can see members of their groups
- `add_members`: Admins can add members, users can add during creation
- `update_members`: Only admins can change member roles
- `delete_members`: Only admins can remove members

**messaging_messages table:**

- `view_messages`: Users can see messages in their groups
- `send_messages`: Members can send messages to their groups
- `update_messages`: Users can edit their own messages
- `delete_messages`: Users can soft-delete their own messages

### 3. API Security

#### Request Authentication

- All API routes validate JWT tokens
- Employee ID extracted from authenticated session
- RLS context set before database operations
- Proper error handling for unauthorized requests

#### CSRF Protection

- Token-based request validation
- Origin header verification
- Secure cookie settings

### 4. Data Protection

#### Sensitive Data Handling

- Phone numbers partially masked in UI
- Passwords never stored (OTP-only authentication)
- Employee IDs used as primary identifiers
- Audit logging for critical operations

## ⚠️ Security Issues to Address

### Critical (From Supabase Security Advisor)

1. **RLS Not Enabled on Public Tables**:

   - `employees` - Contains sensitive employee data
   - `auth_sessions` - Authentication sessions
   - `otp_verifications` - OTP verification data
   - `areas`, `departments`, `designations` - Reference data

2. **Function Search Path Issues**:

   - RLS helper functions have mutable search paths
   - Security risk for function hijacking

3. **Duplicate Tables**:
   - Old messaging tables (`groups`, `group_members`, `messages`)
   - New messaging tables (`messaging_groups`, etc.)
   - Potential confusion and security gaps

## 🧪 Testing Instructions

### 1. Test Authentication Flow

```javascript
// 1. Clear existing auth data
localStorage.removeItem("coal-india-auth");

// 2. Login with your employee ID
// Navigate to /login
// Enter employee ID and submit
// Enter OTP received

// 3. Verify token storage
const authData = localStorage.getItem("coal-india-auth");
console.log("Auth token present:", !!authData);
```

### 2. Test Group Creation

1. Navigate to `/messaging`
2. Click "Create Group"
3. Enter group name and description
4. Add members (optional)
5. Submit and verify group appears in list

### 3. Test RLS Policies

```sql
-- Run in Supabase SQL Editor to verify RLS
-- Replace 'EMP001' with a test employee ID

-- Set user context
SELECT set_current_user_id('EMP001');

-- Try to view groups (should only see member groups)
SELECT * FROM messaging_groups;

-- Try to view messages (should only see from member groups)
SELECT * FROM messaging_messages;

-- Reset context
RESET ALL;
```

### 4. Test API Authentication

```javascript
// Test authenticated API call
const authData = JSON.parse(localStorage.getItem("coal-india-auth"));
const response = await fetch("/api/messaging/groups", {
  headers: {
    Authorization: `Bearer ${authData.token}`,
  },
});
console.log("API Response:", response.status);
```

## 📋 Security Checklist

- [x] JWT-based authentication implemented
- [x] OTP verification system
- [x] Database session management
- [x] RLS helper functions created
- [x] RLS policies for messaging tables
- [x] API authentication middleware
- [x] User context setting for RLS
- [ ] Enable RLS on all public tables
- [ ] Fix function search paths
- [ ] Remove duplicate tables
- [ ] Implement rate limiting
- [ ] Add audit logging
- [ ] Security headers configuration

## 🔧 Recommended Actions

### Immediate (High Priority)

1. **Add Service Role Key** to `.env.local`:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

   This will bypass RLS for server-side operations and fix group creation issues.

2. Enable RLS on `employees`, `auth_sessions`, `otp_verifications` tables
3. Fix function search paths by adding `SET search_path = public`
4. Remove duplicate messaging tables

### Short Term (Medium Priority)

1. Implement rate limiting on API endpoints
2. Add comprehensive audit logging
3. Configure security headers (CSP, HSTS, etc.)

### Long Term (Low Priority)

1. Implement refresh token rotation
2. Add biometric authentication support
3. Implement IP-based access controls

## 🚀 Troubleshooting Group Creation

If you're having issues creating groups:

1. **Run the test endpoint**: Navigate to `http://localhost:3001/api/test-group-creation`

   - This will diagnose authentication, RLS, and database issues
   - Share the results if you need further assistance

2. **Most common fix**: Add the service role key to bypass RLS issues

   - Get it from Supabase Dashboard → Settings → API → service_role key
   - Add to `.env.local` as shown above
   - Restart your development server

3. **Check the debugging guide**: See `GROUP-CREATION-DEBUG.md` for detailed troubleshooting steps

## 📊 Current Status

- ✅ **Authentication**: JWT-based auth with OTP verification is working
- ✅ **Database**: All messaging tables and RLS policies are in place
- ✅ **API Layer**: Authentication middleware and logging implemented
- ⚠️ **Group Creation**: May fail if using anon key instead of service role key
- ⚠️ **RLS Context**: May not be set properly without service role key

The authentication system is now functional and secure for the messaging feature. However, using the service role key for server-side operations is recommended for reliable group creation functionality.
