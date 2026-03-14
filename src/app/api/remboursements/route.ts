import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

// GET - List all remboursements for current user
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const remboursements = await db.remboursement.findMany({
      where: { userId: session.id },
      include: {
        demandePret: {
          include: {
            membres: true,
          }
        }
      },
      orderBy: { dateEcheance: 'asc' },
    });
    
    return NextResponse.json({ remboursements });
    
  } catch (error) {
    console.error('Get remboursements error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
