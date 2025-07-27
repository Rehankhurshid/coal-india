# Coal India Directory - Deployment Guide

## Quick Deploy to Vercel (Recommended)

### 1. Environment Variables Setup

Before deploying, you need to set up environment variables in Vercel. You can do this in two ways:

#### Option A: Via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=https://your-app-domain.vercel.app
```

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add JWT_SECRET
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

### 2. Deploy

#### Manual Deploy

```bash
# Deploy to Vercel
vercel --prod
```

#### Auto Deploy with GitHub

1. Connect your GitHub repository to Vercel
2. Push to main branch
3. Vercel will automatically deploy

## Alternative Deployment Options

### Docker Deployment

#### Build and Run Locally

```bash
# Build the Docker image
docker build -t coal-india-directory .

# Run the container
docker run -p 3000:3000 \
  -e JWT_SECRET="your-jwt-secret" \
  -e NEXT_PUBLIC_SUPABASE_URL="your-supabase-url" \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key" \
  -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  -e NEXT_PUBLIC_APP_URL="http://localhost:3000" \
  coal-india-directory
```

#### Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Manual Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Environment Variables Reference

| Variable                        | Description                              | Example                                      |
| ------------------------------- | ---------------------------------------- | -------------------------------------------- |
| `JWT_SECRET`                    | Secret key for JWT tokens (min 32 chars) | `super-secret-jwt-key-minimum-32-characters` |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                | `https://xxxx.supabase.co`                   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key            | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`    |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-side)  | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`    |
| `NEXT_PUBLIC_APP_URL`           | Your app's public URL                    | `https://coal-india.vercel.app`              |

## Post-Deployment Checklist

- [ ] Environment variables are properly set
- [ ] Application builds without errors
- [ ] Authentication system works (login/logout)
- [ ] Group creation functionality works
- [ ] Messaging system is operational
- [ ] PWA installation works
- [ ] SSL certificate is active
- [ ] Domain is properly configured

## Security Notes

1. **JWT_SECRET**: Must be at least 32 characters long
2. **Service Role Key**: Keep this secret, never expose in client-side code
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Properly configure CORS settings in Supabase

## Troubleshooting

### Common Issues

1. **Build Fails**: Check that all environment variables are set
2. **Authentication Errors**: Verify Supabase keys and URL
3. **CORS Errors**: Update allowed origins in Supabase dashboard
4. **JWT Errors**: Ensure JWT_SECRET is at least 32 characters

### Getting Help

1. Check the application logs in Vercel dashboard
2. Verify environment variables are properly set
3. Test authentication endpoints manually
4. Check Supabase dashboard for any service issues

## Performance Optimization

- Application uses Next.js 15 with App Router
- Images are optimized with Next.js Image component
- Static assets are cached appropriately
- Service Worker provides offline functionality
- PWA features enable app-like experience
