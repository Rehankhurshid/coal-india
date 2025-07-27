import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    // Check if push_subscriptions table exists
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('count')
      .limit(1)

    if (error) {
      // If table doesn't exist, we'll get an error
      return NextResponse.json({
        exists: false,
        error: error.message
      })
    }

    return NextResponse.json({
      exists: true,
      message: 'Push subscriptions table is ready'
    })
  } catch (error) {
    console.error('Error checking database:', error)
    return NextResponse.json(
      { error: 'Failed to check database' },
      { status: 500 }
    )
  }
}
