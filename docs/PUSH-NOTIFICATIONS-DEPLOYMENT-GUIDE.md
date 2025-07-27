# Push Notifications Deployment Guide

## Current Status

✅ **Code Implementation**: Complete
✅ **Service Worker**: Ready (`public/worker/index.js`)  
✅ **UI Components**: Bell icon in chat header
✅ **API Endpoints**: All push notification endpoints ready
❌ **Database Table**: Needs to be created in production
❌ **VAPID Keys**: Need to be added to Vercel
❌ **Environment Variables**: Need to be configured

## Deployment Steps

### Step 1: Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Push Notifications Setup for Coal India Messaging

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL REFERENCES employees(emp_code) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  platform VARCHAR(20) DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_employee_id ON push_subscriptions(employee_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscription_updated_at();

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for push_subscriptions
-- Users can only manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid()::text = employee_id);

CREATE POLICY "Users can insert own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = employee_id);

CREATE POLICY "Users can update own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid()::text = employee_id);

CREATE POLICY "Users can delete own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid()::text = employee_id);
```

### Step 2: Generate VAPID Keys

Option A: Use online generator

- Visit: https://vapidkeys.com/
- Save both Public and Private keys

Option B: Generate locally

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

### Step 3: Format VAPID Keys

**IMPORTANT**: Remove any "=" padding from the end of your keys!

Example:

```
# If your key looks like this:
BK5Z2XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxrTTrqE=

# Remove the "=" to make it:
BK5Z2XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxrTTrqE
```

### Step 4: Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to: Settings → Environment Variables
3. Add these variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key-without-padding>
VAPID_PRIVATE_KEY=<your-private-key-without-padding>
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Replace `your-app.vercel.app` with your actual Vercel deployment URL.

### Step 5: Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

### Step 6: Verify Deployment

1. Open your deployed app
2. Log in with a test account
3. Navigate to messaging
4. Click the bell icon
5. Grant notification permission
6. Have another user send you a message
7. Verify you receive the push notification

## Troubleshooting

### Notifications Not Working?

1. **Check Database Table**

   - Verify `push_subscriptions` table exists
   - Check if subscriptions are being saved

2. **Check Environment Variables**

   - Ensure all 3 variables are set in Vercel
   - Verify VAPID keys have no "=" padding

3. **Check Browser Console**

   - Look for any errors when clicking the bell icon
   - Check if service worker is registered

4. **Check HTTPS**
   - Push notifications require HTTPS
   - Vercel provides this automatically

### Common Issues

**"Vapid public key must be a URL safe Base 64"**

- Remove "=" padding from your VAPID keys in Vercel

**"No GCM Sender ID"**

- This is normal - we use VAPID instead of GCM

**Notifications work locally but not in production**

- Check that all environment variables are set in Vercel
- Verify the database table was created

## Testing Push Notifications

### Quick Test

1. Open app in two different browsers
2. Log in as different users
3. Enable notifications (click bell icon)
4. Send a message between users
5. Notification should appear!

### Mobile Testing

- iOS: Requires Safari on iOS 16.4+
- Android: Works in Chrome/Firefox
- Best experience: Install as PWA

## Security Notes

- VAPID keys are application-specific
- Private key should never be exposed client-side
- Each user's subscription is isolated via RLS
- Notifications only sent to group members

## Next Steps

After deployment:

- Monitor push subscription creation
- Test on various devices/browsers
- Consider adding notification preferences
- Add analytics for notification engagement

## Support

If push notifications aren't working after following these steps:

1. Check the browser developer console for errors
2. Verify all environment variables are correctly set
3. Ensure the database table and policies were created
4. Test with a simple notification first
