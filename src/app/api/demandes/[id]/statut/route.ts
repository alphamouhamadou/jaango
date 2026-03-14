import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateRepaymentSchedule } from '@/lib/helpers';

export async function PUT(
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
    const body = await request.json();
    const { statut, paymentReference } = body;
    
    const demande = await db.demandePret.findFirst({
      where: {
        id,
        userId: session.id,
      }
    });
    
    if (!demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }
    
    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'EN_ATTENTE': ['PAYE_AVANCE', 'REJETEE'],
      'PAYE_AVANCE': ['VALIDEE', 'REJETEE'],
      'VALIDEE': ['DECAISSE', 'REJETEE'],
      'DECAISSE': ['REMBOURSE'],
    };
    
    if (!validTransitions[demande.statut]?.includes(statut)) {
      return NextResponse.json(
        { error: 'Transition de statut invalide' },
        { status: 400 }
      );
    }
    
    // Update status
    const updatedDemande = await db.demandePret.update({
      where: { id },
      data: {
        statut,
        ...(statut === 'DECAISSE' && {
          dateDecaissement: new Date(),
        }),
      }
    });
    
    // If status is DECAISSE, create repayment schedule
    if (statut === 'DECAISSE') {
      const repaymentSchedule = generateRepaymentSchedule(
        id,
        session.id,
        demande.montant,
        new Date()
      );
      
      await db.remboursement.createMany({
        data: repaymentSchedule
      });
    }
    
    return NextResponse.json({ demande: updatedDemande });
    
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// Simulate PayTech payment
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
    
    const demande = await db.demandePret.findFirst({
      where: {
        id,
        userId: session.id,
        statut: 'EN_ATTENTE',
      }
    });
    
    if (!demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée ou déjà payée' },
        { status: 404 }
      );
    }
    
    // Simulate PayTech payment processing
    // In production, this would call PayTech API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update status to PAYE_AVANCE
    const updatedDemande = await db.demandePret.update({
      where: { id },
      data: {
        statut: 'PAYE_AVANCE',
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Paiement effectué avec succès',
      demande: updatedDemande,
      paymentReference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    });
    
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors du paiement' },
      { status: 500 }
    );
  }
}
