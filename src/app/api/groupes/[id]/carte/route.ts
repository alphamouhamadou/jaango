import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MONTANT_CARTE_GROUPE } from '@/lib/groupe-helpers';

// GET - Vérifier le statut de la carte de groupe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const groupe = await db.groupe.findUnique({
      where: { id },
      select: {
        id: true,
        nom: true,
        cartePayee: true,
        carteTransactionId: true
      }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Récupérer la transaction si elle existe
    let transaction = null;
    if (groupe.carteTransactionId) {
      transaction = await db.transactionGroupe.findUnique({
        where: { id: groupe.carteTransactionId }
      });
    }

    return NextResponse.json({
      cartePayee: groupe.cartePayee,
      montant: MONTANT_CARTE_GROUPE,
      transaction
    });

  } catch (error) {
    console.error('Erreur vérification carte:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de la carte' },
      { status: 500 }
    );
  }
}

// POST - Initier le paiement de la carte de groupe
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { telephone, provider } = body;

    // Vérifier que le groupe existe
    const groupe = await db.groupe.findUnique({
      where: { id },
      include: { membres: true }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Vérifier que la carte n'est pas déjà payée
    if (groupe.cartePayee) {
      return NextResponse.json(
        { error: 'La carte de groupe a déjà été payée' },
        { status: 400 }
      );
    }

    // Vérifier que le groupe est validé
    if (groupe.statut !== 'VALIDEE' && groupe.statut !== 'COMPLET') {
      return NextResponse.json(
        { error: 'Le groupe doit être validé avant de payer la carte' },
        { status: 400 }
      );
    }

    // Générer une référence unique
    const reference = `CARTE-${groupe.id.slice(-8)}-${Date.now()}`;

    // Créer la transaction
    const transaction = await db.transactionGroupe.create({
      data: {
        groupeId: id,
        type: 'CARTE_GROUPE',
        montant: MONTANT_CARTE_GROUPE,
        provider: provider || 'PAYTECH',
        reference,
        telephone,
        statut: 'EN_ATTENTE',
        message: 'Paiement carte de groupe'
      }
    });

    // TODO: Intégrer PayTech pour le paiement
    // Pour l'instant, on simule un paiement direct
    if (process.env.NODE_ENV === 'development') {
      // En développement, marquer comme payé automatiquement
      await db.transactionGroupe.update({
        where: { id: transaction.id },
        data: { statut: 'SUCCESS' }
      });

      await db.groupe.update({
        where: { id },
        data: { 
          cartePayee: true,
          carteTransactionId: transaction.id 
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Carte payée avec succès (mode test)',
        transaction: { ...transaction, statut: 'SUCCESS' }
      });
    }

    // En production, retourner les infos pour PayTech
    return NextResponse.json({
      success: true,
      message: 'Transaction initiée',
      transaction,
      paymentUrl: `/payment/process?ref=${reference}` // URL de paiement
    });

  } catch (error) {
    console.error('Erreur paiement carte:', error);
    return NextResponse.json(
      { error: 'Erreur lors du paiement de la carte' },
      { status: 500 }
    );
  }
}

// PUT - Confirmer le paiement (webhook)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { reference, statut, providerReference } = body;

    const transaction = await db.transactionGroupe.findUnique({
      where: { reference }
    });

    if (!transaction || transaction.groupeId !== id) {
      return NextResponse.json({ error: 'Transaction non trouvée' }, { status: 404 });
    }

    // Mettre à jour la transaction
    await db.transactionGroupe.update({
      where: { id: transaction.id },
      data: {
        statut: statut === 'success' ? 'SUCCESS' : 'ECHEC',
        providerReference
      }
    });

    if (statut === 'success') {
      // Marquer la carte comme payée
      await db.groupe.update({
        where: { id },
        data: {
          cartePayee: true,
          carteTransactionId: transaction.id
        }
      });

      // Notifier les membres
      const groupe = await db.groupe.findUnique({
        where: { id },
        include: { membres: true }
      });

      if (groupe) {
        await db.notification.createMany({
          data: groupe.membres.map(membre => ({
            userId: membre.userId,
            type: 'PAIEMENT',
            titre: 'Carte de groupe payée',
            message: `La carte de groupe a été payée. Vous pouvez maintenant démarrer un cycle.`,
            lien: `/groupes/${id}`
          }))
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erreur confirmation paiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la confirmation du paiement' },
      { status: 500 }
    );
  }
}
