# HTTPS Development Setup - Quick Reference

## Available Commands

### Method 1: Next.js Built-in HTTPS (Simple)

```bash
npm run dev:https
```

- Uses Next.js experimental HTTPS
- Creates self-signed certificates automatically
- Browser will show security warning (click "Advanced" → "Proceed to localhost")
- Runs on `https://localhost:3000`

### Method 2: mkcert (Recommended - No Browser Warnings)

```bash
npm run dev:mkcert
```

- Uses locally-trusted certificates via mkcert
- No browser security warnings
- Better development experience
- Runs on `https://localhost:3000`

### Method 3: Regular HTTP Development

```bash
npm run dev
```

- Standard HTTP development server
- Runs on `http://localhost:3000`
- PWA features and push notifications won't work

## Setup Status ✅

- [x] mkcert installed
- [x] Local CA installed in system trust store
- [x] Certificates generated (`certificates/localhost+2.pem`, `certificates/localhost+2-key.pem`)
- [x] HTTPS server script created (`scripts/https-server.js`)
- [x] Package.json scripts updated
- [x] VAPID keys generated and added to `.env.local`

## Testing PWA Features

With HTTPS running, you can test:

1. **Service Worker**: DevTools → Application → Service Workers
2. **Push Notifications**: Click bell icon, allow notifications
3. **PWA Installation**: Look for install icon in address bar
4. **Mobile Testing**: Use ngrok for external access

## Certificate Details

- **Location**: `./certificates/`
- **Valid for**: localhost, 127.0.0.1, ::1
- **Expires**: October 27, 2027
- **Type**: Locally-trusted (no browser warnings)

## Environment Variables

The following VAPID keys have been added to `.env.local`:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: For client-side push subscription
- `VAPID_PRIVATE_KEY`: For server-side push sending

## Troubleshooting

- If certificates don't work, regenerate with: `mkcert localhost 127.0.0.1 ::1`
- If mkcert not trusted, reinstall CA: `mkcert -install`
- For mobile testing, use: `ngrok http 3000` in separate terminal
