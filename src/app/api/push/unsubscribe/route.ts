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
    const { endpoint } = body;
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint requis' },
        { status: 400 }
      );
    }
    
    // Delete the subscription
    await db.pushSubscription.deleteMany({
      where: {
        endpoint,
        userId: user.id,
      }
    });
    
    // Check if user has any remaining subscriptions
    const remainingSubs = await db.pushSubscription.count({
      where: { userId: user.id }
    });
    
    // If no more subscriptions, disable push in settings
    if (remainingSubs === 0) {
      await db.notificationSettings.updateMany({
        where: { userId: user.id },
        data: {
          pushEnabled: false,
          updatedAt: new Date(),
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Désabonnement effectué'
    });
    
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
