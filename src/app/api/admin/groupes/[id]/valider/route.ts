import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NB_MEMBRES_GROUPE } from '@/lib/groupe-helpers';

// POST - Valider un groupe (admin uniquement)
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

    // Vérifier que le groupe existe
    const groupe = await db.groupe.findUnique({
      where: { id },
      include: { membres: true }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Vérifier que le groupe est complet
    if (groupe.membres.length !== NB_MEMBRES_GROUPE) {
      return NextResponse.json(
        { error: `Le groupe doit avoir exactement ${NB_MEMBRES_GROUPE} membres` },
        { status: 400 }
      );
    }

    // Vérifier que le groupe a le bon statut
    if (groupe.statut !== 'COMPLET' && groupe.statut !== 'EN_FORMATION') {
      return NextResponse.json(
        { error: 'Le groupe ne peut pas être validé dans son état actuel' },
        { status: 400 }
      );
    }

    // Valider le groupe
    const updatedGroupe = await db.groupe.update({
      where: { id },
      data: {
        statut: 'VALIDEE',
        dateValidation: new Date(),
        validePar: session.id
      }
    });

    // Créer les notifications pour les membres
    await db.notification.createMany({
      data: groupe.membres.map(membre => ({
        userId: membre.userId,
        type: 'GROUPE',
        titre: 'Groupe validé',
        message: `Votre groupe "${groupe.nom}" a été validé. Vous pouvez maintenant payer la carte de groupe pour démarrer votre premier cycle.`,
        lien: `/groupes/${id}`
      }))
    });

    return NextResponse.json({
      success: true,
      message: 'Groupe validé avec succès',
      groupe: updatedGroupe
    });

  } catch (error) {
    console.error('Erreur validation groupe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la validation du groupe' },
      { status: 500 }
    );
  }
}
