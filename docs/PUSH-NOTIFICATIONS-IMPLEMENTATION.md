# Push Notifications Implementation

This document explains how PWA push notifications are implemented in the Coal India messaging system.

## Overview

Push notifications are fully integrated into the messaging system to notify users when they receive new messages, even when the app is not open.

## Architecture

### 1. Service Worker (`/public/worker/index.js`)

- Handles push events from the browser
- Displays notifications with customizable title, body, icon, and actions
- Handles notification clicks to open the messaging page
- Supports notification actions (View/Close)

### 2. Push Notification Service (`/src/lib/services/push-notifications.ts`)

- Manages subscription/unsubscription to push notifications
- Handles permission requests
- Stores subscription data in the database
- Provides methods to send notifications to specific users

### 3. Database Schema (`push_subscriptions` table)

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  employee_id VARCHAR(50) REFERENCES employees(emp_code),
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. API Endpoints

- `POST /api/push/subscribe` - Subscribe to push notifications
- `POST /api/push/unsubscribe` - Unsubscribe from push notifications
- `POST /api/push/send` - Send push notifications to specific users

## How It Works

### 1. User Enables Notifications

- User clicks "Enable notifications" in the app navigation menu
- Browser requests permission for notifications
- If granted, the app subscribes to push notifications
- Subscription data is stored in the database

### 2. Message Sending Flow

When a user sends a message:

1. Message is saved to the database
2. The API identifies all group members except the sender
3. Push notifications are sent to all subscribed members
4. Notification includes:
   - Title: Group name
   - Body: Sender name and message preview (first 100 chars)
   - Icon: App icon
   - Click action: Opens messaging page with the specific group

### 3. Receiving Notifications

- Service worker receives push event
- Displays native browser notification
- User can:
  - Click notification to open the messaging page
  - Use action buttons (View/Close)
  - Dismiss the notification

## User Interface

### Enable/Disable Notifications

Users can manage notifications from:

1. **Desktop**: Profile dropdown menu → Enable/Disable notifications
2. **Mobile**: Side menu → Profile section → Enable/Disable notifications button

## Security Features

1. **Permission-based**: Requires explicit user permission
2. **User-specific**: Subscriptions are tied to employee IDs
3. **Secure endpoints**: Uses VAPID keys for authentication
4. **Group membership validation**: Only group members receive notifications

## Environment Variables Required

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your-email@example.com
```

## Testing Push Notifications

1. **Enable notifications** in the app
2. **Send a message** in any group
3. **Other group members** will receive push notifications
4. **Click the notification** to open the messaging page

## Browser Support

Push notifications work in:

- Chrome/Edge (Desktop & Mobile)
- Firefox (Desktop & Mobile)
- Safari (macOS & iOS 16.4+)

Note: iOS Safari requires the app to be installed as a PWA from the share menu.

## Troubleshooting

### Notifications not appearing:

1. Check browser notification permissions
2. Ensure the service worker is registered
3. Verify VAPID keys are configured
4. Check if user is subscribed (database record exists)

### iOS specific:

1. Install the app as PWA (Add to Home Screen)
2. Open the PWA at least once
3. Grant notification permission when prompted

## Implementation Status

✅ Service worker for handling push events
✅ Database schema for storing subscriptions
✅ API endpoints for subscription management
✅ Push notification service
✅ UI for enabling/disabling notifications
✅ Integration with messaging system
✅ Automatic notifications on new messages
✅ Click-to-open functionality
✅ Message preview in notifications

The push notification system is fully implemented and ready for use!
