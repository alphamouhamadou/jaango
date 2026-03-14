import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { 
  createPayTechPayment, 
  generateCommandRef,
  getPayTechConfigStatus
} from '@/lib/paytech-service';

// Process a payment (advance or monthly repayment)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, // 'AVANCE' or 'REMBOURSEMENT'
      demandeId,
      remboursementId,
    } = body;

    // Validate required fields
    if (!type || !demandeId) {
      return NextResponse.json({ 
        error: 'Données manquantes: type et demandeId sont requis' 
      }, { status: 400 });
    }

    // Get demande
    const demande = await db.demandePret.findUnique({
      where: { id: demandeId },
      include: {
        user: true,
        remboursements: {
          where: remboursementId ? { id: remboursementId } : undefined,
        },
      },
    });

    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Verify ownership
    if (demande.userId !== decoded.userId) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    let amount: number;
    let item_name: string;
    let command_name: string;

    if (type === 'AVANCE') {
      // Check if already paid
      if (demande.statut !== 'EN_ATTENTE') {
        return NextResponse.json({ 
          error: 'L\'avance a déjà été payée ou la demande n\'est pas dans le bon état' 
        }, { status: 400 });
      }
      amount = demande.avance;
      item_name = `Avance 10% - ${demande.typePret}`;
      command_name = `Paiement avance pour demande de prêt ${demande.typePret}`;
    } else if (type === 'REMBOURSEMENT') {
      if (!remboursementId) {
        return NextResponse.json({ error: 'remboursementId requis pour le remboursement' }, { status: 400 });
      }

      const remboursement = demande.remboursements[0];
      if (!remboursement) {
        return NextResponse.json({ error: 'Remboursement non trouvé' }, { status: 404 });
      }

      if (remboursement.statut === 'PAYE') {
        return NextResponse.json({ error: 'Ce remboursement a déjà été payé' }, { status: 400 });
      }

      amount = remboursement.montant;
      item_name = `Mensualité prêt ${demande.typePret}`;
      command_name = `Remboursement mensualité - Prêt ${demande.typePret}`;
    } else {
      return NextResponse.json({ error: 'Type de paiement invalide' }, { status: 400 });
    }

    // Generate unique command reference
    const ref_command = generateCommandRef(type === 'AVANCE' ? 'AV' : 'RMB');

    // Create PayTech payment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const paymentResult = await createPayTechPayment({
      item_name,
      item_price: amount,
      ref_command,
      command_name,
      currency: 'XOF',
      env: (process.env.PAYTECH_ENV || 'test') as 'test' | 'prod',
      success_url: `${baseUrl}/payment/success?ref=${ref_command}`,
      error_url: `${baseUrl}/payment/error?ref=${ref_command}`,
      callback_url: `${baseUrl}/api/payment/webhook`,
      customer_email: demande.user.telephone,
      customer_phone: demande.user.telephone,
      customer_name: `${demande.user.prenom} ${demande.user.nom}`,
    });

    // If payment creation failed
    if (!paymentResult.success) {
      return NextResponse.json({
        success: false,
        error: paymentResult.error || 'Erreur lors de la création du paiement',
      }, { status: 400 });
    }

    // Create pending transaction in database
    await db.transaction.create({
      data: {
        id: paymentResult.token || ref_command,
        reference: ref_command,
        provider: 'PAYTECH',
        type: type as 'AVANCE' | 'REMBOURSEMENT',
        montant: amount,
        frais: 0,
        telephone: demande.user.telephone,
        statut: 'EN_ATTENTE',
        userId: decoded.userId,
        demandePretId: demandeId,
        remboursementId: remboursementId || null,
        providerReference: paymentResult.token,
        message: 'Paiement initié via PayTech',
      },
    });

    // Return payment URL for redirect
    return NextResponse.json({
      success: true,
      transaction: {
        id: paymentResult.token,
        reference: ref_command,
        montant: amount,
        frais: 0,
        total: amount,
        provider: 'PAYTECH',
        statut: 'PENDING',
        message: paymentResult.message,
        redirect_url: paymentResult.redirect_url,
        timestamp: new Date(),
      },
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      error: 'Erreur lors du traitement du paiement' 
    }, { status: 500 });
  }
}

// Get transaction history
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const transactions = await db.transaction.findMany({
      where: { userId: decoded.userId },
      include: {
        demandePret: {
          select: {
            typePret: true,
            montant: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await db.transaction.count({
      where: { userId: decoded.userId },
    });

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Transaction fetch error:', error);
    return NextResponse.json({ 
      error: 'Erreur lors de la récupération des transactions' 
    }, { status: 500 });
  }
}
