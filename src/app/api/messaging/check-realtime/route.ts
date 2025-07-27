import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth/server-auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if real-time is enabled for messaging tables
    const { data: realtimeTables, error } = await supabase
      .from('pg_publication_tables')
      .select('*')
      .eq('pubname', 'supabase_realtime')
    
    if (error) {
      // This query might fail if we don't have permissions
      return NextResponse.json({
        message: 'Cannot check real-time status directly',
        instructions: 'Please check in Supabase Dashboard → Database → Replication',
        requiredTables: [
          'messaging_messages',
          'messaging_groups', 
          'messaging_group_members'
        ]
      })
    }

    // Check which messaging tables have real-time enabled
    const enabledTables = (realtimeTables || []).map(t => t.tablename)
    const requiredTables = ['messaging_messages', 'messaging_groups', 'messaging_group_members']
    const missingTables = requiredTables.filter(t => !enabledTables.includes(t))

    return NextResponse.json({
      realtimeEnabled: missingTables.length === 0,
      enabledTables: enabledTables.filter(t => t.startsWith('messaging_')),
      missingTables,
      instructions: missingTables.length > 0 ? {
        message: 'Real-time is not fully enabled',
        steps: [
          '1. Go to Supabase Dashboard',
          '2. Navigate to Database → Replication', 
          '3. Enable real-time for: ' + missingTables.join(', '),
          '4. Or run the SQL in src/lib/database/enable-realtime-messaging.sql'
        ]
      } : {
        message: 'Real-time is properly configured!',
        features: [
          'Instant message delivery',
          'Live message updates',
          'Real-time deletion',
          'Typing indicators'
        ]
      }
    })
  } catch (error) {
    console.error('Error checking real-time status:', error)
    return NextResponse.json(
      { error: 'Failed to check real-time status' },
      { status: 500 }
    )
  }
}
