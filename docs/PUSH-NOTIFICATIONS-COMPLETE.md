# Push Notifications Implementation - Complete Guide

## Overview

Push notifications have been successfully implemented in the Coal India messaging system. The implementation follows the Web Push Protocol standard and integrates seamlessly with the existing messaging functionality.

## How It Works

### 1. **Message Flow**

When a user sends a message:

1. The message is saved to the database
2. The API identifies all group members (except the sender)
3. For each recipient with an active push subscription, a notification is sent
4. The notification appears on the recipient's device with the sender's name and message preview

### 2. **Key Components**

#### Service Worker (`public/worker/sw-custom.js`)

- Handles incoming push events
- Displays notifications with custom formatting
- Manages notification clicks to open the messaging app
- Supports notification actions (View/Close)

#### Push API Endpoints

- `/api/push/subscribe` - Saves push subscription to database
- `/api/push/unsubscribe` - Removes push subscription
- `/api/push/send` - Sends notifications to specified recipients

#### Database Table (`push_notifications`)

```sql
- employee_id (primary key)
- subscription (JSONB containing endpoint and keys)
- created_at
- updated_at
```

#### VAPID Keys

- Public key: Used in frontend for subscription
- Private key: Used in backend for signing notifications
- Both are required for secure push delivery

### 3. **User Experience**

1. **Enabling Notifications**

   - Click the bell icon in the messaging app
   - Grant permission when prompted
   - Subscription is automatically saved

2. **Receiving Notifications**

   - Notifications appear when messages are received
   - Shows sender name and message preview
   - Clicking opens the messaging app

3. **Managing Notifications**
   - Click the bell icon again to toggle on/off
   - Status is shown with visual indicators
   - Subscriptions persist across sessions

## Testing

### Debug Page (`/push-notifications-debug`)

Access the debug page to:

- Check all system components
- View diagnostic information
- Send test notifications
- Verify configuration

### Manual Testing

1. Open the app in two different browsers/devices
2. Log in as different users
3. Add both users to the same group
4. Enable notifications for both
5. Send a message from one user
6. Verify notification appears for the other user

## Deployment

### Environment Variables Required

```bash
# In Vercel/Production
VAPID_PRIVATE_KEY="your-private-key"
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_EMAIL="mailto:your-email@example.com"
```

### Vercel Deployment

1. Set environment variables in Vercel dashboard
2. Deploy the application
3. Test notifications work in production

## Troubleshooting

### Common Issues

1. **"No push subscription found"**

   - User hasn't enabled notifications
   - Click the bell icon to enable

2. **Notifications not appearing**

   - Check browser notification permissions
   - Ensure service worker is registered
   - Verify VAPID keys are configured

3. **Test notification fails**
   - Ensure you're logged in
   - Enable notifications first
   - Check browser console for errors

### Browser Requirements

- Chrome 50+
- Firefox 44+
- Safari 16+ (on macOS 13+)
- Edge 17+

## Security

- VAPID keys ensure only your server can send notifications
- Subscriptions are tied to specific users
- Notifications only sent to group members
- No sensitive data stored in notifications

## Next Steps

To enhance push notifications:

1. Add notification preferences (mute specific groups)
2. Implement notification batching for multiple messages
3. Add rich notifications with images
4. Create notification history/center
5. Add sound customization options

## References

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
