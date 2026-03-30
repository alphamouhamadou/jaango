import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { NIVEAUX_PRET, type NiveauPret } from '@/lib/groupe-helpers';

const NIVEAUX_ORDERED: NiveauPret[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMANT'];

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: {
        membreGroupes: {
          include: {
            groupe: {
              include: {
                cycles: {
                  orderBy: { dateDebut: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    let niveauActuel: NiveauPret | null = null;
    let aCycleEnCours = false;
    let cyclesCompletes = 0;
    const raisonIneligibilite: string[] = [];

    if (user.membreGroupes.length > 0) {
      const groupe = user.membreGroupes[0].groupe;
      if (groupe.cycles.length > 0) {
        const cycle = groupe.cycles[0];
        if (cycle.statut === 'EN_COURS') {
          aCycleEnCours = true;
          niveauActuel = cycle.niveau as NiveauPret;
          raisonIneligibilite.push('Vous avez un cycle de prêt en cours.');
        } else if (cycle.statut === 'TERMINE') {
          niveauActuel = cycle.niveau as NiveauPret;
          cyclesCompletes = groupe.cycles.filter(c => c.statut === 'TERMINE').length;
        }
      }
    }

    let prochainNiveau: NiveauPret | null = null;
    let peutPostuler = false;

    if (!niveauActuel) {
      prochainNiveau = 'BRONZE';
      peutPostuler = true;
    } else if (!aCycleEnCours) {
      const idx = NIVEAUX_ORDERED.indexOf(niveauActuel);
      if (idx < NIVEAUX_ORDERED.length - 1) {
        prochainNiveau = NIVEAUX_ORDERED[idx + 1];
        peutPostuler = true;
      } else {
        raisonIneligibilite.push('Vous avez atteint le niveau maximum (Diamant).');
      }
    }

    return NextResponse.json({
      niveauActuel,
      peutPostuler,
      prochainNiveau,
      raisonIneligibilite,
      aCycleEnCours,
      cyclesCompletes
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}