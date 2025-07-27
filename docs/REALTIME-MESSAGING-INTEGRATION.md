# Real-time Messaging Integration Guide

## Overview

The messaging system uses Supabase Broadcast for real-time features. This works on the free tier and provides instant message delivery without refreshing.

## Current Real-time Features

1. **Instant Message Delivery** - Messages appear immediately for all users
2. **Live Message Updates** - Edits appear in real-time
3. **Real-time Message Deletion** - Deleted messages disappear instantly
4. **Typing Indicators** - See when others are typing
5. **Presence Tracking** - Track online users (using Supabase Presence)

## Setup Instructions

### Step 1: Enable Real-time in Supabase

You must enable real-time for the messaging tables in your Supabase dashboard:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to **Database → Replication**
3. Enable real-time for these tables:
   - `messaging_messages`
   - `messaging_groups`
   - `messaging_group_members`

Alternatively, run this SQL in your Supabase SQL Editor:

```sql
-- Enable real-time for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;
```

### Step 2: Verify Real-time is Enabled

Check which tables have real-time enabled:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Step 3: Deploy Your Application

Once real-time is enabled in Supabase, deploy your application:

```bash
./deploy-realtime-chat.sh
```

Or use Vercel CLI:

```bash
vercel --prod
```

## How It Works

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client A  │────▶│   Supabase   │◀────│   Client B  │
│  (Browser)  │     │  Broadcast   │     │  (Browser)  │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
   Subscribe           Relay Messages        Subscribe
   to Channel          in Real-time         to Channel
```

### Implementation Details

1. **Channel Subscription** (`src/hooks/use-messaging.ts`)

   ```typescript
   const setupRealtimeSubscription = (groupId: number) => {
     // Subscribe to group-specific channel
     messageChannelRef.current = SupabaseMessagingService.subscribeToGroup(
       groupId,
       {
         onNewMessage: (message) => {
           /* Handle new message */
         },
         onMessageUpdate: (message) => {
           /* Handle edited message */
         },
         onMessageDelete: (messageId) => {
           /* Handle deleted message */
         },
       }
     );
   };
   ```

2. **Broadcasting Messages** (`src/lib/services/supabase-messaging.ts`)

   ```typescript
   // When sending a message, broadcast to all listeners
   await SupabaseMessagingService.broadcastNewMessage(groupId, newMessage);
   ```

3. **Typing Indicators** (Using Supabase Presence)
   ```typescript
   // Track typing state with presence
   await channel.track({
     userId,
     isTyping: true,
     timestamp: new Date().toISOString(),
   });
   ```

## Troubleshooting

### Messages Not Appearing in Real-time?

1. **Check Real-time is Enabled**

   - Go to Supabase Dashboard → Database → Replication
   - Ensure messaging tables are enabled for real-time

2. **Check Browser Console**

   - Look for WebSocket connection errors
   - Check for authentication issues

3. **Verify Subscriptions**

   - Open browser DevTools → Network → WS tab
   - Look for active WebSocket connections to Supabase

4. **Test Real-time Directly**

   ```javascript
   // In browser console
   const channel = supabase.channel("test-channel");
   channel
     .on("broadcast", { event: "test" }, (payload) => {
       console.log("Received:", payload);
     })
     .subscribe();

   // Send a test message
   channel.send({
     type: "broadcast",
     event: "test",
     payload: { message: "Hello!" },
   });
   ```

### Common Issues

1. **Rate Limiting**

   - Supabase has rate limits on real-time connections
   - Free tier: 200 concurrent connections
   - Solution: Implement connection pooling

2. **Authentication Errors**

   - Ensure user is authenticated before subscribing
   - Check JWT token is valid

3. **Channel Not Found**
   - Verify group ID is correct
   - Ensure user has access to the group

## Testing Real-time Features

1. **Manual Testing**

   - Open app in two different browsers
   - Log in as different users
   - Join the same group
   - Send messages and verify instant delivery

2. **Automated Testing**
   ```typescript
   // Example test for real-time messaging
   describe("Real-time Messaging", () => {
     it("should receive messages instantly", async () => {
       // Setup two clients
       const client1 = createTestClient("user1");
       const client2 = createTestClient("user2");

       // Subscribe to messages
       const messages = [];
       client2.subscribeToGroup(groupId, {
         onNewMessage: (msg) => messages.push(msg),
       });

       // Send message from client1
       await client1.sendMessage("Hello!");

       // Verify client2 received it
       await waitFor(() => {
         expect(messages).toHaveLength(1);
         expect(messages[0].content).toBe("Hello!");
       });
     });
   });
   ```

## Performance Considerations

1. **Connection Management**

   - Unsubscribe from channels when component unmounts
   - Reuse channels where possible
   - Implement reconnection logic

2. **Message Batching**

   - For high-traffic groups, consider batching updates
   - Implement debouncing for typing indicators

3. **Offline Support**
   - Queue messages when offline
   - Sync when connection restored
   - Show connection status to users

## Security Notes

- Real-time uses the same RLS policies as regular queries
- Users can only subscribe to groups they're members of
- Message broadcasts are filtered by group membership
- No sensitive data in broadcast payloads

## Alternative Approaches

If Supabase real-time doesn't meet your needs, see [VERCEL-REALTIME-ALTERNATIVES.md](./VERCEL-REALTIME-ALTERNATIVES.md) for other options like:

- Pusher
- Socket.io
- WebSockets with custom server
- Server-Sent Events (SSE)
