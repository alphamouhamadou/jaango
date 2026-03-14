// Web Push Notification Service
// This module handles push notifications using the Web Push API

import webpush from 'web-push';
import { db } from './db';

// VAPID keys from environment variables
// Generate new keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@jaango.sn';

// Configure web-push only if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  notificationId?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Get the VAPID public key for client-side subscription
 */
export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Save a push subscription for a user
 */
export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionData,
  userAgent?: string
) {
  try {
    // Check if subscription already exists
    const existing = await db.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });
    
    if (existing) {
      // Update existing subscription
      return await db.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
        }
      });
    }
    
    // Create new subscription
    return await db.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      }
    });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return null;
  }
}

/**
 * Remove a push subscription
 */
export async function removePushSubscription(endpoint: string) {
  try {
    await db.pushSubscription.delete({
      where: { endpoint }
    });
    return true;
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return false;
  }
}

/**
 * Get all push subscriptions for a user
 */
export async function getUserPushSubscriptions(userId: string) {
  return await db.pushSubscription.findMany({
    where: { userId }
  });
}

/**
 * Send a push notification to a specific subscription
 */
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushNotificationPayload
) {
  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      }
    };
    
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload)
    );
    
    return true;
  } catch (error: unknown) {
    console.error('Error sending push notification:', error);
    
    // If subscription is invalid, remove it
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const webPushError = error as { statusCode: number };
      if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
        await removePushSubscription(subscription.endpoint);
      }
    }
    
    return false;
  }
}

/**
 * Send push notification to all subscriptions for a user
 */
export async function sendPushNotificationToUser(
  userId: string,
  payload: PushNotificationPayload
) {
  const subscriptions = await getUserPushSubscriptions(userId);
  
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }
  
  const results = await Promise.allSettled(
    subscriptions.map(sub => 
      sendPushNotification(sub, payload)
    )
  );
  
  const sent = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - sent;
  
  return { sent, failed };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  payload: PushNotificationPayload
) {
  const results = await Promise.allSettled(
    userIds.map(userId => sendPushNotificationToUser(userId, payload))
  );
  
  const totalSent = results.reduce((sum, r) => {
    if (r.status === 'fulfilled') {
      return sum + r.value.sent;
    }
    return sum;
  }, 0);
  
  const totalFailed = results.reduce((sum, r) => {
    if (r.status === 'fulfilled') {
      return sum + r.value.failed;
    }
    return sum + 1;
  }, 0);
  
  return { sent: totalSent, failed: totalFailed };
}

/**
 * Check if user has push notifications enabled
 */
export async function hasPushEnabled(userId: string): Promise<boolean> {
  const settings = await db.notificationSettings.findUnique({
    where: { userId }
  });
  
  return settings?.pushEnabled ?? false;
}

/**
 * Update notification settings for a user
 */
export async function updateNotificationSettings(
  userId: string,
  settings: Partial<{
    pushEnabled: boolean;
    echeanceEnabled: boolean;
    validationEnabled: boolean;
    rejetEnabled: boolean;
    decaissementEnabled: boolean;
    remboursementEnabled: boolean;
    paiementEnabled: boolean;
    systemeEnabled: boolean;
  }>
) {
  return await db.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...settings,
    },
    update: {
      ...settings,
      updatedAt: new Date(),
    }
  });
}

/**
 * Get notification settings for a user
 */
export async function getNotificationSettings(userId: string) {
  const settings = await db.notificationSettings.findUnique({
    where: { userId }
  });
  
  // Return default settings if none exist
  return settings || {
    pushEnabled: false,
    echeanceEnabled: true,
    validationEnabled: true,
    rejetEnabled: true,
    decaissementEnabled: true,
    remboursementEnabled: true,
    paiementEnabled: true,
    systemeEnabled: true,
  };
}
