import webpush from 'web-push';

// Configure web-push with VAPID details
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@coalindia.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: any;
}

export class WebPushService {
  static async sendNotification(
    subscription: {
      endpoint: string;
      p256dh: string;
      auth: string;
    },
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );
      
      return true;
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      
      // Handle expired subscriptions
      if (error.statusCode === 410) {
        // Subscription has expired or is no longer valid
        return false;
      }
      
      throw error;
    }
  }

  static async sendToMultiple(
    subscriptions: Array<{
      endpoint: string;
      p256dh: string;
      auth: string;
    }>,
    payload: PushNotificationPayload
  ): Promise<{ successful: number; failed: number }> {
    let successful = 0;
    let failed = 0;

    // Send notifications in parallel with error handling
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendNotification(sub, payload))
    );

    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        successful++;
      } else {
        failed++;
      }
    });

    return { successful, failed };
  }
}
