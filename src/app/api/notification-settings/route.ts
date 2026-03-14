import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Get notification settings
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    let settings = await db.notificationSettings.findUnique({
      where: { userId: user.id }
    });
    
    // Return default settings if none exist
    if (!settings) {
      settings = {
        id: 'default',
        userId: user.id,
        pushEnabled: false,
        echeanceEnabled: true,
        validationEnabled: true,
        rejetEnabled: true,
        decaissementEnabled: true,
        remboursementEnabled: true,
        paiementEnabled: true,
        systemeEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    // Get push subscription count
    const pushSubscriptionCount = await db.pushSubscription.count({
      where: { userId: user.id }
    });
    
    return NextResponse.json({
      settings,
      hasPushSubscription: pushSubscriptionCount > 0,
      pushSubscriptionCount,
    });
    
  } catch (error) {
    console.error('Get notification settings error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// PUT - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const {
      pushEnabled,
      echeanceEnabled,
      validationEnabled,
      rejetEnabled,
      decaissementEnabled,
      remboursementEnabled,
      paiementEnabled,
      systemeEnabled,
    } = body;
    
    const settings = await db.notificationSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        pushEnabled: pushEnabled ?? false,
        echeanceEnabled: echeanceEnabled ?? true,
        validationEnabled: validationEnabled ?? true,
        rejetEnabled: rejetEnabled ?? true,
        decaissementEnabled: decaissementEnabled ?? true,
        remboursementEnabled: remboursementEnabled ?? true,
        paiementEnabled: paiementEnabled ?? true,
        systemeEnabled: systemeEnabled ?? true,
      },
      update: {
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(echeanceEnabled !== undefined && { echeanceEnabled }),
        ...(validationEnabled !== undefined && { validationEnabled }),
        ...(rejetEnabled !== undefined && { rejetEnabled }),
        ...(decaissementEnabled !== undefined && { decaissementEnabled }),
        ...(remboursementEnabled !== undefined && { remboursementEnabled }),
        ...(paiementEnabled !== undefined && { paiementEnabled }),
        ...(systemeEnabled !== undefined && { systemeEnabled }),
        updatedAt: new Date(),
      }
    });
    
    return NextResponse.json({
      success: true,
      settings,
    });
    
  } catch (error) {
    console.error('Update notification settings error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
