import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check if auth tables exist
    const tables = ['auth_sessions', 'otp_verifications', 'login_attempts'];
    const results: Record<string, any> = {};
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        results[table] = {
          exists: false,
          error: error.message
        };
      } else {
        results[table] = {
          exists: true,
          hasData: data && data.length > 0
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      tables: results
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
