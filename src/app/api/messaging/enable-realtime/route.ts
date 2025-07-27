import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser } from '@/lib/auth/server-auth'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // This requires service role key, so we'll just return instructions
    // The actual enabling must be done in Supabase dashboard or via SQL
    
    return NextResponse.json({
      message: 'Real-time needs to be enabled in Supabase dashboard',
      instructions: [
        '1. Go to your Supabase dashboard',
        '2. Navigate to Database → Replication',
        '3. Enable real-time for these tables:',
        '   - messaging_messages',
        '   - messaging_groups',
        '   - messaging_group_members',
        '4. Or run the SQL script in src/lib/database/enable-realtime-messaging.sql'
      ],
      sqlScript: `
-- Enable real-time for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE messaging_group_members;
      `.trim()
    })
  } catch (error) {
    console.error('Error in enable realtime endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
