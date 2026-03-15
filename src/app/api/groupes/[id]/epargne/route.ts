import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { EPARGNE_MENSUELLE_MEMBRE, EPARGNE_MENSUELLE_GROUPE } from '@/lib/groupe-helpers';

// GET - Liste des épargnes du groupe
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
    const { searchParams } = new URL(request.url);
    const annee = searchParams.get('annee');
    const mois = searchParams.get('mois');

    const where: Record<string, unknown> = { groupeId: id };
    if (annee) where.annee = parseInt(annee);
    if (mois) where.mois = parseInt(mois);

    const epargnes = await db.epargneMensuelle.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            telephone: true,
          }
        }
      },
      orderBy: [
        { annee: 'desc' },
        { mois: 'desc' }
      ]
    });

    // Calculer les totaux
    const totalVerse = epargnes
      .filter(e => e.statut === 'VERSE')
      .reduce((sum, e) => sum + e.montantVerse, 0);

    const totalAttendu = epargnes.reduce((sum, e) => sum + e.montantAttendu, 0);

    return NextResponse.json({
      epargnes,
      stats: {
        totalVerse,
        totalAttendu,
        montantMembre: EPARGNE_MENSUELLE_MEMBRE,
        montantGroupe: EPARGNE_MENSUELLE_GROUPE
      }
    });

  } catch (error) {
    console.error('Erreur récupération épargnes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des épargnes' },
      { status: 500 }
    );
  }
}

// POST - Enregistrer une épargne mensuelle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé - Admin requis' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { mois, annee, creerPourTous = true, userId } = body;

    if (!mois || !annee) {
      return NextResponse.json(
        { error: 'Le mois et l\'année sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que le groupe existe
    const groupe = await db.groupe.findUnique({
      where: { id },
      include: { membres: true }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    let epargnesCreees = [];

    if (creerPourTous) {
      // Créer les épargnes pour tous les membres
      for (const membre of groupe.membres) {
        // Vérifier si l'épargne existe déjà
        const existing = await db.epargneMensuelle.findUnique({
          where: {
            groupeId_userId_mois_annee: {
              groupeId: id,
              userId: membre.userId,
              mois,
              annee
            }
          }
        });

        if (!existing) {
          const epargne = await db.epargneMensuelle.create({
            data: {
              groupeId: id,
              userId: membre.userId,
              mois,
              annee,
              montantAttendu: EPARGNE_MENSUELLE_MEMBRE,
              montantVerse: 0,
              statut: 'EN_ATTENTE'
            }
          });
          epargnesCreees.push(epargne);
        }
      }
    } else if (userId) {
      // Créer l'épargne pour un membre spécifique
      const existing = await db.epargneMensuelle.findUnique({
        where: {
          groupeId_userId_mois_annee: {
            groupeId: id,
            userId,
            mois,
            annee
          }
        }
      });

      if (!existing) {
        const epargne = await db.epargneMensuelle.create({
          data: {
            groupeId: id,
            userId,
            mois,
            annee,
            montantAttendu: EPARGNE_MENSUELLE_MEMBRE,
            montantVerse: 0,
            statut: 'EN_ATTENTE'
          }
        });
        epargnesCreees.push(epargne);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${epargnesCreees.length} épargne(s) créée(s)`,
      epargnes: epargnesCreees
    });

  } catch (error) {
    console.error('Erreur création épargne:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création de l\'épargne' },
      { status: 500 }
    );
  }
}

// PUT - Marquer une épargne comme versée
export async function PUT(
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
    const { epargneId, montantVerse, transactionId } = body;

    if (!epargneId) {
      return NextResponse.json(
        { error: 'L\'identifiant de l\'épargne est requis' },
        { status: 400 }
      );
    }

    const epargne = await db.epargneMensuelle.findUnique({
      where: { id: epargneId }
    });

    if (!epargne || epargne.groupeId !== id) {
      return NextResponse.json({ error: 'Épargne non trouvée' }, { status: 404 });
    }

    const updatedEpargne = await db.epargneMensuelle.update({
      where: { id: epargneId },
      data: {
        montantVerse: montantVerse || epargne.montantAttendu,
        statut: 'VERSE',
        datePaiement: new Date(),
        transactionId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Épargne enregistrée avec succès',
      epargne: updatedEpargne
    });

  } catch (error) {
    console.error('Erreur mise à jour épargne:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'épargne' },
      { status: 500 }
    );
  }
}
