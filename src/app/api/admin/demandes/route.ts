import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - List all demandes (admin only)
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    const demandes = await db.demandePret.findMany({
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            telephone: true,
            adresse: true,
          }
        },
        membres: true,
        remboursements: {
          where: {
            statut: 'EN_ATTENTE'
          },
          orderBy: { dateEcheance: 'asc' },
          take: 1,
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ demandes });
    
  } catch (error) {
    console.error('Get admin demandes error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
