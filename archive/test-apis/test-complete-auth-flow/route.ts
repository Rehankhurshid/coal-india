import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser, setUserContextForRLS } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  const results: any[] = [];
  let currentStep = 0;

  const addResult = (step: string, success: boolean, details: string, data?: any) => {
    currentStep++;
    results.push({
      step: currentStep,
      name: step,
      success,
      details,
      data,
      timestamp: new Date().toISOString()
    });
  };

  try {
    // Step 1: Test Authentication
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      addResult('Authentication Check', false, 'User not authenticated');
      return NextResponse.json({ success: false, results });
    }
    
    const supabase = createServerClient();
    const currentUserId = authenticatedUser.employeeId;

    // Get employee details
    let employeeDetails = null;
    try {
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('name, designation, dept')
        .eq('emp_code', currentUserId)
        .single();
      
      if (!empError && employee) {
        employeeDetails = employee;
        addResult('Authentication Check', true, `Authenticated as ${employee.name} (${authenticatedUser.employeeId})`);
      } else {
        addResult('Authentication Check', true, `Authenticated as employee ID ${authenticatedUser.employeeId}`);
      }
    } catch (error) {
      addResult('Authentication Check', true, `Authenticated as employee ID ${authenticatedUser.employeeId}`);
    }

    // Step 2: Set RLS Context
    try {
      await setUserContextForRLS(currentUserId);
      addResult('RLS Context Setup', true, 'User context set for Row Level Security');
    } catch (error) {
      addResult('RLS Context Setup', false, `Failed to set RLS context: ${error}`);
    }

    // Step 3: Test Database Connection
    try {
      const { data, error } = await supabase.from('employees').select('count').limit(1);
      if (error) throw error;
      addResult('Database Connection', true, 'Successfully connected to Supabase');
    } catch (error) {
      addResult('Database Connection', false, `Database connection failed: ${error}`);
    }

    // Step 4: Check Messaging Tables Exist
    const tables = ['messaging_groups', 'messaging_group_members', 'messaging_messages'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) throw error;
        addResult(`Table Check: ${table}`, true, `Table ${table} exists and is accessible`);
      } catch (error) {
        addResult(`Table Check: ${table}`, false, `Table ${table} error: ${error}`);
      }
    }

    // Step 5: Test Group Creation
    const testGroupName = `Test Group ${Date.now()}`;
    let createdGroupId: number | null = null;

    try {
      const { data: newGroup, error: groupError } = await supabase
        .from('messaging_groups')
        .insert({
          name: testGroupName,
          description: 'Test group for authentication validation',
          created_by: currentUserId
        })
        .select()
        .single();

      if (groupError) throw groupError;
      
      createdGroupId = newGroup.id;
      addResult('Group Creation', true, `Created group "${testGroupName}" with ID ${newGroup.id}`, newGroup);
    } catch (error) {
      addResult('Group Creation', false, `Failed to create group: ${error}`);
    }

    // Step 6: Test Group Membership Addition
    if (createdGroupId) {
      try {
        const { error: memberError } = await supabase
          .from('messaging_group_members')
          .insert({
            group_id: createdGroupId,
            employee_id: currentUserId,
            role: 'admin'
          });

        if (memberError) throw memberError;
        addResult('Group Membership', true, `Added creator as admin to group ${createdGroupId}`);
      } catch (error) {
        addResult('Group Membership', false, `Failed to add membership: ${error}`);
      }
    }

    // Step 7: Test Message Creation
    if (createdGroupId) {
      try {
        const { data: newMessage, error: messageError } = await supabase
          .from('messaging_messages')
          .insert({
            group_id: createdGroupId,
            sender_id: currentUserId,
            content: 'Test message for authentication validation',
            message_type: 'text'
          })
          .select()
          .single();

        if (messageError) throw messageError;
        addResult('Message Creation', true, `Created test message in group ${createdGroupId}`, newMessage);
      } catch (error) {
        addResult('Message Creation', false, `Failed to create message: ${error}`);
      }
    }

    // Step 8: Test Group Retrieval
    try {
      const { data: userGroups, error: groupsError } = await supabase
        .from('messaging_group_members')
        .select(`
          group_id,
          role,
          messaging_groups (
            id,
            name,
            description,
            created_by,
            created_at
          )
        `)
        .eq('employee_id', currentUserId);

      if (groupsError) throw groupsError;
      addResult('Group Retrieval', true, `Retrieved ${userGroups?.length || 0} groups for user`, userGroups);
    } catch (error) {
      addResult('Group Retrieval', false, `Failed to retrieve groups: ${error}`);
    }

    // Step 9: Test RLS Function
    try {
      const { data: functionResult, error: functionError } = await supabase
        .rpc('get_user_groups', { user_id: currentUserId });

      if (functionError) throw functionError;
      addResult('RLS Function Test', true, `RLS function returned ${functionResult?.length || 0} groups`, functionResult);
    } catch (error) {
      addResult('RLS Function Test', false, `RLS function failed: ${error}`);
    }

    // Step 10: Cleanup Test Data
    if (createdGroupId) {
      try {
        // Delete messages first (foreign key constraint)
        await supabase
          .from('messaging_messages')
          .delete()
          .eq('group_id', createdGroupId);

        // Delete memberships
        await supabase
          .from('messaging_group_members')
          .delete()
          .eq('group_id', createdGroupId);

        // Delete group
        await supabase
          .from('messaging_groups')
          .delete()
          .eq('id', createdGroupId);

        addResult('Cleanup', true, `Cleaned up test group ${createdGroupId}`);
      } catch (error) {
        addResult('Cleanup', false, `Cleanup failed: ${error}`);
      }
    }

    // Summary
    const successCount = results.filter(r => r.success).length;
    const totalSteps = results.length;
    const successRate = Math.round((successCount / totalSteps) * 100);

    return NextResponse.json({
      success: successRate === 100,
      summary: {
        totalSteps,
        successCount,
        failureCount: totalSteps - successCount,
        successRate: `${successRate}%`
      },
      authenticatedUser: {
        employeeId: authenticatedUser.employeeId,
        name: employeeDetails?.name || 'Unknown',
        department: employeeDetails?.dept || 'Unknown',
        designation: employeeDetails?.designation || 'Unknown'
      },
      results
    });

  } catch (error) {
    addResult('Unexpected Error', false, `Unexpected error: ${error}`);
    return NextResponse.json({ success: false, error: String(error), results }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupName, groupDescription, memberIds = [] } = body;

    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = authenticatedUser.employeeId;
    const supabase = createServerClient();
    
    // Set user context for RLS
    await setUserContextForRLS(currentUserId);

    if (!groupName) {
      return NextResponse.json({ success: false, error: 'Group name is required' }, { status: 400 });
    }

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('messaging_groups')
      .insert({
        name: groupName,
        description: groupDescription,
        created_by: currentUserId
      })
      .select()
      .single();

    if (groupError) {
      return NextResponse.json({ success: false, error: `Failed to create group: ${groupError.message}` }, { status: 500 });
    }

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('messaging_group_members')
      .insert({
        group_id: newGroup.id,
        employee_id: currentUserId,
        role: 'admin'
      });

    if (memberError) {
      // Rollback group creation
      await supabase.from('messaging_groups').delete().eq('id', newGroup.id);
      return NextResponse.json({ success: false, error: `Failed to add creator as admin: ${memberError.message}` }, { status: 500 });
    }

    // Add other members if provided
    if (memberIds.length > 0) {
      const memberInserts = memberIds.map((employeeId: string) => ({
        group_id: newGroup.id,
        employee_id: employeeId,
        role: 'member'
      }));

      const { error: membersError } = await supabase
        .from('messaging_group_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('Error adding members:', membersError);
        // Don't fail the entire request, but log it
      }
    }

    return NextResponse.json({
      success: true,
      group: {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        createdBy: newGroup.created_by,
        createdAt: newGroup.created_at,
        memberCount: 1 + memberIds.length
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
