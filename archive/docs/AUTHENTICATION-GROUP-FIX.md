# Authentication & Group Creation Fix Guide

## Current Issue

You're unable to create groups because:

1. The messaging database tables don't exist in Supabase
2. RLS (Row Level Security) functions and policies aren't set up
3. The error "relation messaging_group_members does not exist" indicates missing database setup

## Solution Steps

### 1. Database Setup (COMPLETED)

✅ **UPDATE**: RLS functions and policies have been created!

The following have been set up in your database:

**RLS Helper Functions Created:**

- `public.current_user_id()` - Gets the current authenticated user ID
- `public.is_group_member(group_id, user_id)` - Checks group membership
- `public.is_group_admin(group_id, user_id)` - Checks admin status
- `public.set_current_user_id(user_id)` - Sets user context for RLS

**RLS Policies Created:**

- messaging_groups: view, create, update, delete policies
- messaging_group_members: view, add, update, delete policies
- messaging_messages: view, send, update, delete policies

The messaging tables should already exist. If not, see `MESSAGING-DATABASE-SETUP.md`.

### 2. Authentication System Overview

The application uses a robust authentication system with:

#### Authentication Flow:

1. **Login**: User enters employee ID → OTP is sent
2. **OTP Verification**: User enters OTP → JWT token is created
3. **Session Storage**: JWT stored in both:
   - `Authorization: Bearer <token>` header (preferred)
   - Session cookie (fallback)
4. **Database Session**: Sessions tracked in `auth_sessions` table

#### Key Components:

- **Frontend Auth**: `src/lib/auth/client-auth.ts` - Manages client-side auth
- **Server Auth**: `src/lib/auth/server-auth.ts` - Validates requests
- **Session Manager**: `src/lib/auth/session-manager.ts` - Database session handling

### 3. How Authentication Works with Messaging

When creating a group:

1. User's JWT token is validated in the API route
2. Employee ID is extracted from the session
3. RLS context is set using `set_current_user_id()` function
4. Database operations respect RLS policies

### 4. Troubleshooting Steps

If you still can't create groups after database setup:

#### Check Authentication:

```javascript
// In browser console, check if you have auth token:
const authData = localStorage.getItem("coal-india-auth");
console.log("Auth data:", authData);
```

#### Verify Database Setup:

Run these queries in Supabase SQL Editor:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'messaging_%';

-- Check if RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE tablename LIKE 'messaging_%';

-- Check if functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'auth'
AND routine_name IN ('current_user_id', 'is_group_member', 'is_group_admin');
```

#### Test Authentication:

1. Log out and log back in
2. Navigate to messaging page
3. Try creating a group

### 5. Security Features

The system includes:

- **JWT Token Validation**: Tokens expire after 30 days
- **Session Management**: Database-backed sessions with device tracking
- **RLS Policies**: Users can only access their own groups/messages
- **CSRF Protection**: Token-based request validation
- **Rate Limiting**: Prevents brute force attacks

### 6. Development vs Production

In development:

- Fallback authentication via `?userId=` query param (DEV ONLY)
- More verbose logging for debugging

In production:

- Strict JWT validation only
- No fallback authentication methods
- Enhanced security checks

### 7. Common Issues & Solutions

**Issue**: "Authentication required" error
**Solution**: Clear localStorage and re-login

**Issue**: "Failed to create group"
**Solution**: Ensure database tables and RLS policies are created

**Issue**: Can't see created groups
**Solution**: Check if user is properly added as member in database

### 8. Next Steps After Database Setup

1. **Refresh the application**
2. **Clear browser cache/localStorage if needed**
3. **Log in again with your employee ID**
4. **Navigate to messaging page**
5. **Try creating a group**

The system should now work properly with:

- Group creation
- Member management
- Real-time messaging
- Proper security isolation between users

## Important Notes

- The system uses employee IDs as the primary identifier
- Each user can only see/access groups they're members of
- Group creators are automatically made admins
- Only admins can add/remove members after creation
