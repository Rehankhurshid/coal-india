import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { Group, CreateGroupRequest } from '@/types/messaging';
import { getAuthenticatedUser, setUserContextForRLS } from '@/lib/auth/server-auth';

// GET /api/messaging/groups - Fetch user's groups with real Supabase data
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = authenticatedUser.employeeId;
    console.log('Fetching groups for authenticated user:', currentUserId);

    const supabase = createServerClient();
    
    // Set user context for RLS
    await setUserContextForRLS(currentUserId);

    // Use raw SQL query to debug the issue
    const { data: rawData, error: sqlError } = await supabase
      .rpc('get_user_groups', { user_id: currentUserId });

    if (sqlError && !sqlError.message.includes('function get_user_groups(user_id => character varying) does not exist')) {
      console.error('Error fetching user groups with SQL function:', sqlError);
    } else if (rawData) {
      console.log('Using SQL function result:', rawData.length);
      return NextResponse.json({
        success: true,
        groups: rawData,
      });
    }

    console.log('SQL function not found or failed, using direct query approach');
      
      // Fallback to direct query
      const { data: userGroups, error: groupsError } = await supabase
        .from('messaging_group_members')
        .select('group_id, role, joined_at')
        .eq('employee_id', currentUserId);

      if (groupsError) {
        console.error('Error fetching user group memberships:', groupsError);
        return NextResponse.json({ error: 'Failed to fetch group memberships' }, { status: 500 });
      }

      if (!userGroups || userGroups.length === 0) {
        return NextResponse.json({
          success: true,
          groups: []
        });
      }

      // Get group details for each membership
      const groupIds = userGroups.map(membership => membership.group_id);
      const { data: groups, error: groupDetailsError } = await supabase
        .from('messaging_groups')
        .select('*')
        .in('id', groupIds);

      if (groupDetailsError) {
        console.error('Error fetching group details:', groupDetailsError);
        return NextResponse.json({ error: 'Failed to fetch group details' }, { status: 500 });
      }

      // Enrich groups with additional data
      const enrichedGroups = await Promise.all(
        (groups || []).map(async (group) => {
          const membership = userGroups.find(m => m.group_id === group.id);
          
          // Get member count
          const { count: memberCount } = await supabase
            .from('messaging_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messaging_messages')
            .select('content, created_at, sender_id')
            .eq('group_id', group.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count for current user
          const { count: totalMessages } = await supabase
            .from('messaging_messages')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .is('deleted_at', null);

          // Count messages read by current user
          const { count: readMessages } = await supabase
            .from('messaging_messages')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .is('deleted_at', null)
            .contains('read_by', [currentUserId]);

          const unreadCount = Math.max(0, (totalMessages || 0) - (readMessages || 0));

          return {
            id: group.id,
            name: group.name,
            description: group.description,
            createdBy: group.created_by,
            createdAt: group.created_at,
            updatedAt: group.updated_at,
            memberCount: memberCount || 0,
            lastMessage: lastMessage?.content || 'No messages yet',
            unreadCount: unreadCount,
            userRole: membership?.role || 'member',
            avatar: group.name.split(' ').map((word: string) => word.charAt(0)).join('').toUpperCase().slice(0, 2)
          };
        })
      );

      return NextResponse.json({
        success: true,
        groups: enrichedGroups
      });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messaging/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    console.log('[api/messaging/groups] POST: Received request to create group.');
    // Get authenticated user
    const authenticatedUser = await getAuthenticatedUser(request);
    
    if (!authenticatedUser) {
      console.error('[api/messaging/groups] POST: Authentication failed. User is not authenticated.');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const currentUserId = authenticatedUser.employeeId;
    console.log(`[api/messaging/groups] POST: Authenticated as user ${currentUserId}.`);
    const supabase = createServerClient();
    
    // Set user context for RLS
    await setUserContextForRLS(currentUserId);
    
    const body = await request.json();
    const { name, description, memberIds = [] } = body;
    console.log('[api/messaging/groups] POST: Request body parsed:', { name, description, memberIds });

    if (!name) {
      console.warn('[api/messaging/groups] POST: Validation failed - Name is required.');
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    console.log('[api/messaging/groups] POST: Creating group with details:', { name, description, createdBy: currentUserId, memberIds });

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('messaging_groups')
      .insert({
        name,
        description,
        created_by: currentUserId
      })
      .select()
      .single();

    if (groupError) {
      console.error('[api/messaging/groups] POST: Error creating group in Supabase:', groupError);
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    console.log('[api/messaging/groups] POST: Group created successfully:', newGroup);

    // Add creator as admin
    console.log(`[api/messaging/groups] POST: Adding creator ${currentUserId} as admin to group ${newGroup.id}.`);
    const { error: memberError } = await supabase
      .from('messaging_group_members')
      .insert({
        group_id: newGroup.id,
        employee_id: currentUserId,
        role: 'admin'
      });

    if (memberError) {
      console.error(`[api/messaging/groups] POST: Error adding creator as admin to group ${newGroup.id}:`, memberError);
      // Attempt to roll back group creation
      await supabase.from('messaging_groups').delete().eq('id', newGroup.id);
      console.log(`[api/messaging/groups] POST: Rolled back group creation for id ${newGroup.id}.`);
      return NextResponse.json({ error: 'Failed to add creator as admin' }, { status: 500 });
    }

    // Add other members if provided
    if (memberIds.length > 0) {
      const memberInserts = memberIds.map((employeeId: string) => ({
        group_id: newGroup.id,
        employee_id: employeeId,
        role: 'member'
      }));
      console.log('[api/messaging/groups] POST: Adding other members:', memberInserts);

      const { error: membersError } = await supabase
        .from('messaging_group_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('[api/messaging/groups] POST: Error adding members:', membersError);
        // Don't fail the entire request for this, but log it as a partial success.
      }
    }

    console.log(`[api/messaging/groups] POST: Successfully created group and added members for group id ${newGroup.id}.`);
    return NextResponse.json({
      success: true,
      group: {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        createdBy: newGroup.created_by,
        createdAt: newGroup.created_at,
        memberCount: 1 + memberIds.length,
        avatar: newGroup.name.split(' ').map((word: string) => word.charAt(0)).join('').toUpperCase().slice(0, 2)
      }
    });

  } catch (error) {
    console.error('[api/messaging/groups] POST: Unhandled error in create group endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
