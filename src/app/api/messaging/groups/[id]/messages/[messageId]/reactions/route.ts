import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/messaging/groups/[id]/messages/[messageId]/reactions
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { emoji, userId } = await req.json()
    const params = await context.params
    const { id: groupId, messageId } = params

    if (!emoji || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: emoji, userId' },
        { status: 400 }
      )
    }

    // Verify user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('employee_id', userId)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Unauthorized: User is not a member of this group' },
        { status: 403 }
      )
    }

    // Check if reaction already exists
    const { data: existingReaction, error: checkError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('emoji', emoji)
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing reaction:', checkError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingReaction) {
      return NextResponse.json(
        { error: 'Reaction already exists' },
        { status: 409 }
      )
    }

    // Add the reaction
    const { data: reaction, error: reactionError } = await supabase
      .from('message_reactions')
      .insert({
        message_id: parseInt(messageId),
        emoji,
        user_id: userId,
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        emoji,
        user_id,
        created_at
      `)
      .single()

    if (reactionError) {
      console.error('Error adding reaction:', reactionError)
      return NextResponse.json(
        { error: 'Failed to add reaction' },
        { status: 500 }
      )
    }

    // Get user name separately
    const { data: userData } = await supabase
      .from('employees')
      .select('name')
      .eq('id', userId)
      .single()

    // Get updated reaction counts for this message
    const { data: reactionCounts, error: countError } = await supabase
      .rpc('get_message_reactions', { message_id_param: parseInt(messageId) })

    if (countError) {
      console.error('Error fetching reaction counts:', countError)
      // Fallback to basic query
      const { data: fallbackReactions } = await supabase
        .from('message_reactions')
        .select('emoji, user_id')
        .eq('message_id', messageId)
      
      const groupedReactions: Record<string, any[]> = {}
      fallbackReactions?.forEach(r => {
        if (!groupedReactions[r.emoji]) {
          groupedReactions[r.emoji] = []
        }
        groupedReactions[r.emoji].push({
          userId: r.user_id,
          userName: 'User' // Fallback name
        })
      })

      return NextResponse.json({
        success: true,
        reaction: {
          id: reaction.id,
          emoji: reaction.emoji,
          userId: reaction.user_id,
          userName: userData?.name || 'Unknown User',
          createdAt: reaction.created_at
        },
        allReactions: groupedReactions
      })
    }

    // Group reactions by emoji
    const groupedReactions: Record<string, any[]> = {}
    reactionCounts?.forEach((r: any) => {
      if (!groupedReactions[r.emoji]) {
        groupedReactions[r.emoji] = []
      }
      groupedReactions[r.emoji].push({
        userId: r.user_id,
        userName: r.user_name || 'Unknown User'
      })
    })

    return NextResponse.json({
      success: true,
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
        userId: reaction.user_id,
        userName: userData?.name || 'Unknown User',
        createdAt: reaction.created_at
      },
      allReactions: groupedReactions
    })

  } catch (error) {
    console.error('Error in POST /api/messaging/groups/[id]/messages/[messageId]/reactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/messaging/groups/[id]/messages/[messageId]/reactions
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { emoji, userId } = await req.json()
    const params = await context.params
    const { messageId } = params

    if (!emoji || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: emoji, userId' },
        { status: 400 }
      )
    }

    // Remove the reaction
    const { data: deletedReaction, error: deleteError } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('emoji', emoji)
      .eq('user_id', userId)
      .select('id')
      .single()

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Reaction not found' },
          { status: 404 }
        )
      }
      console.error('Error removing reaction:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove reaction' },
        { status: 500 }
      )
    }

    // Get updated reaction counts for this message
    const { data: reactionCounts, error: countError } = await supabase
      .from('message_reactions')
      .select('emoji, user_id')
      .eq('message_id', messageId)

    if (countError) {
      console.error('Error fetching reaction counts:', countError)
    }

    // Group reactions by emoji (simplified without user names for now)
    const groupedReactions: Record<string, any[]> = {}
    reactionCounts?.forEach(r => {
      if (!groupedReactions[r.emoji]) {
        groupedReactions[r.emoji] = []
      }
      groupedReactions[r.emoji].push({
        userId: r.user_id,
        userName: 'User' // Simplified for now
      })
    })

    return NextResponse.json({
      success: true,
      deletedReactionId: deletedReaction.id,
      allReactions: groupedReactions
    })

  } catch (error) {
    console.error('Error in DELETE /api/messaging/groups/[id]/messages/[messageId]/reactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/messaging/groups/[id]/messages/[messageId]/reactions
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const params = await context.params
    const { messageId } = params

    // Get all reactions for this message
    const { data: reactions, error } = await supabase
      .from('message_reactions')
      .select(`
        id,
        emoji,
        user_id,
        created_at
      `)
      .eq('message_id', messageId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching reactions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reactions' },
        { status: 500 }
      )
    }

    // Group reactions by emoji (simplified without user names for now)
    const groupedReactions: Record<string, any[]> = {}
    reactions?.forEach(r => {
      if (!groupedReactions[r.emoji]) {
        groupedReactions[r.emoji] = []
      }
      groupedReactions[r.emoji].push({
        id: r.id,
        userId: r.user_id,
        userName: 'User', // Simplified for now
        createdAt: r.created_at
      })
    })

    return NextResponse.json({
      success: true,
      reactions: groupedReactions,
      totalCount: reactions?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/messaging/groups/[id]/messages/[messageId]/reactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
