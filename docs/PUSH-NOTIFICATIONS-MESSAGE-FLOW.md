# Push Notifications Message Flow

## Current Implementation

Your application already sends push notifications when messages are received. Here's how it works:

### 1. Message Send Flow (src/app/api/messaging/groups/[id]/messages/route.ts)

When a user sends a message:

```typescript
// 1. Message is saved to database
const { data: newMessage } = await supabase
  .from('messaging_messages')
  .insert({...})

// 2. Get all group members except sender
const { data: members } = await supabase
  .from('messaging_group_members')
  .select('employee_id')
  .eq('group_id', groupId)
  .neq('employee_id', employeeId);

// 3. Send push notifications
const notificationPayload = {
  recipientIds: members.map(m => m.employee_id),
  notification: {
    title: group?.name || 'New Message',
    body: `${sender?.name}: ${message.content.substring(0, 100)}...`,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: `group-${groupId}-msg-${message.id}`,
    url: `/messaging?group=${groupId}`,
    data: {
      groupId,
      messageId: message.id,
      senderId: employeeId
    }
  }
};
```

### 2. Push Notification Delivery

The `/api/push/send` endpoint:

- Looks up push subscriptions for all recipient IDs
- Sends notifications to each subscribed device
- Handles failures gracefully

### 3. Service Worker Handling (public/worker/sw-custom.js)

When notification is received:

- Shows the notification with title, body, and icon
- On click, opens the messaging app to the specific group

## Testing Push Notifications

### Prerequisites

1. **VAPID Keys**: Ensure `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are set
2. **HTTPS**: Push notifications require HTTPS (localhost is exempt)
3. **Browser Support**: Modern browsers with notification support
4. **Permission**: Users must grant notification permission

### How to Test

1. **Enable Notifications**:

   - Open the messaging app
   - Click the bell icon in the chat header
   - Grant notification permission when prompted

2. **Send Test Message**:

   - Have two users in a group
   - User A enables notifications
   - User B sends a message
   - User A should receive a push notification

3. **Debug Page**:
   - Visit `/push-notifications-debug`
   - Check all diagnostics are green
   - Send a test notification

### Common Issues & Solutions

1. **Notifications Not Appearing**:

   - Check browser notification settings
   - Ensure service worker is registered
   - Verify VAPID keys are configured
   - Check if user has an active subscription

2. **iOS Specific**:

   - Requires iOS 16.4+
   - Must be installed as PWA
   - Notifications work differently than native apps

3. **Desktop Browsers**:
   - Check system notification settings
   - Some browsers require the tab to be closed/backgrounded

## Implementation Details

### Database Schema

- `push_subscriptions` table stores:
  - `employee_id`: User identifier
  - `endpoint`: Push service endpoint
  - `auth_key`: Authentication key
  - `p256dh_key`: Encryption key
  - `user_agent`: Browser/device info

### API Endpoints

- `POST /api/push/subscribe`: Register push subscription
- `DELETE /api/push/unsubscribe`: Remove push subscription
- `POST /api/push/send`: Send push notifications (internal)
- `GET /api/push/check-database`: Verify database setup

### Security

- Subscriptions are tied to authenticated users
- VAPID keys ensure only your server can send notifications
- Endpoint URLs are unique per device/browser

## Monitoring & Analytics

To monitor push notification delivery:

1. Check server logs for send attempts
2. Track delivery success/failure rates
3. Monitor subscription lifecycle events

## Future Enhancements

Consider adding:

1. Notification preferences (quiet hours, etc.)
2. Rich notifications with images
3. Action buttons (Reply, Mark as Read)
4. Notification grouping/stacking
5. Analytics tracking
