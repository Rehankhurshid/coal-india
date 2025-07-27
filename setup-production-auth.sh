#!/bin/bash

# Production Authentication Setup Script for Coal India Directory
# This script sets up authentication tables in the production Supabase database

set -e  # Exit on any error

echo "🔧 Coal India Directory - Production Authentication Setup"
echo "========================================================="

# Check if required environment variables are set
check_env_vars() {
    echo "📋 Checking environment variables..."
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
        echo "   Set it with: export NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
        echo "   Set it with: export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        echo "❌ JWT_SECRET is not set"
        echo "   Set it with: export JWT_SECRET=your_jwt_secret"
        exit 1
    fi
    
    echo "✅ Environment variables check passed"
}

# Function to run SQL script in Supabase
run_sql_script() {
    local script_file=$1
    local script_name=$2
    
    echo "📜 Executing $script_name..."
    
    # Check if file exists
    if [ ! -f "$script_file" ]; then
        echo "❌ SQL script not found: $script_file"
        exit 1
    fi
    
    # Use curl to execute SQL via Supabase REST API
    local response=$(curl -s -w "%{http_code}" \
        -X POST \
        -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(cat "$script_file" | jq -R -s .)}" \
        "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/rpc/exec" \
        -o /tmp/sql_response.json)
    
    local http_code="${response: -3}"
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo "✅ $script_name executed successfully"
    else
        echo "❌ Failed to execute $script_name (HTTP $http_code)"
        echo "Response:"
        cat /tmp/sql_response.json
        echo ""
        return 1
    fi
}

# Alternative method using psql if available
run_sql_with_psql() {
    local script_file=$1
    local script_name=$2
    
    echo "📜 Executing $script_name with psql..."
    
    # Extract database connection details from Supabase URL
    local db_url=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed 's|https://|postgresql://postgres:|' | sed 's|\.supabase\.co|.supabase.co:5432|')
    
    # Try to connect and run script
    if command -v psql &> /dev/null; then
        PGPASSWORD="$SUPABASE_DB_PASSWORD" psql "$db_url/postgres" -f "$script_file"
        echo "✅ $script_name executed successfully with psql"
    else
        echo "⚠️  psql not available, manual execution required"
        return 1
    fi
}

# Manual setup instructions
show_manual_instructions() {
    echo ""
    echo "📖 MANUAL SETUP INSTRUCTIONS"
    echo "============================="
    echo ""
    echo "Since automated setup failed, please manually run the following:"
    echo ""
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of src/lib/database/auth-tables-setup.sql"
    echo "4. Click 'Run' to execute the script"
    echo ""
    echo "The SQL file is located at: $(pwd)/src/lib/database/auth-tables-setup.sql"
    echo ""
    echo "After running the SQL script, test the setup by visiting:"
    echo "   https://your-app-domain.com/api/auth/production-debug"
    echo ""
}

# Main execution
main() {
    echo "Starting production authentication setup..."
    echo ""
    
    # Check prerequisites
    check_env_vars
    
    # Check if SQL file exists
    if [ ! -f "src/lib/database/auth-tables-setup.sql" ]; then
        echo "❌ Auth tables SQL script not found"
        echo "   Expected: src/lib/database/auth-tables-setup.sql"
        exit 1
    fi
    
    echo ""
    echo "🗄️  Setting up authentication tables..."
    
    # Try automated setup first
    if run_sql_script "src/lib/database/auth-tables-setup.sql" "Authentication Tables Setup"; then
        echo ""
        echo "🎉 Authentication setup completed successfully!"
        echo ""
        echo "Next steps:"
        echo "1. Deploy your application to production"
        echo "2. Test authentication at: https://your-app-domain.com/login"
        echo "3. Debug any issues at: https://your-app-domain.com/api/auth/production-debug"
        echo ""
    else
        echo ""
        echo "⚠️  Automated setup failed. Manual setup required."
        show_manual_instructions
    fi
}

# Run the main function
main "$@"
