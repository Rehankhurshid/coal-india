# Vercel Environment Variables Setup Guide

## Step 1: Remove All Existing Environment Variables

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Delete all existing environment variables by clicking the trash icon next to each one

## Step 2: Required Environment Variables

Here's the complete list of environment variables you need to add:

### Core Supabase Configuration (Required)

```bash
NEXT_PUBLIC_SUPABASE_URL="https://vwuhblcnwirskxyfqjwv.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

### Database URLs with Connection Pooling (Required for Production)

```bash
# For Vercel deployment, use the pooler connection (port 6543)
DATABASE_URL="postgresql://postgres.vwuhblcnwirskxyfqjwv:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection for migrations (if needed)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.vwuhblcnwirskxyfqjwv.supabase.co:5432/postgres"
```

### Authentication & Security (Required)

```bash
# Generate a secure 32+ character secret
JWT_SECRET="<generate-secure-32-char-secret>"
NEXTAUTH_SECRET="<same-as-jwt-secret>"

# Generate a 64-character hex key for encryption
ENCRYPTION_KEY="<generate-64-char-hex-key>"
```

### App Configuration (Required)

```bash
# Replace with your actual Vercel app URL
NEXT_PUBLIC_APP_URL="https://your-app-name.vercel.app"
NEXTAUTH_URL="https://your-app-name.vercel.app"
NODE_ENV="production"
```

### App Metadata (Required)

```bash
NEXT_PUBLIC_APP_NAME="SECL Employee Directory"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Feature Flags (Optional but Recommended)

```bash
NEXT_PUBLIC_ENABLE_MESSAGING="true"
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH="true"
NEXT_PUBLIC_ENABLE_EXPORT="true"
```

### File Upload Configuration (Optional)

```bash
NEXT_PUBLIC_MAX_FILE_SIZE="5242880"  # 5MB in bytes
```

### Push Notifications (Optional)

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY="<your-vapid-public-key>"
VAPID_PRIVATE_KEY="<your-vapid-private-key>"
VAPID_EMAIL="mailto:admin@secl.co.in"
```

## Step 3: Add Environment Variables to Vercel

1. Go to **Settings** → **Environment Variables** in your Vercel project
2. For each variable, click **Add New**
3. Enter the **Key** (variable name)
4. Enter the **Value**
5. Select environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)
6. Click **Save**

## Step 4: Get Your Supabase Credentials

### Supabase URL & Anon Key:

1. Go to https://app.supabase.com/project/vwuhblcnwirskxyfqjwv/settings/api
2. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Service Role Key:

1. Same page, copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
2. ⚠️ Keep this secret! Never expose in client-side code

### Database Password:

1. Go to Settings → Database
2. Click **Reset Database Password** if needed
3. Copy the new password for the DATABASE_URL

### Connection URLs:

1. Go to Settings → Database
2. Find **Connection string** section
3. Use **Connection pooling** → **Connection string** for `DATABASE_URL`
4. Add `?pgbouncer=true` at the end
5. Use **Direct connection** for `DIRECT_URL` (if needed)

## Step 5: Generate Secure Secrets

### For JWT_SECRET and NEXTAUTH_SECRET:

```bash
# Generate using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### For ENCRYPTION_KEY:

```bash
# Generate 64-character hex key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Verify Setup

After adding all environment variables:

1. Trigger a new deployment:

   ```bash
   git commit --allow-empty -m "Trigger deployment with new env vars"
   git push
   ```

2. Check the deployment logs in Vercel for any environment variable errors

3. Test the deployed app's authentication:
   - Visit https://your-app-name.vercel.app/api/debug/env-check
   - Should show "All environment variables are set correctly!"

## Important Notes

### Connection Pooling for Vercel

- ✅ Use the pooler URL (port 6543) with `?pgbouncer=true` for DATABASE_URL
- ✅ This prevents connection exhaustion in serverless environments
- ✅ The app doesn't use Prisma, so no migration commands needed

### Security Best Practices

- Never commit `.env` files to git
- Use different secrets for production vs development
- Rotate secrets periodically
- Use Vercel's environment variable encryption

### Troubleshooting

If authentication fails after setup:

1. Check Vercel function logs for errors
2. Verify all Supabase tables exist (auth_sessions, auth_otp_codes)
3. Ensure service role key has proper permissions
4. Test with the production debug endpoint: /api/auth/production-debug

## Quick Copy-Paste Template

```env
# Core (Update with your values)
NEXT_PUBLIC_SUPABASE_URL="https://vwuhblcnwirskxyfqjwv.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Database (Update password)
DATABASE_URL="postgresql://postgres.vwuhblcnwirskxyfqjwv:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Security (Generate new values)
JWT_SECRET=""
NEXTAUTH_SECRET=""
ENCRYPTION_KEY=""

# App (Update domain)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXTAUTH_URL="https://your-app.vercel.app"
NODE_ENV="production"

# Metadata
NEXT_PUBLIC_APP_NAME="SECL Employee Directory"
NEXT_PUBLIC_APP_VERSION="1.0.0"

# Features
NEXT_PUBLIC_ENABLE_MESSAGING="true"
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH="true"
NEXT_PUBLIC_ENABLE_EXPORT="true"
NEXT_PUBLIC_MAX_FILE_SIZE="5242880"
```
