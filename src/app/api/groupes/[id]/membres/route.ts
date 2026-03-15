import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NB_MEMBRES_GROUPE } from '@/lib/groupe-helpers';

// GET - Liste des membres du groupe
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

    const membres = await db.membreGroupe.findMany({
      where: { groupeId: id },
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
    });

    return NextResponse.json({ membres });

  } catch (error) {
    console.error('Erreur récupération membres:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des membres' },
      { status: 500 }
    );
  }
}

// POST - Ajouter un membre au groupe
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
    const { userId, estChef = false } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'L\'identifiant du membre est requis' },
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

    // Vérifier que le groupe n'est pas complet
    if (groupe.membres.length >= NB_MEMBRES_GROUPE) {
      return NextResponse.json(
        { error: 'Le groupe est déjà complet' },
        { status: 400 }
      );
    }

    // Vérifier que le groupe n'a pas de cycle en cours
    if (groupe.statut === 'ACTIF') {
      return NextResponse.json(
        { error: 'Impossible d\'ajouter un membre à un groupe actif' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà dans le groupe
    const existingMember = await db.membreGroupe.findUnique({
      where: { groupeId_userId: { groupeId: id, userId } }
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Cet utilisateur est déjà membre du groupe' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'est pas dans un autre groupe actif
    const otherGroup = await db.membreGroupe.findFirst({
      where: { userId, statut: 'ACTIF' },
      include: { groupe: { select: { nom: true } } }
    });

    if (otherGroup) {
      return NextResponse.json(
        { error: `Cet utilisateur est déjà dans le groupe "${otherGroup.groupe.nom}"` },
        { status: 400 }
      );
    }

    // Trouver la prochaine position disponible
    const maxPosition = Math.max(...groupe.membres.map(m => m.position), 0);

    // Ajouter le membre
    const nouveauMembre = await db.membreGroupe.create({
      data: {
        groupeId: id,
        userId,
        position: maxPosition + 1,
        estChef,
        statut: 'ACTIF'
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

    // Mettre à jour le statut du groupe si complet
    if (groupe.membres.length + 1 === NB_MEMBRES_GROUPE) {
      await db.groupe.update({
        where: { id },
        data: { statut: 'COMPLET' }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Membre ajouté avec succès',
      membre: nouveauMembre
    });

  } catch (error) {
    console.error('Erreur ajout membre:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du membre' },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un membre du groupe
export async function DELETE(
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
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'L\'identifiant du membre est requis' },
        { status: 400 }
      );
    }

    // Vérifier que le groupe existe et n'est pas actif
    const groupe = await db.groupe.findUnique({
      where: { id },
      include: { membres: true }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    if (groupe.statut === 'ACTIF') {
      return NextResponse.json(
        { error: 'Impossible de retirer un membre d\'un groupe actif' },
        { status: 400 }
      );
    }

    // Supprimer le membre
    await db.membreGroupe.delete({
      where: { groupeId_userId: { groupeId: id, userId } }
    });

    // Mettre à jour le statut du groupe
    if (groupe.membres.length - 1 < NB_MEMBRES_GROUPE && groupe.statut === 'COMPLET') {
      await db.groupe.update({
        where: { id },
        data: { statut: 'EN_FORMATION' }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Membre retiré avec succès'
    });

  } catch (error) {
    console.error('Erreur retrait membre:', error);
    return NextResponse.json(
      { error: 'Erreur lors du retrait du membre' },
      { status: 500 }
    );
  }
}
