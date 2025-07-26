import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { Message, SendMessageRequest } from '@/types/messaging';

// GET /api/messaging/groups/[id]/messages - Fetch messages for a group
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const params = await context.params;
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Get current user ID from query params for development
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('userId') || '90145293'; // Default to Nayyar Khurshid

    console.log('Fetching messages for group:', groupId, 'user:', employeeId);

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get pagination parameters
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Fetch messages with sender information and reply data
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        group_id,
        sender_id,
        content,
        message_type,
        status,
        read_by,
        created_at,
        edited_at,
        deleted_at,
        reply_to_id,
        edit_count,
        employees!messages_sender_id_fkey(name),
        reply_message:messages!reply_to_id(
          id,
          content,
          sender_id,
          employees!messages_sender_id_fkey(name)
        )
      `)
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Transform messages with sender names and reply context
    const transformedMessages: Message[] = (messages || []).map((msg: any) => ({
      id: msg.id,
      groupId: msg.group_id,
      senderId: msg.sender_id,
      content: msg.content,
      messageType: msg.message_type,
      status: msg.status,
      readBy: msg.read_by || [],
      createdAt: new Date(msg.created_at),
      editedAt: msg.edited_at ? new Date(msg.edited_at) : undefined,
      deletedAt: msg.deleted_at ? new Date(msg.deleted_at) : undefined,
      senderName: (msg.employees as any)?.name || 'Unknown User',
      editCount: msg.edit_count || 0,
      replyToMessage: msg.reply_message ? {
        id: (msg.reply_message as any).id,
        content: (msg.reply_message as any).content,
        senderName: (msg.reply_message as any).employees?.name || 'Unknown User'
      } : undefined
    }));

    return NextResponse.json({ messages: transformedMessages.reverse() });

  } catch (error) {
    console.error('Unexpected error in messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/messaging/groups/[id]/messages - Mark messages as read
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const params = await context.params;
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employeeId = session.user.id;
    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json({ error: 'Invalid messageIds array' }, { status: 400 });
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // For each message, add current user to read_by array if not already there
    const updates = [];
    for (const messageId of messageIds) {
      // First get the current read_by array
      const { data: currentMessage } = await supabase
        .from('messages')
        .select('read_by')
        .eq('id', messageId)
        .eq('group_id', groupId)
        .single();

      if (currentMessage) {
        const readBy = currentMessage.read_by || [];
        if (!readBy.includes(employeeId)) {
          readBy.push(employeeId);
          updates.push(
            supabase
              .from('messages')
              .update({ read_by: readBy })
              .eq('id', messageId)
          );
        }
      }
    }

    // Execute all updates
    const results = await Promise.all(updates);
    const successCount = results.filter(result => !result.error).length;

    return NextResponse.json({ 
      success: true, 
      updatedCount: successCount 
    });

  } catch (error) {
    console.error('Unexpected error in messages PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/messaging/groups/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const params = await context.params;
    const groupId = parseInt(params.id);
    
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Get current user ID from query params for development
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('userId') || '90145293'; // Default to Nayyar Khurshid
    
    const body: SendMessageRequest = await request.json();

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    console.log('Sending message to group:', groupId, 'from user:', employeeId);

    // Verify user is a member of the group
    const { data: membership } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', employeeId)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Insert the new message
    const { data: newMessage, error: insertError } = await supabase
      .from('messages')
      .insert({
        group_id: groupId,
        sender_id: employeeId,
        content: body.content.trim(),
        message_type: body.messageType || 'text',
        reply_to_id: body.replyToId || null,
        status: 'sent'
      })
      .select(`
        id,
        group_id,
        sender_id,
        content,
        message_type,
        status,
        read_by,
        created_at,
        reply_to_id,
        employees!messages_sender_id_fkey(name),
        reply_message:messages!reply_to_id(
          id,
          content,
          sender_id,
          employees!messages_sender_id_fkey(name)
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating message:', insertError);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // Update group's updated_at timestamp
    await supabase
      .from('groups')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', groupId);

    // Transform the message response
    const message: Message = {
      id: newMessage.id,
      groupId: newMessage.group_id,
      senderId: newMessage.sender_id,
      content: newMessage.content,
      messageType: newMessage.message_type,
      status: newMessage.status,
      readBy: newMessage.read_by || [],
      createdAt: new Date(newMessage.created_at),
      senderName: (newMessage.employees as any)?.name || 'Unknown User',
      replyToMessage: newMessage.reply_message ? {
        id: (newMessage.reply_message as any).id,
        content: (newMessage.reply_message as any).content,
        senderName: (newMessage.reply_message as any).employees?.name || 'Unknown User'
      } : undefined
    };

    console.log('Message sent successfully:', message.id);

    return NextResponse.json({ message }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in send message API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
