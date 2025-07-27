# OTP Access Guide for Vercel Deployment

Since SMS services are not configured, here are multiple ways to access OTP codes when your app is deployed on Vercel.

## Method 1: Enable Test Mode (Recommended)

### Setup:

1. Go to your Vercel Dashboard
2. Navigate to your project → Settings → Environment Variables
3. Add these environment variables:
   ```
   ENABLE_OTP_TEST_MODE=true
   OTP_TEST_MODE_KEY=your-secret-key-here
   ```

### How it works:

- When test mode is enabled, OTPs follow a predictable pattern: `[last 4 digits of employee ID]99`
- Non-numeric characters are replaced with 0
- Example: Employee ID `ADMIN001` → OTP: `000199` (N becomes 0)
- The OTP is also included in the login API response

### Accessing OTP:

1. **Via API Response**: The OTP will be included in the `/api/auth/login` response
2. **Via Vercel Logs**: Check Functions logs in Vercel Dashboard

## Method 2: Use Test Mode Endpoint

### Setup:

With test mode enabled (see Method 1), you can use the dedicated endpoint:

### Usage:

```bash
# Get OTP for specific employee
GET https://your-app.vercel.app/api/auth/otp-test-mode?employeeId=ADMIN001&key=your-secret-key-here

# Get OTP by session ID
GET https://your-app.vercel.app/api/auth/otp-test-mode?sessionId=xxx&key=your-secret-key-here
```

## Method 3: Check Vercel Function Logs

### Steps:

1. Go to Vercel Dashboard
2. Click on your project
3. Navigate to "Functions" tab
4. Click on "View Function Logs"
5. Look for logs with format: `🔐 Test Mode OTP for ADMIN001: 000199`

### Direct Link:

`https://vercel.com/[your-team]/[your-project]/functions`

## Method 4: Use Supabase Dashboard

If auth tables are properly set up:

1. Go to your Supabase Dashboard
2. Navigate to Table Editor → `otp_verifications`
3. Find the most recent entry for your employee ID
4. The `otp_code` column contains the OTP

## Method 5: Browser Developer Tools

When test mode is enabled:

1. Open Browser DevTools (F12)
2. Go to Network tab
3. Login with employee ID
4. Find the `/api/auth/login` request
5. Check the Response tab - OTP will be included:
   ```json
   {
     "success": true,
     "sessionId": "...",
     "phoneNumber": "****6135",
     "message": "OTP sent successfully",
     "otp": "000199",
     "debug": "OTP included for test mode"
   }
   ```

## Security Considerations

⚠️ **Important**: Test mode should ONLY be used for testing/development!

Before going to production:

1. Remove or set `ENABLE_OTP_TEST_MODE=false`
2. Configure a proper SMS service (Twilio, AWS SNS, etc.)
3. Update the login route to send actual SMS messages
4. Remove any debug endpoints

## Troubleshooting

### OTP Not Showing?

1. Verify environment variables are set in Vercel
2. Redeploy after adding environment variables
3. Check that you're using the correct secret key
4. Look for error messages in Vercel Function logs

### Auth Tables Missing?

If you see "Auth tables not available" in logs:

1. Run the auth setup SQL scripts in Supabase
2. The app will still work with simplified session IDs in test mode

### Can't Access Debug Endpoints?

1. Ensure `ENABLE_OTP_TEST_MODE=true` is set
2. Verify you're passing the correct `OTP_TEST_MODE_KEY`
3. Check for CORS issues if calling from browser

## Quick Test

Test your setup with these employee IDs:

- `ADMIN001` → OTP: `000199` (in test mode)
- `EMP12345` → OTP: `234599` (in test mode)

## Moving to Production

When ready for production:

1. Set up SMS service (Twilio recommended)
2. Update `/api/auth/login/route.ts` to send real SMS
3. Disable test mode
4. Remove debug endpoints
5. Implement proper OTP delivery via SMS

---

For local development, OTP is always `123456` for convenience.
