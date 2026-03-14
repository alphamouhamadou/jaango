import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Get user transaction history
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Get all user's loan demands
    const demandes = await db.demandePret.findMany({
      where: { userId: user.id },
      include: {
        remboursements: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Build transaction list
    const transactions: any[] = [];
    
    for (const demande of demandes) {
      // Add loan creation transaction
      transactions.push({
        id: `DMD-${demande.id}`,
        type: 'DEMANDE',
        description: `Demande de prêt ${demande.typePret.toLowerCase()} - ${demande.montant.toLocaleString('fr-FN')} FCFA`,
        montant: demande.montant,
        statut: demande.statut,
        date: demande.createdAt,
        demandeId: demande.id,
      });
      
      // Add advance payment if paid
      if (['PAYE_AVANCE', 'VALIDEE', 'DECAISSE', 'REMBOURSE'].includes(demande.statut)) {
        transactions.push({
          id: `AVC-${demande.id}`,
          type: 'AVANCE',
          description: `Paiement avance (10%) - Pret ${demande.typePret.toLowerCase()}`,
          montant: -demande.avance,
          statut: 'PAYE',
          date: demande.updatedAt,
          demandeId: demande.id,
        });
      }
      
      // Add disbursement if done
      if (demande.dateDecaissement) {
        const montantNet = demande.montant - demande.avance;
        transactions.push({
          id: `DEC-${demande.id}`,
          type: 'DECAISSEMENT',
          description: `Decaissement pret ${demande.typePret.toLowerCase()} (net d'avance)`,
          montant: montantNet,
          statut: 'PAYE',
          date: demande.dateDecaissement,
          demandeId: demande.id,
        });
      }
      
      // Add repayments
      for (const remb of demande.remboursements) {
        if (remb.statut === 'PAYE' && remb.datePaiement) {
          transactions.push({
            id: `RMB-${remb.id}`,
            type: 'REMBOURSEMENT',
            description: `Remboursement mensualité - Prêt ${demande.typePret.toLowerCase()}`,
            montant: -remb.montant,
            statut: 'PAYE',
            date: remb.datePaiement,
            demandeId: demande.id,
          });
        }
      }
    }
    
    // Sort by date desc
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Calculate stats
    const stats = {
      totalDemandes: demandes.length,
      totalMontant: demandes.reduce((sum, d) => sum + d.montant, 0),
      totalRembourse: demandes.flatMap(d => d.remboursements)
        .filter(r => r.statut === 'PAYE')
        .reduce((sum, r) => sum + r.montant, 0),
      enCours: demandes.filter(d => d.statut === 'DECAISSE').length,
      soldes: demandes.filter(d => d.statut === 'REMBOURSE').length,
    };
    
    return NextResponse.json({ transactions, stats });
    
  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
