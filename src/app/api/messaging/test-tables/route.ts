import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/auth/server-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();
    const results: any = {
      user: {
        sessionId: user.sessionId,
        employeeId: user.employeeId
      },
      tables: {}
    };

    // Test each messaging table
    const tablesToTest = [
      'messaging_groups',
      'messaging_group_members',
      'messaging_messages'
    ];

    for (const table of tablesToTest) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        results.tables[table] = {
          accessible: !error,
          error: error?.message,
          count: count
        };
      } catch (e: any) {
        results.tables[table] = {
          accessible: false,
          error: e.message
        };
      }
    }

    // Test foreign key relationships
    try {
      const { data: testMessage, error: msgError } = await supabase
        .from('messaging_messages')
        .select(`
          id,
          employees!messaging_messages_sender_id_fkey(name)
        `)
        .limit(1)
        .single();

      results.foreignKeyTest = {
        success: !msgError,
        error: msgError?.message,
        hint: msgError?.hint
      };
    } catch (e: any) {
      results.foreignKeyTest = {
        success: false,
        error: e.message
      };
    }

    // Test if user has any groups
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('messaging_group_members')
        .select('group_id')
        .eq('employee_id', user.employeeId);

      results.userGroups = {
        count: groups?.length || 0,
        groupIds: groups?.map(g => g.group_id) || [],
        error: groupsError?.message
      };
    } catch (e: any) {
      results.userGroups = {
        count: 0,
        error: e.message
      };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Test tables error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      message: error.message
    }, { status: 500 });
  }
}
