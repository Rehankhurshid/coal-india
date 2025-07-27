# Authentication and Group Creation Testing Guide

## Quick Test: Complete Authentication Flow

### Step 1: Test Login with a Real Employee

1. Open your browser and go to: http://localhost:3001/login
2. Use this test employee:

   - Employee ID: `14570535`
   - Phone: `9926176690`
   - Name: JIWAN LAL

3. Click "Send OTP"
4. In development mode, you'll see the OTP displayed on the screen
5. Enter the OTP and verify

### Step 2: Check Authentication Status

After logging in, open the browser console (F12) and run:

```javascript
// Check if you're authenticated
const session = JSON.parse(localStorage.getItem("auth_session"));
console.log("Session:", session);
console.log("Access Token:", session?.accessToken);
console.log("Employee ID:", session?.employeeId);
```

### Step 3: Test Group Creation via Console

While still logged in, run this in the browser console:

```javascript
// Test group creation
const authSession = JSON.parse(localStorage.getItem("auth_session"));
if (!authSession) {
  console.error("Not logged in! Please login first.");
} else {
  fetch("/api/messaging/groups", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authSession.accessToken}`,
    },
    body: JSON.stringify({
      name: "Test Group " + new Date().toLocaleTimeString(),
      description: "Testing group creation",
      memberIds: [],
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Group Creation Response:", data);
      if (data.error) {
        console.error("Error Details:", data.error);
      } else {
        console.log("✅ Group created successfully!", data);
      }
    })
    .catch((err) => console.error("Request failed:", err));
}
```

## Common Issues and Solutions

### Issue 1: "Not authenticated" Error

**Solution**: Make sure you're logged in first. Check localStorage:

```javascript
localStorage.getItem("auth_session"); // Should not be null
```

### Issue 2: RLS Policy Violations

**Symptoms**: Error message about policy violations or permissions

**Solution**: We need to ensure the service role key is being used. Check your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # This is critical!
```

To get your service role key:

1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (keep it secret!)
4. Add it to `.env.local`
5. Restart your dev server

### Issue 3: Testing the API Directly

Visit this URL in your browser while logged in:

```
http://localhost:3001/api/test-group-creation
```

This will show you detailed diagnostics about:

- Authentication status
- RLS context
- Direct database access
- Employee existence

## Development Mode Quick Login

For faster testing during development, you can use the "Skip" button on the OTP screen:

1. Login with any valid employee ID (e.g., `14570535`)
2. Click "Skip" in the development controls
3. You'll be logged in immediately

## Testing Group Creation in the UI

1. Navigate to: http://localhost:3001/messaging
2. Click the "+" button to create a new group
3. Fill in the group details
4. Check the browser console for any errors
5. Check the Network tab in DevTools for the API response

## SQL Queries for Debugging

Run these in your Supabase SQL editor:

```sql
-- Check if authentication tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('auth_sessions', 'otp_verifications', 'login_attempts');

-- Check recent login attempts
SELECT * FROM login_attempts
ORDER BY created_at DESC
LIMIT 10;

-- Check active sessions
SELECT * FROM auth_sessions
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

-- Check messaging groups
SELECT * FROM messaging_groups
ORDER BY created_at DESC
LIMIT 10;

-- Test RLS context setting
SELECT set_current_user_id('14570535');
SELECT current_user_id(); -- Should return '14570535'

-- Try direct group creation (bypasses API)
INSERT INTO messaging_groups (name, description, created_by)
VALUES ('Direct SQL Test', 'Created via SQL', '14570535')
RETURNING *;
```

## Quick Fix Checklist

1. ✅ Ensure all authentication tables exist (auth_sessions, otp_verifications, login_attempts)
2. ✅ Add SUPABASE_SERVICE_ROLE_KEY to .env.local
3. ✅ Restart the development server after adding the key
4. ✅ Clear browser cache and localStorage if having issues
5. ✅ Use a valid employee ID from the database
6. ✅ Check browser console for detailed error messages

## Expected Success Flow

1. User logs in → Gets JWT token
2. Token stored in localStorage and cookies
3. User creates group → API validates token
4. API uses service role key to bypass RLS
5. Group created in database
6. Creator added as admin member
7. Success response returned

## Still Having Issues?

1. Share the output from: http://localhost:3001/api/test-group-creation
2. Share any error messages from the browser console
3. Share the Network tab response for the group creation request
4. Check if the SUPABASE_SERVICE_ROLE_KEY is set in .env.local

The most common issue is the missing service role key. Once that's added, group creation should work immediately.
