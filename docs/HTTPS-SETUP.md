# HTTPS Setup for Local Development

PWA features and push notifications require HTTPS. Here are three methods to run your Coal India messaging app with HTTPS:

## Method 1: Next.js Built-in HTTPS (Simplest)

```bash
# Run with HTTPS using Next.js experimental feature
npm run dev:https
```

This will create a self-signed certificate automatically and run on `https://localhost:3000`.

**Note:** You'll get a browser warning about the certificate. Click "Advanced" → "Proceed to localhost" to continue.

## Method 2: mkcert (Recommended for Development)

Install mkcert to create locally-trusted certificates:

### macOS:

```bash
# Install mkcert
brew install mkcert

# Install the local CA
mkcert -install

# Generate certificates for localhost
mkcert localhost 127.0.0.1 ::1

# This creates:
# - localhost+2.pem (certificate)
# - localhost+2-key.pem (private key)
```

### Create HTTPS server script:

```javascript
// scripts/https-server.js
const { createServer } = require("https");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync("./localhost+2-key.pem"),
  cert: fs.readFileSync("./localhost+2.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on https://localhost:3000");
  });
});
```

Then add to package.json:

```json
"scripts": {
  "dev:mkcert": "node scripts/https-server.js"
}
```

## Method 3: ngrok (For Testing on Mobile/Remote)

1. Install ngrok:

```bash
npm install -g ngrok
```

2. Run your app normally:

```bash
npm run dev
```

3. In another terminal, expose it via ngrok:

```bash
ngrok http 3000
```

This gives you a public HTTPS URL like `https://xyz123.ngrok.io` that you can access from any device.

## Testing PWA Features

Once running with HTTPS, you can test:

1. **Service Worker Registration**

   - Open DevTools → Application → Service Workers
   - Should see your worker registered

2. **Push Notifications**

   - Click the bell icon
   - Allow notifications
   - Check if subscription is created

3. **PWA Installation**

   - Look for install icon in address bar
   - Or "Install app" in browser menu

4. **Mobile Testing**
   - Use ngrok URL on mobile
   - Add to home screen
   - Test notifications

## Production Deployment

For production, your hosting provider (Vercel, Netlify, etc.) automatically provides HTTPS. No additional configuration needed.

## Environment Variables for Push

Add to `.env.local`:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
```

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```
