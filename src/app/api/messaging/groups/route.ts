import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { Group, CreateGroupRequest } from '@/types/messaging';

// GET /api/messaging/groups - Fetch user's groups with real Supabase data
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    
    // Get current user ID from query params or session
    // For development, allowing override via query param
    const currentUserId = searchParams.get('userId') || '90145293'; // Default to Nayyar Khurshid
    
    console.log('Fetching groups for user:', currentUserId);

    // Use raw SQL query to debug the issue
    const { data: rawData, error: sqlError } = await supabase
      .rpc('get_user_groups', { user_id: currentUserId });

    if (sqlError) {
      console.log('SQL function not found, using direct query approach');
      
      // Fallback to direct query
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('employee_id', currentUserId);

      if (groupsError) {
        console.error('Error fetching user group memberships:', groupsError);
        return NextResponse.json({ error: 'Failed to fetch group memberships' }, { status: 500 });
      }

      console.log('Found group memberships:', userGroups?.length || 0);

      if (!userGroups || userGroups.length === 0) {
        return NextResponse.json({
          success: true,
          groups: []
        });
      }

      // Get group details for each membership
      const groupIds = userGroups.map(membership => membership.group_id);
      const { data: groups, error: groupDetailsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds);

      if (groupDetailsError) {
        console.error('Error fetching group details:', groupDetailsError);
        return NextResponse.json({ error: 'Failed to fetch group details' }, { status: 500 });
      }

      console.log('Found groups:', groups?.length || 0);

      // Enrich groups with additional data
      const enrichedGroups = await Promise.all(
        (groups || []).map(async (group) => {
          const membership = userGroups.find(m => m.group_id === group.id);
          
          // Get member count
          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('group_id', group.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count for current user
          const { count: totalMessages } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)
            .is('deleted_at', null);

          // Count messages read by current user
          const { count: readMessages } = await supabase
            .from('messages')
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

      console.log('Returning enriched groups:', enrichedGroups.length);

      return NextResponse.json({
        success: true,
        groups: enrichedGroups
      });
    }

    // If SQL function exists, use that result
    console.log('Using SQL function result:', rawData?.length || 0);
    return NextResponse.json({
      success: true,
      groups: rawData || []
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messaging/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const currentUserId = searchParams.get('userId') || '90145293';
    
    const body = await request.json();
    const { name, description, createdBy, memberIds = [] } = body;

    if (!name || !createdBy) {
      return NextResponse.json({ error: 'Name and createdBy are required' }, { status: 400 });
    }

    console.log('Creating group:', { name, description, createdBy, memberIds });

    // Create the group
    const { data: newGroup, error: groupError } = await supabase
      .from('groups')
      .insert({
        name,
        description,
        created_by: createdBy
      })
      .select()
      .single();

    if (groupError) {
      console.error('Error creating group:', groupError);
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    console.log('Created group:', newGroup);

    // Add creator as admin
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: newGroup.id,
        employee_id: createdBy,
        role: 'admin'
      });

    if (memberError) {
      console.error('Error adding creator as admin:', memberError);
      return NextResponse.json({ error: 'Failed to add creator as admin' }, { status: 500 });
    }

    // Add other members if provided
    if (memberIds.length > 0) {
      const memberInserts = memberIds.map((employeeId: string) => ({
        group_id: newGroup.id,
        employee_id: employeeId,
        role: 'member'
      }));

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (membersError) {
        console.error('Error adding members:', membersError);
        // Don't fail the entire request for this
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
        memberCount: 1 + memberIds.length,
        avatar: newGroup.name.split(' ').map((word: string) => word.charAt(0)).join('').toUpperCase().slice(0, 2)
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
