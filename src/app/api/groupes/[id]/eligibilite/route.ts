import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getNiveauSuivant, DUREE_CYCLE_MOIS } from '@/lib/groupe-helpers';

// GET - Vérifier l'éligibilité du groupe pour un nouveau cycle
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
        membres: true,
        cycles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            paiements: true
          }
        },
        epargnes: {
          where: { statut: 'EN_ATTENTE' }
        }
      }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Vérifications d'éligibilité
    const verification = {
      // Le groupe est complet (10 membres)
      groupeComplet: groupe.membres.length === 10,
      
      // La carte de groupe est payée (pour le premier cycle)
      cartePayee: groupe.cartePayee || groupe.cycles.length > 0,
      
      // Pas de cycle en cours
      pasDeCycleEnCours: !groupe.cycles.some(c => c.statut === 'EN_COURS'),
      
      // Le dernier cycle est entièrement remboursé
      dernierCycleRembourse: true,
      
      // Pas de dette dans le groupe
      pasDeDette: true,
      
      // L'épargne a été respectée
      epargneRespectee: groupe.epargnes.length === 0,
    };

    // Vérifier le dernier cycle s'il existe
    const dernierCycle = groupe.cycles[0];
    if (dernierCycle) {
      // Vérifier que tous les paiements sont effectués
      const paiementsEffectues = dernierCycle.paiements.filter(p => p.statut === 'PAYE');
      verification.dernierCycleRembourse = paiementsEffectues.length === DUREE_CYCLE_MOIS;
      
      // Vérifier qu'il n'y a pas de dette
      const totalAttendu = dernierCycle.totalMensuel * DUREE_CYCLE_MOIS;
      const totalPaye = dernierCycle.montantTotalPaye;
      verification.pasDeDette = totalPaye >= totalAttendu;
    }

    // Éligibilité globale
    const estEligible = 
      verification.groupeComplet &&
      verification.cartePayee &&
      verification.pasDeCycleEnCours &&
      verification.dernierCycleRembourse &&
      verification.pasDeDette &&
      verification.epargneRespectee;

    // Prochain niveau
    const prochainNiveau = dernierCycle 
      ? getNiveauSuivant(dernierCycle.niveau as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMANT')
      : 'BRONZE';

    // Raison si non éligible
    let raisonIneligibilite: string | null = null;
    if (!verification.groupeComplet) {
      raisonIneligibilite = 'Le groupe n\'est pas complet (10 membres requis)';
    } else if (!verification.cartePayee) {
      raisonIneligibilite = 'La carte de groupe n\'a pas été payée';
    } else if (!verification.pasDeCycleEnCours) {
      raisonIneligibilite = 'Un cycle est encore en cours';
    } else if (!verification.dernierCycleRembourse) {
      raisonIneligibilite = 'Le cycle précédent n\'est pas entièrement remboursé';
    } else if (!verification.pasDeDette) {
      raisonIneligibilite = 'Le groupe a une dette en cours';
    } else if (!verification.epargneRespectee) {
      raisonIneligibilite = 'L\'épargne mensuelle n\'a pas été respectée';
    }

    return NextResponse.json({
      estEligible,
      verification,
      prochainNiveau,
      raisonIneligibilite,
      niveauActuel: dernierCycle?.niveau || null,
      numeroProchainCycle: (groupe.cycles.length || 0) + 1
    });

  } catch (error) {
    console.error('Erreur vérification éligibilité:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification de l\'éligibilité' },
      { status: 500 }
    );
  }
}
