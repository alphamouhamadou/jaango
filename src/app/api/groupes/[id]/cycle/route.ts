import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { 
  calculerMontantsCycle, 
  formatDateCycle,
  NB_MEMBRES_GROUPE,
  DUREE_CYCLE_MOIS 
} from '@/lib/groupe-helpers';

// GET - Liste des cycles du groupe
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

    const cycles = await db.cycle.findMany({
      where: { groupeId: id },
      include: {
        paiements: {
          orderBy: { numeroMois: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ cycles });

  } catch (error) {
    console.error('Erreur récupération cycles:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des cycles' },
      { status: 500 }
    );
  }
}

// POST - Démarrer un nouveau cycle
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
    const { niveau, dateDebut } = body;

    // Vérifier que le groupe existe
    const groupe = await db.groupe.findUnique({
      where: { id },
      include: { 
        membres: true,
        cycles: {
          where: { statut: { in: ['EN_COURS', 'EN_ATTENTE'] } }
        }
      }
    });

    if (!groupe) {
      return NextResponse.json({ error: 'Groupe non trouvé' }, { status: 404 });
    }

    // Vérifications
    if (groupe.membres.length !== NB_MEMBRES_GROUPE) {
      return NextResponse.json(
        { error: `Le groupe doit avoir exactement ${NB_MEMBRES_GROUPE} membres` },
        { status: 400 }
      );
    }

    if (!groupe.cartePayee && groupe.cycles.length === 0) {
      return NextResponse.json(
        { error: 'Le groupe doit payer la carte de groupe avant de démarrer le premier cycle' },
        { status: 400 }
      );
    }

    if (groupe.cycles.length > 0) {
      // Vérifier que le cycle précédent est terminé
      const cyclePrecedent = groupe.cycles[groupe.cycles.length - 1];
      if (cyclePrecedent && cyclePrecedent.statut !== 'TERMINE') {
        return NextResponse.json(
          { error: 'Le cycle précédent doit être terminé avant d\'en démarrer un nouveau' },
          { status: 400 }
        );
      }
    }

    // Vérifier qu'il n'y a pas déjà un cycle en cours
    const cycleEnCours = groupe.cycles.find(c => c.statut === 'EN_COURS');
    if (cycleEnCours) {
      return NextResponse.json(
        { error: 'Un cycle est déjà en cours pour ce groupe' },
        { status: 400 }
      );
    }

    // Calculer les montants
    const montants = calculerMontantsCycle(niveau);
    const startDate = dateDebut ? new Date(dateDebut) : new Date();
    const endDate = formatDateCycle(startDate);

    // Déterminer le numéro du cycle
    const numeroCycle = groupe.cycles.length + 1;

    // Créer le cycle avec les paiements mensuels
    const cycle = await db.cycle.create({
      data: {
        groupeId: id,
        niveau,
        numeroCycle,
        montantPret: montants.montantPret,
        dateDebut: startDate,
        dateFin: endDate,
        statut: 'EN_COURS',
        remboursementMensuel: montants.remboursementMensuel,
        epargneMensuelle: montants.epargneMensuelle,
        totalMensuel: montants.totalMensuel,
        validePar: session.id,
        dateValidation: new Date(),
        paiements: {
          create: Array.from({ length: DUREE_CYCLE_MOIS }, (_, i) => {
            const echeance = new Date(startDate);
            echeance.setMonth(echeance.getMonth() + i);
            return {
              numeroMois: i + 1,
              dateEcheance: echeance,
              montantRemboursement: montants.remboursementMensuel,
              montantEpargne: montants.epargneMensuelle,
              montantTotal: montants.totalMensuel,
              statut: 'EN_ATTENTE'
            };
          })
        }
      },
      include: {
        paiements: true
      }
    });

    // Mettre à jour le niveau du groupe
    await db.groupe.update({
      where: { id },
      data: { 
        statut: 'ACTIF',
        niveauActuel: niveau 
      }
    });

    // Créer les notifications pour les membres
    await db.notification.createMany({
      data: groupe.membres.map(membre => ({
        userId: membre.userId,
        type: 'CYCLE',
        titre: 'Nouveau cycle démarré',
        message: `Le cycle ${numeroCycle} (${niveau}) a été démarré. Mensualité: ${montants.totalMensuel.toLocaleString('fr-SN')} FCFA`,
        lien: `/groupes/${id}`
      }))
    });

    return NextResponse.json({
      success: true,
      message: 'Cycle démarré avec succès',
      cycle
    });

  } catch (error) {
    console.error('Erreur démarrage cycle:', error);
    return NextResponse.json(
      { error: 'Erreur lors du démarrage du cycle' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour un cycle (terminer, annuler)
export async function PUT(
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
    const { cycleId, action } = body;

    if (!cycleId || !action) {
      return NextResponse.json(
        { error: 'CycleId et action sont requis' },
        { status: 400 }
      );
    }

    const cycle = await db.cycle.findUnique({
      where: { id: cycleId },
      include: { groupe: true }
    });

    if (!cycle || cycle.groupeId !== id) {
      return NextResponse.json({ error: 'Cycle non trouvé' }, { status: 404 });
    }

    if (action === 'terminer') {
      // Marquer le cycle comme terminé
      const updatedCycle = await db.cycle.update({
        where: { id: cycleId },
        data: { statut: 'TERMINE' }
      });

      // Mettre à jour le groupe
      await db.groupe.update({
        where: { id },
        data: { statut: 'VALIDEE' }
      });

      return NextResponse.json({
        success: true,
        message: 'Cycle terminé avec succès',
        cycle: updatedCycle
      });

    } else if (action === 'annuler') {
      const updatedCycle = await db.cycle.update({
        where: { id: cycleId },
        data: { statut: 'ANNULE' }
      });

      await db.groupe.update({
        where: { id },
        data: { statut: 'SUSPENDU' }
      });

      return NextResponse.json({
        success: true,
        message: 'Cycle annulé',
        cycle: updatedCycle
      });
    }

    return NextResponse.json(
      { error: 'Action non reconnue' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erreur mise à jour cycle:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du cycle' },
      { status: 500 }
    );
  }
}
