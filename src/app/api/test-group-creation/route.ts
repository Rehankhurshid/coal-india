import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser, setUserContextForRLS } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ 
        error: 'Not authenticated',
        hint: 'Please login first or add ?userId=your-employee-id in development'
      }, { status: 401 });
    }

    const currentUserId = authenticatedUser.employeeId;
    const supabase = createServerClient();
    
    // Test 1: Check if service role key is being used
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isUsingServiceRole = !!serviceRoleKey;
    
    // Test 2: Try to set RLS context
    let rlsContextSet = false;
    let rlsError = null;
    try {
      await setUserContextForRLS(currentUserId);
      
      // Verify RLS context was set
      const { data: currentUserCheck, error: checkError } = await supabase
        .rpc('current_user_id');
      
      if (!checkError && currentUserCheck === currentUserId) {
        rlsContextSet = true;
      } else {
        rlsError = checkError?.message || 'RLS context not properly set';
      }
    } catch (error) {
      rlsError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Test 3: Try direct insert (bypasses RLS if using service role)
    let directInsertResult = null;
    let directInsertError = null;
    try {
      const { data, error } = await supabase
        .from('messaging_groups')
        .insert({
          name: `Test Group ${Date.now()}`,
          description: 'Created by test endpoint',
          created_by: currentUserId
        })
        .select()
        .single();
      
      directInsertResult = data;
      directInsertError = error;
      
      // Clean up test group if created
      if (data) {
        await supabase
          .from('messaging_groups')
          .delete()
          .eq('id', data.id);
      }
    } catch (error) {
      directInsertError = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Test 4: Check if employee exists
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('emp_code, name')
      .eq('emp_code', currentUserId)
      .single();
    
    // Test 5: Check RLS policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .eq('tablename', 'messaging_groups');
    
    return NextResponse.json({
      tests: {
        authentication: {
          success: true,
          userId: currentUserId,
          method: authenticatedUser.token.startsWith('dev-') ? 'development' : 'jwt'
        },
        supabaseConfig: {
          isUsingServiceRole,
          hint: isUsingServiceRole ? 
            'Using service role key (should bypass RLS)' : 
            'Using anon key (subject to RLS policies)'
        },
        rlsContext: {
          success: rlsContextSet,
          error: rlsError,
          hint: rlsContextSet ? 
            'RLS context set successfully' : 
            'Failed to set RLS context - this is the likely issue'
        },
        directInsert: {
          success: !!directInsertResult,
          error: typeof directInsertError === 'string' ? directInsertError : directInsertError?.message,
          hint: directInsertResult ? 
            'Direct insert worked - database is functional' : 
            'Direct insert failed - check error message'
        },
        employeeExists: {
          success: !!employee,
          employeeId: employee?.emp_code,
          name: employee?.name,
          error: employeeError?.message,
          hint: employee ? 
            'Employee exists in database' : 
            'Employee not found - this could cause foreign key issues'
        }
      },
      recommendations: [
        !isUsingServiceRole && 'Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file',
        !rlsContextSet && 'RLS context is not being set properly - check the set_current_user_id function',
        !employee && `Employee ${currentUserId} not found in database - verify your employee ID`,
        directInsertError && 'Check the error message from direct insert attempt'
      ].filter(Boolean)
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
