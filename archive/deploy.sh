#!/bin/bash

# Deploy Coal India Directory Application
# This script handles different deployment scenarios

set -e

echo "🚀 Starting deployment process for Coal India Directory..."

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "📦 Deploying to Vercel..."
    
    if ! command_exists vercel; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Check if environment variables are set
    echo "⚠️  Make sure you have set the following environment variables in Vercel:"
    echo "   - JWT_SECRET"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "   - NEXT_PUBLIC_APP_URL"
    echo ""
    echo "🔐 For OTP Test Mode (optional):"
    echo "   - ENABLE_OTP_TEST_MODE (set to 'true' for testing)"
    echo "   - OTP_TEST_MODE_KEY (your secret key)"
    echo ""
    echo "You can set them via:"
    echo "1. Vercel Dashboard → Settings → Environment Variables"
    echo "2. Or run: vercel env add [VARIABLE_NAME]"
    echo "3. Or use our setup script: ./setup-vercel-env.sh"
    echo ""
    read -p "Have you set all environment variables? (y/n): " confirm
    
    if [[ $confirm != [yY] ]]; then
        echo "Please set environment variables first. See DEPLOYMENT-GUIDE.md for details."
        exit 1
    fi
    
    # Login to Vercel (will prompt if not logged in)
    vercel login
    
    # Deploy to production
    vercel --prod
    
    echo "✅ Deployment to Vercel completed!"
}

# Function to deploy to Netlify
deploy_netlify() {
    echo "📦 Deploying to Netlify..."
    
    if ! command_exists netlify; then
        echo "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Build the application
    npm run build
    
    # Deploy to Netlify
    netlify deploy --prod --dir=.next
    
    echo "✅ Deployment to Netlify completed!"
}

# Function to build Docker image
build_docker() {
    echo "🐳 Building Docker image..."
    
    # Build the Docker image
    docker build -t coal-india-directory:latest .
    
    echo "✅ Docker image built successfully!"
    echo "To run locally: docker run -p 3000:3000 coal-india-directory:latest"
}

# Function to deploy to Railway
deploy_railway() {
    echo "🚂 Deploying to Railway..."
    
    if ! command_exists railway; then
        echo "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Login to Railway
    railway login
    
    # Deploy to Railway
    railway up
    
    echo "✅ Deployment to Railway completed!"
}

# Main deployment menu
echo "Choose your deployment method:"
echo "1) Vercel (Recommended for Next.js)"
echo "2) Netlify"
echo "3) Build Docker image"
echo "4) Railway"
echo "5) Manual build only"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_vercel
        ;;
    2)
        deploy_netlify
        ;;
    3)
        build_docker
        ;;
    4)
        deploy_railway
        ;;
    5)
        echo "📦 Building application..."
        npm run build
        echo "✅ Build completed! You can now manually deploy the .next folder."
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process completed!"
echo ""
echo "📋 Post-deployment checklist:"
echo "✓ Update environment variables on your hosting platform"
echo "✓ Configure domain and SSL certificate"
echo "✓ Test authentication flow"
echo "✓ Test messaging functionality"
echo "✓ Verify PWA installation works"
echo "✓ Check all API endpoints are working"
echo ""
echo "🔧 Remember to set these environment variables on your hosting platform:"
echo "- JWT_SECRET"
echo "- NEXT_PUBLIC_SUPABASE_URL"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- NEXT_PUBLIC_APP_URL"
