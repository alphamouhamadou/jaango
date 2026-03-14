import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(
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
    
    const remboursement = await db.remboursement.findFirst({
      where: {
        id,
        userId: session.id,
      },
      include: {
        demandePret: true,
      }
    });
    
    if (!remboursement) {
      return NextResponse.json(
        { error: 'Remboursement non trouvé' },
        { status: 404 }
      );
    }
    
    if (remboursement.statut === 'PAYE') {
      return NextResponse.json(
        { error: 'Ce remboursement a déjà été payé' },
        { status: 400 }
      );
    }
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Update remboursement status
    const updatedRemboursement = await db.remboursement.update({
      where: { id },
      data: {
        statut: 'PAYE',
        datePaiement: new Date(),
      }
    });
    
    // Check if all remboursements for this demande are paid
    const allRemboursements = await db.remboursement.findMany({
      where: { demandePretId: remboursement.demandePretId }
    });
    
    const allPaid = allRemboursements.every(r => r.statut === 'PAYE');
    
    if (allPaid) {
      // Update demande status to REMBOURSE
      await db.demandePret.update({
        where: { id: remboursement.demandePretId },
        data: { statut: 'REMBOURSE' }
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Paiement effectué avec succès',
      remboursement: updatedRemboursement,
      allPaid
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du paiement' },
      { status: 500 }
    );
  }
}
