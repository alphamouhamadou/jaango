import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NB_MEMBRES_GROUPE } from '@/lib/groupe-helpers';

// GET - Liste des groupes
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut');
    const niveau = searchParams.get('niveau');

    const where: Record<string, unknown> = {};
    if (statut) where.statut = statut;
    if (niveau) where.niveauActuel = niveau;

    // Si l'utilisateur n'est pas admin, il ne voit que ses groupes
    if (session.role !== 'ADMIN') {
      where.membres = {
        some: { userId: session.id }
      };
    }

    const groupes = await db.groupe.findMany({
      where,
      include: {
        membres: {
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
        },
        cycles: {
          where: { statut: 'EN_COURS' },
          take: 1,
        },
        _count: {
          select: { membres: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ groupes });

  } catch (error) {
    console.error('Erreur récupération groupes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des groupes' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau groupe
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { nom, description, membres } = body;

    // Validation
    if (!nom || nom.trim().length < 3) {
      return NextResponse.json(
        { error: 'Le nom du groupe doit contenir au moins 3 caractères' },
        { status: 400 }
      );
    }

    if (!membres || !Array.isArray(membres)) {
      return NextResponse.json(
        { error: 'La liste des membres est requise' },
        { status: 400 }
      );
    }

    // Vérifier le nombre de membres
    if (membres.length > NB_MEMBRES_GROUPE) {
      return NextResponse.json(
        { error: `Un groupe ne peut pas avoir plus de ${NB_MEMBRES_GROUPE} membres` },
        { status: 400 }
      );
    }

    // Vérifier que les membres existent
    const usersExist = await db.user.findMany({
      where: { id: { in: membres } }
    });

    if (usersExist.length !== membres.length) {
      return NextResponse.json(
        { error: 'Certains membres n\'existent pas' },
        { status: 400 }
      );
    }

    // Vérifier que les membres ne sont pas déjà dans un groupe actif
    const membresDansGroupes = await db.membreGroupe.findMany({
      where: {
        userId: { in: membres },
        statut: 'ACTIF'
      },
      include: {
        groupe: { select: { nom: true } }
      }
    });

    if (membresDansGroupes.length > 0) {
      const noms = membresDansGroupes.map(m => m.groupe.nom).join(', ');
      return NextResponse.json(
        { error: `Certains membres sont déjà dans un groupe actif: ${noms}` },
        { status: 400 }
      );
    }

    // Créer le groupe
    const groupe = await db.groupe.create({
      data: {
        nom: nom.trim(),
        description: description?.trim() || null,
        statut: membres.length === NB_MEMBRES_GROUPE ? 'COMPLET' : 'EN_FORMATION',
        membres: {
          create: membres.map((userId: string, index: number) => ({
            userId,
            position: index + 1,
            estChef: index === 0, // Le premier membre est le chef
            statut: 'ACTIF'
          }))
        }
      },
      include: {
        membres: {
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
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Groupe créé avec succès',
      groupe
    });

  } catch (error) {
    console.error('Erreur création groupe:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du groupe' },
      { status: 500 }
    );
  }
}
