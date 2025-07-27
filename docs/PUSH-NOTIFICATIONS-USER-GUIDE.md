# Push Notifications User Guide

## Overview

The Coal India messaging app supports PWA push notifications to alert users when they receive new messages, even when the app is not open.

## How Push Notifications Work

1. **Automatic Notifications**: When someone sends you a message in a group, you'll receive a push notification on your device
2. **Click to Open**: Clicking the notification will open the messaging app and take you to the conversation
3. **Works Everywhere**: Notifications work on desktop browsers (Chrome, Firefox, Edge) and mobile devices (iOS 16.4+, Android)

## Enabling Push Notifications

### Step 1: Look for the Bell Icon

In the messaging app, look for the bell icon in the chat header (top right area).

### Step 2: Click to Enable

- **Bell with line through it** (🔕): Notifications are OFF - click to enable
- **Bell** (🔔): Notifications are ON - click to disable

### Step 3: Grant Permission

When you first enable notifications, your browser will ask for permission:

- Click "Allow" to enable notifications
- If you click "Block", you'll need to manually enable them in browser settings

## Notification Features

### What You'll See

- **Title**: Shows the group name
- **Message Preview**: Shows sender name and first 100 characters of the message
- **App Icon**: Coal India logo
- **Actions**: View or Close buttons

### When You'll Get Notifications

- When someone sends a message in a group you're a member of
- Only when you're not actively viewing that conversation
- Works even when the app is closed (on supported devices)

## Troubleshooting

### Notifications Not Working?

1. **Check Browser Support**:

   - Desktop: Chrome, Firefox, Edge (latest versions)
   - iOS: Safari on iOS 16.4 or later
   - Android: Chrome, Firefox

2. **Check Permissions**:

   - Click the lock icon in your browser's address bar
   - Make sure notifications are set to "Allow"

3. **Check Bell Icon Status**:

   - Make sure the bell icon shows notifications are enabled
   - Try toggling it off and on again

4. **PWA Installation**:
   - For best results on mobile, install the app as a PWA
   - Look for "Install App" or "Add to Home Screen" option

### Re-enabling After Blocking

If you accidentally blocked notifications:

**Desktop (Chrome)**:

1. Click the lock icon in the address bar
2. Find "Notifications" and change to "Allow"
3. Refresh the page

**Mobile (iOS)**:

1. Go to Settings > Notifications
2. Find the Coal India app
3. Toggle "Allow Notifications" on

**Mobile (Android)**:

1. Long press the app icon
2. Tap "App info"
3. Tap "Notifications" and enable

## Privacy & Security

- Notifications are sent securely using web standards
- Only members of a group receive notifications for that group
- No message content is stored on notification servers
- You can disable notifications at any time

## Technical Details

The app uses:

- Service Workers for background notification handling
- Web Push API for cross-platform support
- VAPID keys for secure server-to-browser communication
- Supabase for storing subscription endpoints

## Need Help?

If you're having issues with notifications:

1. Try refreshing the page
2. Check your browser is up to date
3. Ensure you're logged in
4. Contact IT support if problems persist
