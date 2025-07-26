# 📱 Mobile Testing Guide for Coal India PWA

## 🌐 Your Public URL:

**`https://bd1eac54caf6.ngrok-free.app`**

## 📲 Testing on Your Phone:

### Step 1: Open the URL

1. Open your phone's browser (Chrome, Safari, etc.)
2. Navigate to: `https://bd1eac54caf6.ngrok-free.app`
3. You may see an ngrok warning page - click "Visit Site"

### Step 2: Install as PWA

#### On Android (Chrome):

1. Open the URL in Chrome
2. Look for "Add to Home Screen" in the menu (⋮)
3. Or look for an install banner at the bottom
4. Tap "Add" or "Install"

#### On iPhone (Safari):

1. Open the URL in Safari
2. Tap the Share button (□↗)
3. Scroll down and tap "Add to Home Screen"
4. Edit the name if desired
5. Tap "Add"

### Step 3: Test PWA Features

1. **App Icon**: Should appear on your home screen
2. **Standalone Mode**: Opens without browser UI
3. **Offline**: Try turning off WiFi/data and reopening
4. **Push Notifications**: Test the notification bell

## 🔧 Alternative Methods:

### Method 2: Local Network IP

Find your Mac's IP address and access directly:

```bash
# Find your IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Then access: https://YOUR_IP:3000
# (You'll get certificate warnings on mobile)
```

### Method 3: QR Code Access

You can generate a QR code for the ngrok URL:

1. Go to: https://qr-code-generator.com
2. Enter your ngrok URL
3. Scan with phone camera

## 🐛 Troubleshooting:

### ngrok Warning Page:

- Click "Visit Site" to bypass the warning
- This is normal for free ngrok accounts

### Certificate Errors:

- ngrok provides valid HTTPS certificates
- If using IP method, expect certificate warnings

### PWA Not Installing:

- Make sure you're using HTTPS (ngrok URL)
- Clear browser cache if needed
- Try incognito/private mode

## 📊 Monitoring:

### ngrok Web Interface:

Visit `http://127.0.0.1:4040` on your Mac to see:

- Request logs
- Traffic monitoring
- Connection details

### Keep Terminals Running:

1. **Terminal 1**: Your HTTPS server (`npm run dev:mkcert`)
2. **Terminal 2**: ngrok tunnel (`ngrok http 3000`)

## ⚠️ Important Notes:

- **Free ngrok**: URL changes each restart
- **Session Expires**: Free accounts have time limits
- **Security**: Don't share the URL publicly (contains your local app)

## 🎯 What You Can Test:

✅ **PWA Installation** - Add to home screen
✅ **Responsive Design** - Mobile layout
✅ **Touch Interactions** - Tap, swipe, etc.
✅ **Offline Mode** - Service worker caching
✅ **Push Notifications** - If implemented
✅ **App-like Experience** - Standalone mode

Your Coal India PWA is now accessible on any device with internet! 🚀
