import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Environment Variables ===');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('NODE_ENV:', process.env.NODE_ENV);

    const supabase = createServerClient();
    
    console.log('=== DEBUG: Database Connection ===');
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('employees')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('Connection error:', connectionError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
        env_check: {
          supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          jwt_secret: !!process.env.JWT_SECRET
        }
      }, { status: 500 });
    }

    console.log('=== DEBUG: Auth Tables Check ===');
    
    // Check if auth tables exist
    const tables = ['auth_sessions', 'otp_verifications', 'login_attempts'];
    const tableStatus: Record<string, string> = {};
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        tableStatus[table] = error ? `❌ ${error.message}` : '✅ Exists';
      } catch (err) {
        tableStatus[table] = `❌ ${err instanceof Error ? err.message : 'Unknown error'}`;
      }
    }

    // Test employee lookup
    console.log('=== DEBUG: Employee Lookup Test ===');
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('emp_code, name, phone_1, is_active')
      .eq('emp_code', 'ADMIN001')
      .limit(1);

    return NextResponse.json({
      success: true,
      message: 'Debug information collected',
      environment: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        jwt_secret: !!process.env.JWT_SECRET,
        node_env: process.env.NODE_ENV
      },
      database: {
        connection: '✅ Connected',
        tables: tableStatus
      },
      employee_test: {
        found: (employees?.length || 0) > 0,
        data: employees?.[0] || null,
        error: employeeError?.message || null
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
