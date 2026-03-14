import { db } from '@/lib/db';
import webpush from 'web-push';

// VAPID configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@jaango.sn';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

/**
 * Send push notification to all subscriptions for a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  try {
    const subscriptions = await db.pushSubscription.findMany({
      where: { userId }
    });
    
    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }
    
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              }
            },
            JSON.stringify(payload)
          );
          return true;
        } catch (error: unknown) {
          // Remove invalid subscriptions
          if (error && typeof error === 'object' && 'statusCode' in error) {
            const webPushError = error as { statusCode: number };
            if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
              await db.pushSubscription.delete({
                where: { id: sub.id }
              }).catch(() => {});
            }
          }
          return false;
        }
      })
    );
    
    const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
    const failed = results.length - sent;
    
    return { sent, failed };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { sent: 0, failed: 1 };
  }
}
