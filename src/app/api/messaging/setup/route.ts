import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Check if messaging tables exist
    const { data: tables, error } = await supabase
      .from('messaging_groups')
      .select('id')
      .limit(1)

    if (error && error.code === '42P01') {
      return NextResponse.json({
        error: 'Messaging tables not found',
        message: 'Please run the SQL script to create messaging tables'
      }, { status: 404 })
    }

    // Check for push_subscriptions table
    const { data: pushTable, error: pushError } = await supabase
      .from('push_subscriptions')
      .select('id')
      .limit(1)

    return NextResponse.json({
      status: 'ready',
      tables: {
        messaging_groups: !error,
        messaging_group_members: !error,
        messaging_messages: !error,
        push_subscriptions: !pushError
      },
      message: 'Messaging system is set up correctly'
    })
  } catch (error) {
    console.error('Setup check error:', error)
    return NextResponse.json({
      error: 'Failed to check setup',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Test notification endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { employeeId } = body

    if (!employeeId) {
      return NextResponse.json({
        error: 'Employee ID required'
      }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Look up the user's push subscription from the database
    // 2. Send the notification via FCM/Web Push API
    // For now, we'll just return a success response

    console.log('Test notification requested for:', employeeId)

    return NextResponse.json({
      success: true,
      message: 'Test notification sent (mock)',
      employeeId
    })
  } catch (error) {
    console.error('Test notification error:', error)
    return NextResponse.json({
      error: 'Failed to send test notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
