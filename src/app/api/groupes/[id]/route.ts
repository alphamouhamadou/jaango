import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NB_MEMBRES_GROUPE } from '@/lib/groupe-helpers';

// GET - Détails d'un groupe
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
      include: {
        membres: {
          include: {
            user: {
              select: {
                id: true,
                prenom: true,
                nom: true,
                telephone: true,
                adresse: true,
              }
            }
          },
          orderBy: { position: 'asc' }
        },
        cycles: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            paiements: {
              orderBy: { numeroMois: 'asc' }
            }
          }
        },
        epargnes: {
          orderBy: { createdAt: 'desc' },
          take: 12
        }
      }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur est membre du groupe ou admin
    const estMembre = groupe.membres.some(m => m.userId === session.id);
    if (session.role !== 'ADMIN' && !estMembre) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Calculer les statistiques
    const cycleActif = groupe.cycles.find(c => c.statut === 'EN_COURS');
    const totalEpargne = groupe.epargnes
      .filter(e => e.statut === 'VERSE')
      .reduce((sum, e) => sum + e.montantVerse, 0);

    return NextResponse.json({
      groupe,
      stats: {
        nbMembres: groupe.membres.length,
        estComplet: groupe.membres.length === NB_MEMBRES_GROUPE,
        cycleActif,
        totalEpargne,
        peutDemarrerCycle: groupe.statut === 'VALIDEE' && 
                          groupe.cartePayee && 
                          groupe.membres.length === NB_MEMBRES_GROUPE
      }
    });

  } catch (error) {
    console.error('Erreur récupération groupe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du groupe' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un groupe
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
    const { nom, description } = body;

    const groupe = await db.groupe.findUnique({
      where: { id },
      include: { membres: true }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Vérifier les droits (admin ou chef du groupe)
    const chef = groupe.membres.find(m => m.estChef);
    if (session.role !== 'ADMIN' && chef?.userId !== session.id) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const updatedGroupe = await db.groupe.update({
      where: { id },
      data: {
        nom: nom?.trim() || groupe.nom,
        description: description?.trim() || groupe.description
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Groupe modifié avec succès',
      groupe: updatedGroupe
    });

  } catch (error) {
    console.error('Erreur modification groupe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la modification du groupe' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un groupe (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier qu'il n'y a pas de cycle en cours
    const cycleEnCours = await db.cycle.findFirst({
      where: { groupeId: id, statut: 'EN_COURS' }
    });

    if (cycleEnCours) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un groupe avec un cycle en cours' },
        { status: 400 }
      );
    }

    await db.groupe.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Groupe supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression groupe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du groupe' },
      { status: 500 }
    );
  }
}
