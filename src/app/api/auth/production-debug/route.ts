import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

/**
 * GET /api/auth/production-debug - Diagnose production authentication issues
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {} as Record<string, any>
    };

    // Check environment variables
    diagnostics.checks.env_vars = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
      supabase_url_value: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      service_key_starts_with: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') ? 'Valid JWT format' : 'Invalid format'
    };

    // Test Supabase connection
    const supabase = createServerClient();
    
    try {
      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('employees')
        .select('count')
        .limit(1);
      
      diagnostics.checks.supabase_connection = {
        success: !connectionError,
        error: connectionError?.message,
        test_result: connectionTest ? 'Connected' : 'Failed'
      };
    } catch (error) {
      diagnostics.checks.supabase_connection = {
        success: false,
        error: (error as Error).message
      };
    }

    // Check if authentication tables exist
    const tableChecks = {
      employees: false,
      auth_sessions: false,
      otp_verifications: false,
      login_attempts: false
    };

    for (const tableName of Object.keys(tableChecks)) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        tableChecks[tableName as keyof typeof tableChecks] = !error;
      } catch (error) {
        // Table doesn't exist
        tableChecks[tableName as keyof typeof tableChecks] = false;
      }
    }

    diagnostics.checks.tables = tableChecks;

    // Test employee lookup (sample)
    try {
      const { data: employeeTest, error: employeeError } = await supabase
        .from('employees')
        .select('emp_code, name, is_active')
        .eq('is_active', true)
        .limit(1);

      diagnostics.checks.employee_data = {
        success: !employeeError && employeeTest && employeeTest.length > 0,
        error: employeeError?.message,
        sample_count: employeeTest?.length || 0
      };
    } catch (error) {
      diagnostics.checks.employee_data = {
        success: false,
        error: (error as Error).message
      };
    }

    // Check if auth tables have proper structure
    if (tableChecks.auth_sessions) {
      try {
        const { error } = await supabase
          .from('auth_sessions')
          .select('id, employee_id, session_token, expires_at, is_active')
          .limit(1);
        
        diagnostics.checks.auth_table_structure = {
          success: !error,
          error: error?.message
        };
      } catch (error) {
        diagnostics.checks.auth_table_structure = {
          success: false,
          error: (error as Error).message
        };
      }
    }

    return NextResponse.json(diagnostics, { status: 200 });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}
