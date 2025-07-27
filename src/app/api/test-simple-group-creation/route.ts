import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Test 1: Simple group creation with hardcoded values
    const { data: group, error: groupError } = await supabase
      .from('messaging_groups')
      .insert({
        name: `Test Group ${new Date().toISOString()}`,
        description: 'Simple test',
        created_by: '14570535'
      })
      .select()
      .single();

    if (groupError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to create group',
        details: groupError.message,
        hint: groupError.hint,
        code: groupError.code
      });
    }

    // Test 2: Add member
    const { data: member, error: memberError } = await supabase
      .from('messaging_group_members')
      .insert({
        group_id: group.id,
        employee_id: '14570535',
        role: 'admin'
      })
      .select()
      .single();

    if (memberError) {
      // Clean up group
      await supabase.from('messaging_groups').delete().eq('id', group.id);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to add member',
        details: memberError.message,
        groupCreated: true,
        groupId: group.id
      });
    }

    return NextResponse.json({
      success: true,
      group: group,
      member: member,
      serviceRoleKeyUsed: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
