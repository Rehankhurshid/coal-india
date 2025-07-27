# Group Creation Debugging Guide

## Current Status

### ✅ Database Infrastructure

- **Tables exist**: messaging_groups, messaging_group_members, messaging_messages
- **RLS enabled**: All messaging tables have RLS enabled
- **RLS policies**: All policies are in place (create_groups, view_groups, etc.)
- **Create policy**: Set to `true` (anyone can create groups)

### ✅ Authentication System

- JWT-based authentication implemented
- Session management in place
- Auth headers being sent via Bearer token

## Debugging Steps

### 1. Check Browser Console

Open your browser and navigate to http://localhost:3001/messaging

Press F12 to open developer tools and check:

1. **Network tab**:

   - Look for POST request to `/api/messaging/groups`
   - Check request headers for Authorization Bearer token
   - Check response status and body

2. **Console tab**:
   - Look for any JavaScript errors
   - Check for authentication errors
   - Look for group creation logs

### 2. Common Issues and Solutions

#### Issue 1: Authentication Not Working

**Symptoms**: 401 Unauthorized errors
**Solution**:

```javascript
// Check if you're logged in
localStorage.getItem("auth_session");

// If null, you need to login first
```

#### Issue 2: User Context Not Set for RLS

**Symptoms**: 403 Forbidden or policy violation errors
**Check**: The `set_current_user_id` function exists in database

```sql
-- Run this in Supabase SQL editor to verify
SELECT proname FROM pg_proc WHERE proname = 'set_current_user_id';
```

#### Issue 3: Missing Required Fields

**Symptoms**: 400 Bad Request
**Check**: Ensure group creation includes:

- name (required)
- description (optional)
- memberIds (optional array)

### 3. Test Group Creation via API

You can test the API directly using curl or the browser console:

```javascript
// Run this in browser console while on http://localhost:3001
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
      name: "Test Group",
      description: "Testing group creation",
      memberIds: [],
    }),
  })
    .then((res) => res.json())
    .then((data) => console.log("Response:", data))
    .catch((err) => console.error("Error:", err));
}
```

### 4. Check Server Logs

Look for server-side logs in your terminal running `npm run dev`:

- `[api/messaging/groups] POST:` logs show the flow
- Authentication logs from `[server-auth]`
- Any Supabase errors

### 5. Verify RLS Functions

Run this in Supabase SQL editor:

```sql
-- Check if current_user_id function exists
SELECT current_user_id();

-- If it returns NULL or error, run:
SELECT set_current_user_id('your-employee-id');
SELECT current_user_id(); -- Should now return your ID
```

### 6. Direct Database Test

Try creating a group directly in Supabase:

```sql
-- Replace 'your-employee-id' with your actual employee ID
INSERT INTO messaging_groups (name, description, created_by)
VALUES ('Direct Test Group', 'Created via SQL', 'your-employee-id')
RETURNING *;
```

If this works, the issue is in the API layer, not the database.

## Quick Fixes to Try

### 1. Clear Browser Storage

```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
// Then login again
```

### 2. Check Employee ID Format

Make sure your employee ID matches what's in the employees table:

```sql
-- In Supabase SQL editor
SELECT emp_code FROM employees WHERE emp_code = 'your-id';
```

### 3. Temporary Dev Mode Test

Add `?userId=your-employee-id` to the URL while in development:

```
http://localhost:3001/api/messaging/groups?userId=your-employee-id
```

## Expected Flow

1. User logs in → Gets JWT token
2. Token stored in localStorage
3. User clicks "Create Group"
4. Frontend calls POST /api/messaging/groups with Bearer token
5. API validates token and gets employee ID
6. API sets RLS context with set_current_user_id()
7. API inserts into messaging_groups
8. API adds creator as admin in messaging_group_members
9. Returns success with new group data

## Quick Test Endpoint

I've created a test endpoint to diagnose the issue. Navigate to:

```
http://localhost:3001/api/test-group-creation
```

This will run several tests and show you:

- Whether you're authenticated
- If you're using service role key vs anon key
- Whether RLS context is being set properly
- If direct database inserts work
- Whether your employee ID exists in the database

## Common Solution: Use Service Role Key

The most reliable solution is to use the Supabase service role key for server-side operations:

1. Get your service role key from Supabase dashboard:

   - Go to Settings → API
   - Copy the "service_role" key (keep this secret!)

2. Add to your `.env.local`:

   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Restart your development server

This bypasses RLS entirely for server-side operations, which is appropriate for API routes.

## Need More Help?

If none of the above resolves the issue:

1. Run the test endpoint and share the results
2. Share the exact error message from browser console
3. Share the network request/response details
4. Share any server logs from the terminal

This will help pinpoint exactly where the group creation is failing.
