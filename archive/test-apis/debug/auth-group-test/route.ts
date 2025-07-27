import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, setUserContextForRLS } from '@/lib/auth/server-auth';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  console.log('[DEBUG] Auth-Group Test - Starting');
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    step: 'initial',
    authHeaders: {},
    authenticatedUser: null,
    supabaseTest: null,
    groupCreationTest: null,
    errors: []
  };

  try {
    // Step 1: Check auth headers
    debugInfo.step = 'checking-auth-headers';
    const authHeader = request.headers.get('authorization');
    const contentType = request.headers.get('content-type');
    
    debugInfo.authHeaders = {
      hasAuthHeader: !!authHeader,
      authHeaderFormat: authHeader ? (authHeader.startsWith('Bearer ') ? 'valid-bearer' : 'invalid-format') : 'missing',
      hasContentType: !!contentType,
      contentType: contentType
    };
    
    console.log('[DEBUG] Auth headers:', debugInfo.authHeaders);

    // Step 2: Get authenticated user
    debugInfo.step = 'getting-authenticated-user';
    try {
      const authenticatedUser = await getAuthenticatedUser(request);
      debugInfo.authenticatedUser = authenticatedUser ? {
        employeeId: authenticatedUser.employeeId,
        sessionId: authenticatedUser.sessionId,
        hasValidSession: true
      } : null;
      
      console.log('[DEBUG] Authenticated user:', debugInfo.authenticatedUser);
      
      if (!authenticatedUser) {
        debugInfo.errors.push('No authenticated user found');
        return NextResponse.json(debugInfo, { status: 401 });
      }

      // Step 3: Test Supabase connection and RLS
      debugInfo.step = 'testing-supabase-connection';
      const supabase = createServerClient();
      
      // Set user context for RLS
      await setUserContextForRLS(authenticatedUser.employeeId);
      
      // Test if we can query the employees table
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('emp_code, name')
        .eq('emp_code', authenticatedUser.employeeId)
        .single();
        
      debugInfo.supabaseTest = {
        canQueryEmployees: !employeeError,
        employee: employee,
        employeeError: employeeError?.message
      };
      
      console.log('[DEBUG] Supabase test:', debugInfo.supabaseTest);

      // Step 4: Test group creation
      debugInfo.step = 'testing-group-creation';
      const testGroupName = `Test Group ${Date.now()}`;
      
      // First check if messaging_groups table exists
      const { error: tableCheckError } = await supabase
        .from('messaging_groups')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        debugInfo.groupCreationTest = {
          tableExists: false,
          tableError: tableCheckError.message
        };
        debugInfo.errors.push(`Messaging groups table error: ${tableCheckError.message}`);
      } else {
        // Try to create a test group
        const { data: newGroup, error: createError } = await supabase
          .from('messaging_groups')
          .insert({
            name: testGroupName,
            description: 'Debug test group',
            created_by: authenticatedUser.employeeId
          })
          .select()
          .single();
          
        if (createError) {
          debugInfo.groupCreationTest = {
            tableExists: true,
            canCreateGroup: false,
            createError: createError.message,
            createErrorCode: createError.code,
            createErrorDetails: createError.details
          };
          debugInfo.errors.push(`Group creation error: ${createError.message}`);
        } else {
          // Try to add creator as admin
          const { error: memberError } = await supabase
            .from('messaging_group_members')
            .insert({
              group_id: newGroup.id,
              employee_id: authenticatedUser.employeeId,
              role: 'admin'
            });
            
          debugInfo.groupCreationTest = {
            tableExists: true,
            canCreateGroup: true,
            groupCreated: {
              id: newGroup.id,
              name: newGroup.name,
              created_by: newGroup.created_by
            },
            canAddMember: !memberError,
            memberError: memberError?.message
          };
          
          // Clean up test group
          await supabase.from('messaging_group_members').delete().eq('group_id', newGroup.id);
          await supabase.from('messaging_groups').delete().eq('id', newGroup.id);
          debugInfo.groupCreationTest.cleanedUp = true;
        }
      }
      
      console.log('[DEBUG] Group creation test:', debugInfo.groupCreationTest);

      // Step 5: Check RLS policies
      debugInfo.step = 'checking-rls-policies';
      const { data: rlsCheck, error: rlsError } = await supabase
        .rpc('get_current_user_id');
        
      debugInfo.rlsPolicies = {
        hasGetCurrentUserId: !rlsError && rlsCheck === authenticatedUser.employeeId,
        currentUserId: rlsCheck,
        rlsError: rlsError?.message
      };
      
      console.log('[DEBUG] RLS policies:', debugInfo.rlsPolicies);

    } catch (authError: any) {
      debugInfo.errors.push(`Authentication error: ${authError.message}`);
      console.error('[DEBUG] Authentication error:', authError);
    }

    debugInfo.step = 'complete';
    debugInfo.success = debugInfo.errors.length === 0;

    return NextResponse.json(debugInfo, { 
      status: debugInfo.success ? 200 : 500 
    });

  } catch (error: any) {
    console.error('[DEBUG] Unhandled error:', error);
    debugInfo.errors.push(`Unhandled error: ${error.message}`);
    debugInfo.step = 'error';
    
    return NextResponse.json(debugInfo, { status: 500 });
  }
}

// GET endpoint to check if authenticated
export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({
        authenticated: false,
        message: 'No authenticated user found'
      }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      employeeId: authenticatedUser.employeeId,
      sessionId: authenticatedUser.sessionId
    });
    
  } catch (error: any) {
    return NextResponse.json({
      authenticated: false,
      error: error.message
    }, { status: 500 });
  }
}
