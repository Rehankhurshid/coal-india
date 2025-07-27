# VAPID Key Setup for Push Notifications

## Important: VAPID Key Format Requirements

The web-push library requires VAPID keys to be in URL-safe Base64 format **without padding** (no "=" characters).

## Generating VAPID Keys

If you need to generate new VAPID keys:

```bash
# Install web-push globally
npm install -g web-push

# Generate VAPID keys
web-push generate-vapid-keys
```

## Formatting Keys for Vercel

Before adding keys to Vercel environment variables, ensure they are in the correct format:

### URL-Safe Base64 Format

- Remove all `=` padding characters
- Replace `+` with `-`
- Replace `/` with `_`

### Example:

```
# Original key (might have padding):
BK5Z2XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxrTTrqE=

# Properly formatted (no padding):
BK5Z2XxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxrTTrqE
```

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-formatted-public-key-without-padding>
VAPID_PRIVATE_KEY=<your-formatted-private-key-without-padding>
```

## Verifying Your Keys

Your keys should:

- **NOT** end with `=` characters
- **NOT** contain `+` or `/` characters (should be `-` and `_` instead)
- Be exactly the right length for Base64 encoding

## Troubleshooting

If you get the error:

```
Error: Vapid public key must be a URL safe Base 64 (without "=")
```

This means your VAPID_PUBLIC_KEY in Vercel still has padding. Remove any `=` characters from the end of your keys in Vercel's environment variables.

## Code Implementation

The web-push service (`src/lib/services/web-push.ts`) now automatically converts keys to URL-safe format as a fallback, but it's best to store them correctly in Vercel from the start.
