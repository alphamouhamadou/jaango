import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST - Mark all notifications as read
export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    await db.notification.updateMany({
      where: {
        userId: user.id,
        lu: false,
      },
      data: {
        lu: true,
      }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Mark all notifications error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
