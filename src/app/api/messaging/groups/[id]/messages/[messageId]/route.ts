import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// PATCH /api/messaging/groups/[id]/messages/[messageId] - Edit message
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { content, userId } = await req.json()
    const params = await context.params
    const { id: groupId, messageId } = params

    if (!content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: content, userId' },
        { status: 400 }
      )
    }

    // Verify user is the sender of the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, content, edit_count')
      .eq('id', messageId)
      .eq('group_id', groupId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (message.sender_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only edit your own messages' },
        { status: 403 }
      )
    }

    // Check if content is different
    if (message.content === content.trim()) {
      return NextResponse.json(
        { error: 'No changes detected' },
        { status: 400 }
      )
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        content: content.trim(),
        edited_at: new Date().toISOString(),
        edit_count: (message.edit_count || 0) + 1
      })
      .eq('id', messageId)
      .select(`
        id,
        content,
        sender_id,
        group_id,
        message_type,
        status,
        read_by,
        created_at,
        edited_at,
        edit_count
      `)
      .single()

    if (updateError) {
      console.error('Error updating message:', updateError)
      return NextResponse.json(
        { error: 'Failed to update message' },
        { status: 500 }
      )
    }

    // Get sender name separately
    const { data: senderData } = await supabase
      .from('employees')
      .select('name')
      .eq('id', userId)
      .single()

    return NextResponse.json({
      success: true,
      message: {
        id: updatedMessage.id,
        content: updatedMessage.content,
        senderId: updatedMessage.sender_id,
        groupId: updatedMessage.group_id,
        messageType: updatedMessage.message_type,
        status: updatedMessage.status,
        readBy: updatedMessage.read_by || [],
        createdAt: new Date(updatedMessage.created_at),
        editedAt: updatedMessage.edited_at ? new Date(updatedMessage.edited_at) : undefined,
        editCount: updatedMessage.edit_count || 0,
        senderName: senderData?.name || 'Unknown User'
      }
    })

  } catch (error) {
    console.error('Error in PATCH /api/messaging/groups/[id]/messages/[messageId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/messaging/groups/[id]/messages/[messageId] - Delete message
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { userId } = await req.json()
    const params = await context.params
    const { id: groupId, messageId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      )
    }

    // Verify user is the sender of the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('sender_id, deleted_at')
      .eq('id', messageId)
      .eq('group_id', groupId)
      .single()

    if (messageError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    if (message.sender_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own messages' },
        { status: 403 }
      )
    }

    if (message.deleted_at) {
      return NextResponse.json(
        { error: 'Message is already deleted' },
        { status: 400 }
      )
    }

    // Soft delete the message (keep for history but mark as deleted)
    const { data: deletedMessage, error: deleteError } = await supabase
      .from('messages')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select(`
        id,
        deleted_at
      `)
      .single()

    if (deleteError) {
      console.error('Error deleting message:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete message' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: deletedMessage.id,
      deletedAt: deletedMessage.deleted_at
    })

  } catch (error) {
    console.error('Error in DELETE /api/messaging/groups/[id]/messages/[messageId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
