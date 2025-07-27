# Production Authentication Fix Guide

## Issue

The production deployment is experiencing authentication failures with the error:

```
Failed to create OTP verification: {
  code: 'PGRST204',
  message: "Could not find the 'attempts' column of 'otp_verifications' in the schema cache"
}
```

## Root Cause

The production database is missing the `attempts` column in the `otp_verifications` table. This column is required for tracking OTP verification attempts and rate limiting.

## Fix Instructions

### Step 1: Run the Missing Column Fix

1. Log into your Supabase production project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL script:
   ```sql
   -- Fix missing 'attempts' column in production otp_verifications table
   DO $$
   BEGIN
       -- Check if the column exists
       IF NOT EXISTS (
           SELECT 1
           FROM information_schema.columns
           WHERE table_name = 'otp_verifications'
           AND column_name = 'attempts'
       ) THEN
           -- Add the missing column
           ALTER TABLE otp_verifications
           ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0;

           RAISE NOTICE 'Added missing "attempts" column to otp_verifications table';
       ELSE
           RAISE NOTICE 'Column "attempts" already exists in otp_verifications table';
       END IF;
   END $$;
   ```

### Step 2: Verify All Auth Tables

Run the complete auth tables setup to ensure all tables and columns exist:

```sql
-- Run the contents of src/lib/database/auth-tables-setup.sql
```

### Step 3: Verify RLS Functions

Ensure the RLS functions are properly set up:

```sql
-- Run the contents of src/lib/database/rls-functions.sql
```

### Step 4: Clear Supabase Cache

After running the SQL scripts, clear the Supabase schema cache:

1. In the Supabase dashboard, go to Settings > API
2. Click "Reload schema cache"
3. Wait 1-2 minutes for the cache to update

### Step 5: Test Authentication Flow

Test the authentication flow to ensure it works:

1. Try logging in with a valid employee ID
2. Verify OTP is created (check logs in production)
3. Complete the OTP verification
4. Confirm session is created

## Group Creation Issues

### Common Problems and Solutions

1. **Authentication Context Missing**

   - Ensure users are properly authenticated before creating groups
   - Check that the session token is being passed in API requests

2. **RLS Policies**

   - Verify RLS policies allow authenticated users to create groups
   - Check that `set_current_user_id` function exists and works

3. **Foreign Key Constraints**
   - Ensure all group members exist in the employees table
   - Verify the created_by field references a valid employee

### Testing Group Creation

Use the test endpoint to verify group creation works:

```bash
curl -X POST https://your-app.vercel.app/api/test-simple-group-creation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## Monitoring

### Set up Error Tracking

1. Monitor Vercel logs for authentication errors
2. Set up alerts for failed OTP creations
3. Track group creation success rates

### Regular Maintenance

1. Run `SELECT cleanup_expired_auth_records();` weekly
2. Monitor auth_sessions table size
3. Check for stale OTP records

## Prevention

To prevent similar issues in the future:

1. Always run database migrations in staging first
2. Use version control for database schemas
3. Set up automated tests for critical auth flows
4. Maintain a production deployment checklist

## Support

If issues persist after following this guide:

1. Check Vercel function logs for detailed errors
2. Verify all environment variables are set correctly
3. Ensure Supabase service role key has proper permissions
4. Contact support with specific error messages and timestamps
