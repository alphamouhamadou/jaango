import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// Check user eligibility for Gold loan
// Conditions: Must have at least one fully repaid Silver loan

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value || request.cookies.get('session')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Get user's loan history
    const userDemandes = await db.demandePret.findMany({
      where: { userId: decoded.id },
      include: {
        remboursements: true,
      },
    });

    // Check for fully repaid Silver loans
    const repaidSilverLoans = userDemandes.filter(
      d => d.typePret === 'SILVER' && d.statut === 'REMBOURSE'
    );

    // Check for active loans (DECAISSE or VALIDEE)
    const activeLoans = userDemandes.filter(
      d => d.statut === 'DECAISSE' || d.statut === 'VALIDEE' || d.statut === 'PAYE_AVANCE'
    );

    // Check for pending loans
    const pendingLoans = userDemandes.filter(
      d => d.statut === 'EN_ATTENTE'
    );

    // Gold eligibility: at least one fully repaid Silver loan and no active loans
    const isGoldEligible = repaidSilverLoans.length > 0 && activeLoans.length === 0;

    // Calculate stats
    const totalLoans = userDemandes.length;
    const repaidLoans = userDemandes.filter(d => d.statut === 'REMBOURSE').length;
    const silverLoansCount = userDemandes.filter(d => d.typePret === 'SILVER').length;

    return NextResponse.json({
      isGoldEligible,
      hasActiveLoan: activeLoans.length > 0,
      hasPendingLoan: pendingLoans.length > 0,
      repaidSilverLoans: repaidSilverLoans.length,
      totalLoans,
      repaidLoans,
      silverLoansCount,
      // Detailed reasons for ineligibility
      ineligibilityReasons: [
        ...(repaidSilverLoans.length === 0 ? ['Vous devez avoir remboursé au moins un prêt Silver'] : []),
        ...(activeLoans.length > 0 ? ['Vous avez déjà un prêt en cours'] : []),
        ...(pendingLoans.length > 0 ? ['Vous avez une demande en attente'] : []),
      ],
    });

  } catch (error) {
    console.error('Eligibility check error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'éligibilité' },
      { status: 500 }
    );
  }
}
