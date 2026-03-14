import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { endpoint, keys } = body;
    
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Données d\'abonnement invalides' },
        { status: 400 }
      );
    }
    
    // Check if subscription already exists
    const existing = await db.pushSubscription.findUnique({
      where: { endpoint }
    });
    
    if (existing) {
      // Update existing subscription
      await db.pushSubscription.update({
        where: { endpoint },
        data: {
          userId: user.id,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: request.headers.get('user-agent') || undefined,
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new subscription
      await db.pushSubscription.create({
        data: {
          userId: user.id,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          userAgent: request.headers.get('user-agent') || undefined,
        }
      });
    }
    
    // Enable push notifications in settings
    await db.notificationSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        pushEnabled: true,
      },
      update: {
        pushEnabled: true,
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Abonnement aux notifications push enregistré'
    });
    
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
