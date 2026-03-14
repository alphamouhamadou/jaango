import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateRepaymentSchedule } from '@/lib/helpers';
import { notifyValidation, notifyRejet, notifyDecaissement } from '@/lib/notifications';

// PUT - Update demande status (validate/reject/disburse)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    const { id } = await params;
    const body = await request.json();
    const { action, motif } = body;
    
    const demande = await db.demandePret.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!demande) {
      return NextResponse.json(
        { error: 'Demande non trouvée' },
        { status: 404 }
      );
    }
    
    let newStatut = demande.statut;
    
    switch (action) {
      case 'validate':
        // Can only validate if status is PAYE_AVANCE
        if (demande.statut !== 'PAYE_AVANCE') {
          return NextResponse.json(
            { error: 'Cette demande ne peut pas être validée' },
            { status: 400 }
          );
        }
        newStatut = 'VALIDEE';
        break;
        
      case 'reject':
        // Can reject if status is EN_ATTENTE, PAYE_AVANCE, or VALIDEE
        if (!['EN_ATTENTE', 'PAYE_AVANCE', 'VALIDEE'].includes(demande.statut)) {
          return NextResponse.json(
            { error: 'Cette demande ne peut pas être rejetée' },
            { status: 400 }
          );
        }
        newStatut = 'REJETEE';
        break;
        
      case 'disburse':
        // Can only disburse if status is VALIDEE
        if (demande.statut !== 'VALIDEE') {
          return NextResponse.json(
            { error: 'Cette demande ne peut pas être décaissée' },
            { status: 400 }
          );
        }
        newStatut = 'DECAISSE';
        break;
        
      default:
        return NextResponse.json(
          { error: 'Action invalide' },
          { status: 400 }
        );
    }
    
    // Update demande status
    const updatedDemande = await db.demandePret.update({
      where: { id },
      data: {
        statut: newStatut,
        ...(newStatut === 'DECAISSE' && {
          dateDecaissement: new Date(),
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            telephone: true,
          }
        }
      }
    });
    
    // Send notification to user
    if (action === 'validate') {
      await notifyValidation(demande.userId, demande.montant, id);
    } else if (action === 'reject') {
      await notifyRejet(demande.userId, demande.montant, motif);
    } else if (action === 'disburse') {
      await notifyDecaissement(demande.userId, demande.montant, id);
    }
    
    // If disburse, create repayment schedule
    if (newStatut === 'DECAISSE') {
      const repaymentSchedule = generateRepaymentSchedule(
        id,
        demande.userId,
        demande.montant,
        new Date()
      );
      
      await db.remboursement.createMany({
        data: repaymentSchedule
      });
    }
    
    return NextResponse.json({ 
      demande: updatedDemande,
      message: getActionMessage(action)
    });
    
  } catch (error) {
    console.error('Admin update demande error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

function getActionMessage(action: string): string {
  switch (action) {
    case 'validate':
      return 'Demande validée avec succès';
    case 'reject':
      return 'Demande rejetée';
    case 'disburse':
      return 'Prêt décaissé avec succès';
    default:
      return 'Action effectuée';
  }
}
