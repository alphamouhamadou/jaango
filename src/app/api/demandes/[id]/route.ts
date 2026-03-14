import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateRepaymentSchedule } from '@/lib/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const demande = await db.demandePret.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        user: {
          select: {
            telephone: true,
          },
        },
        membres: true,
        remboursements: {
          orderBy: { dateEcheance: 'asc' }
        },
      }
    });
    
    if (!demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ demande });
    
  } catch (error) {
    console.error('Get demande error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    const demande = await db.demandePret.findFirst({
      where: {
        id,
        userId: session.id,
        statut: 'EN_ATTENTE',
      }
    });
    
    if (!demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée ou ne peut pas être supprimée' },
        { status: 404 }
      );
    }
    
    // Delete associated membres first
    await db.membre.deleteMany({
      where: { demandePretId: id }
    });
    
    // Delete the demande
    await db.demandePret.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Delete demande error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
