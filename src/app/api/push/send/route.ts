import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAuthenticatedUser } from '@/lib/auth/server-auth'
import { WebPushService, PushNotificationPayload } from '@/lib/services/web-push'

// Initialize Supabase client with service role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('[push/send] Received push notification request');
    
    // Check if VAPID keys are configured
    if (!process.env.VAPID_PRIVATE_KEY) {
      console.error('[push/send] VAPID_PRIVATE_KEY is not configured');
      return NextResponse.json(
        { error: 'Push notifications not properly configured (missing private key)' },
        { status: 500 }
      )
    }
    
    // Validate session
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notification data from request
    const body = await request.json()
    const { recipientIds, notification } = body
    console.log('[push/send] Sending to recipients:', recipientIds);

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return NextResponse.json(
        { error: 'Recipient IDs are required' },
        { status: 400 }
      )
    }

    if (!notification || !notification.title || !notification.body) {
      return NextResponse.json(
        { error: 'Notification title and body are required' },
        { status: 400 }
      )
    }

    // Get push subscriptions for recipients
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('employee_id', recipientIds)

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('[push/send] No active push subscriptions found for recipients');
      return NextResponse.json({
        success: true,
        message: 'No active push subscriptions found',
        sent: 0
      })
    }
    
    console.log(`[push/send] Found ${subscriptions.length} subscription(s)`);

    // Prepare notification payload
    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/icon-192x192.png',
      tag: notification.tag || `msg-${Date.now()}`,
      url: notification.url || '/messaging',
      data: notification.data || {}
    }

    // Send notifications
    const result = await WebPushService.sendToMultiple(subscriptions, payload)

    // Clean up expired subscriptions
    if (result.failed > 0) {
      // Note: In production, you'd want to track which specific subscriptions failed
      // and remove only those from the database
      console.log(`${result.failed} notifications failed to send`)
    }

    return NextResponse.json({
      success: true,
      sent: result.successful,
      failed: result.failed,
      total: subscriptions.length
    })
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
