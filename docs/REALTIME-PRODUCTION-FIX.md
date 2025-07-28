# Real-time Production Issues - Complete Fix Guide

## Issue: Real-time messaging not working in production

Based on the analysis, here are the most common causes and their solutions:

## 🔍 Diagnosis Checklist

### 1. **Environment Variables Check**

Your production environment needs these variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for API routes)
- `JWT_SECRET`

### 2. **Supabase Real-time Configuration**

The most common issue is that real-time is not enabled for messaging tables in Supabase.

## 🛠️ Solutions

### **Solution 1: Enable Real-time in Supabase Dashboard**

**This is the most likely fix needed:**

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Database → Replication**
3. Enable real-time for these tables:
   - `messaging_messages`
   - `messaging_groups`
   - `messaging_group_members`

**OR** run this SQL in your Supabase SQL Editor:

```sql
-- Enable real-time for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;

-- Verify real-time is enabled
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### **Solution 2: Check WebSocket Connection**

Your real-time uses Supabase Broadcast (WebSocket) which should work on the free tier. If the debug page shows connection issues:

1. **Check CORS settings** in Supabase Dashboard → Settings → API
2. **Verify the API URL** matches your production domain
3. **Check if WebSocket connections are blocked** by your hosting provider

### **Solution 3: Update Real-time Implementation**

If real-time still doesn't work, update the implementation to be more robust:

```typescript
// Enhanced real-time setup with error handling
const setupRealtimeSubscription = useCallback(
  (groupId: number) => {
    const messageChannel = supabase.channel(`group-${groupId}`, {
      config: {
        broadcast: { self: false }, // Don't receive own messages
        presence: { key: currentUserId },
      },
    });

    messageChannel
      .on("broadcast", { event: "new-message" }, (payload) => {
        console.log("Real-time message received:", payload);
        // Handle message
      })
      .subscribe((status, err) => {
        console.log("Real-time subscription status:", status);
        if (err) console.error("Real-time error:", err);
        setState((prev) => ({
          ...prev,
          isConnected: status === "SUBSCRIBED",
        }));
      });

    return messageChannel;
  },
  [currentUserId, supabase]
);
```

### **Solution 4: Verify Network Configuration**

Check if your production environment blocks WebSocket connections:

1. **Vercel** - WebSockets work by default
2. **Netlify** - WebSockets work by default
3. **Custom hosting** - May need WebSocket proxy configuration

### **Solution 5: Environment Variables in Vercel**

Ensure your Vercel project has the correct environment variables:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   JWT_SECRET=your_jwt_secret
   ```
3. Redeploy your application

## 🧪 Testing Real-time

### **Test 1: Use the Debug Page**

Visit: https://your-domain.vercel.app/realtime-debug

This page will show you:

- Environment variable status
- Supabase connection status
- Real-time channel subscription status
- Test message broadcasting

### **Test 2: Manual Testing**

1. Open your messaging app in two browser tabs
2. Send a message from one tab
3. Check if it appears in the other tab without refresh

### **Test 3: Browser Console Check**

Open browser DevTools → Console and look for:

- WebSocket connection errors
- Supabase real-time errors
- Network request failures

## 📋 Most Likely Solution

**90% of production real-time issues are fixed by:**

1. **Enabling real-time in Supabase Dashboard → Database → Replication**
2. **Adding the messaging tables to real-time publication**

Run this SQL in your Supabase SQL Editor:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;
```

Then redeploy your application and test again.

## 🔄 After Applying Fixes

1. **Redeploy** your application to pick up any environment variable changes
2. **Test** the real-time functionality using multiple browser tabs
3. **Check** the debug page for connection status
4. **Verify** WebSocket connections in browser DevTools → Network → WS

## 📞 Still Not Working?

If real-time still doesn't work after these fixes:

1. Check the `/realtime-debug` page for specific error messages
2. Look at browser console for WebSocket connection errors
3. Verify Supabase project status in the dashboard
4. Contact Supabase support if the issue persists

The debug page will provide specific information about what's failing in your production environment.
