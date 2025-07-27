# iOS Push Notifications Guide

## Overview

Web Push Notifications on iOS have specific requirements and limitations that differ from other platforms.

## iOS Requirements

### Safari Version

- **Minimum requirement**: Safari 16.4+ on iOS 16.4+
- Earlier versions of iOS/Safari do NOT support web push notifications

### PWA Installation Required

- **CRITICAL**: On iOS, push notifications ONLY work when the app is installed as a PWA
- The website must be added to the home screen using Safari's "Share" → "Add to Home Screen"
- Push notifications will NOT work in regular Safari browser tabs

## How to Enable Push Notifications on iOS

1. **Open the app in Safari** (not Chrome or other browsers)
2. **Tap the Share button** (square with arrow)
3. **Select "Add to Home Screen"**
4. **Give the app a name** and tap "Add"
5. **Open the app from your home screen** (not from Safari)
6. **Now you can enable push notifications** from within the PWA

## Troubleshooting

### Button doesn't change to "Disable notifications"

- Make sure you're using the app from the home screen, not Safari
- Check iOS version is 16.4 or higher
- Ensure Safari is updated to the latest version

### "Notifications not supported" message

- The app is being accessed from regular Safari instead of as a PWA
- iOS version is too old (pre-16.4)

### Notifications don't appear

- Check iOS Settings → Notifications → [Your App Name]
- Ensure notifications are allowed for the app
- Check Do Not Disturb is not enabled

## Technical Limitations

1. **No background sync**: Unlike Android, iOS doesn't support background sync for PWAs
2. **No silent push**: All notifications must be visible to the user
3. **Limited notification actions**: iOS has limited support for notification action buttons
4. **Requires user interaction**: Cannot send notifications without explicit user permission

## Testing on iOS

1. Always test from the installed PWA, not Safari
2. Use the debug page at `/push-notifications-debug` to verify:
   - Service worker registration
   - Push subscription status
   - VAPID key configuration

## Known Issues

- Notifications may not work immediately after PWA installation (wait 30 seconds)
- Some notification features (like actions) may not work as expected
- Badge counts are not supported on iOS PWAs
