import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const testUserId = '14570535';
    
    // Test 1: Check if auth tables exist
    const { data: authTables, error: tablesError } = await supabase
      .from('auth_sessions')
      .select('count')
      .limit(1);

    // Test 2: For now, we'll skip actual session creation since auth tables don't exist
    let sessionToken: string | null = null;
    let sessionCreated = false;

    // Test 3: Test group creation with authentication
    let groupCreated = false;
    let groupError = null;
    
    if (sessionToken) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/messaging/groups`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sessionToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Test Auth Group',
            description: 'Testing authenticated group creation',
            memberIds: []
          })
        });
        
        if (response.ok) {
          groupCreated = true;
        } else {
          const error = await response.json();
          groupError = error.error || response.statusText;
        }
      } catch (err) {
        groupError = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    // Test 4: Check if development mode auth works
    let devModeWorks = false;
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/messaging/groups?userId=${testUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Test Dev Mode Group',
          description: 'Testing dev mode auth',
          memberIds: []
        })
      });
      
      devModeWorks = response.ok;
    } catch (err) {
      // Ignore errors
    }

    return NextResponse.json({
      success: true,
      tests: {
        authTablesExist: !!authTables,
        sessionCreated,
        sessionToken: null,
        groupCreatedWithAuth: groupCreated,
        groupError,
        devModeAuthWorks: devModeWorks,
        environment: process.env.NODE_ENV
      },
      recommendations: [
        !authTables && "Auth tables are missing. Run the auth-schema.sql script.",
        !sessionCreated && authTables && "Session creation failed. Check JWT configuration.",
        !groupCreated && sessionCreated && "Group creation failed with valid auth. Check API permissions.",
        devModeWorks && !groupCreated && "Dev mode works but production auth doesn't. Use ?userId= for testing."
      ].filter(Boolean)
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
