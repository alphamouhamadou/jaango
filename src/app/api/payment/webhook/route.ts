import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validatePayTechIPN, type PayTechIPNData } from '@/lib/paytech-service';

// PayTech IPN Webhook Handler
// This endpoint receives payment notifications from PayTech

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract IPN data
    const ipnData: PayTechIPNData = {
      ref_command: body.ref_command || body.refCommand,
      token: body.token,
      amount: parseFloat(body.amount) || 0,
      currency: body.currency || 'XOF',
      status: body.status || body.payment_status,
      payment_method: body.payment_method || body.paymentMethod,
      payment_date: body.payment_date || body.paymentDate,
      client_phone: body.client_phone || body.clientPhone,
    };

    // Validate IPN data
    if (!validatePayTechIPN(ipnData)) {
      console.error('Invalid PayTech IPN data:', body);
      return NextResponse.json({ 
        error: 'Invalid IPN data' 
      }, { status: 400 });
    }

    console.log('PayTech IPN received:', ipnData);

    // Find the transaction by reference
    const transaction = await db.transaction.findFirst({
      where: { reference: ipnData.ref_command },
      include: {
        demandePret: true,
        remboursement: true,
        user: true,
      },
    });

    if (!transaction) {
      console.error('Transaction not found for reference:', ipnData.ref_command);
      return NextResponse.json({ 
        error: 'Transaction not found' 
      }, { status: 404 });
    }

    // Update transaction status
    const newStatus = ipnData.status === 'success' ? 'SUCCESS' : 
                      ipnData.status === 'failed' ? 'ECHEC' : 
                      ipnData.status === 'cancelled' ? 'ANNULE' : 'EN_ATTENTE';

    await db.transaction.update({
      where: { id: transaction.id },
      data: {
        statut: newStatus,
        providerReference: ipnData.token,
        message: `Paiement ${ipnData.status} via ${ipnData.payment_method || 'PayTech'}`,
        updatedAt: new Date(),
      },
    });

    // If payment successful, update related records
    if (ipnData.status === 'success' && transaction.statut === 'EN_ATTENTE') {
      
      if (transaction.type === 'AVANCE') {
        // Update demande status
        await db.demandePret.update({
          where: { id: transaction.demandePretId! },
          data: { statut: 'PAYE_AVANCE' },
        });

        // Create notification
        await db.notification.create({
          data: {
            userId: transaction.userId,
            type: 'PAIEMENT',
            titre: 'Avance payée',
            message: `Votre avance de ${transaction.montant} FCFA a été payée avec succès. Votre demande est en cours de validation.`,
            lien: `/pret/${transaction.demandePretId}`,
          },
        });

      } else if (transaction.type === 'REMBOURSEMENT' && transaction.remboursementId) {
        // Update remboursement status
        await db.remboursement.update({
          where: { id: transaction.remboursementId },
          data: {
            statut: 'PAYE',
            datePaiement: new Date(),
          },
        });

        // Check if all repayments are done
        const allRemboursements = await db.remboursement.findMany({
          where: { demandePretId: transaction.demandePretId! },
        });
        const allPaid = allRemboursements.every(r => r.statut === 'PAYE');

        if (allPaid) {
          await db.demandePret.update({
            where: { id: transaction.demandePretId! },
            data: { statut: 'REMBOURSE' },
          });
        }

        // Create notification
        await db.notification.create({
          data: {
            userId: transaction.userId,
            type: 'PAIEMENT',
            titre: 'Mensualité payée',
            message: `Votre paiement de ${transaction.montant} FCFA a été effectué avec succès.`,
            lien: `/pret/${transaction.demandePretId}`,
          },
        });
      }
    }

    // Return success response to PayTech
    return NextResponse.json({ 
      status: 'success',
      message: 'IPN processed successfully' 
    });

  } catch (error) {
    console.error('PayTech webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// GET endpoint for PayTech callback (redirect)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const ref = searchParams.get('ref');
  const status = searchParams.get('status');
  const token = searchParams.get('token');

  // This is called when user is redirected from PayTech
  // Redirect to appropriate page based on status
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  
  if (status === 'success') {
    // Redirect to success page
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=success&ref=${ref}`);
  } else {
    // Redirect to error page
    return NextResponse.redirect(`${baseUrl}/dashboard?payment=error&ref=${ref}`);
  }
}
