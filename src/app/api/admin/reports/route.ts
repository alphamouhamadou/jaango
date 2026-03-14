import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Get detailed reports data with date filters
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    
    const whereClause = (startDate || endDate) ? { createdAt: dateFilter } : {};
    
    // Get all demandes with details
    const demandes = await db.demandePret.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            telephone: true,
            adresse: true,
          }
        },
        membres: true,
        remboursements: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get all transactions
    const transactions = await db.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            prenom: true,
            nom: true,
            telephone: true,
          }
        },
        demandePret: {
          select: {
            id: true,
            montant: true,
            typePret: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get all users
    const users = await db.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        prenom: true,
        nom: true,
        telephone: true,
        adresse: true,
        createdAt: true,
        statut: true,
        _count: {
          select: {
            demandes: true,
            remboursements: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Calculate comprehensive statistics
    const stats = {
      // Demandes par statut
      demandesParStatut: {
        enAttente: demandes.filter(d => d.statut === 'EN_ATTENTE').length,
        payeAvance: demandes.filter(d => d.statut === 'PAYE_AVANCE').length,
        validees: demandes.filter(d => d.statut === 'VALIDEE').length,
        decaissees: demandes.filter(d => d.statut === 'DECAISSE').length,
        remboursees: demandes.filter(d => d.statut === 'REMBOURSE').length,
        rejetees: demandes.filter(d => d.statut === 'REJETEE').length,
      },
      
      // Demandes par type
      demandesParType: {
        silver: demandes.filter(d => d.typePret === 'SILVER').length,
        gold: demandes.filter(d => d.typePret === 'GOLD').length,
      },
      
      // Montants
      montants: {
        totalDemande: demandes.reduce((sum, d) => sum + d.montant, 0),
        totalAvance: demandes.reduce((sum, d) => sum + d.avance, 0),
        totalDecaisse: demandes
          .filter(d => d.statut === 'DECAISSE' || d.statut === 'REMBOURSE')
          .reduce((sum, d) => sum + d.montant, 0),
        totalRembourse: transactions
          .filter(t => t.type === 'REMBOURSEMENT' && t.statut === 'SUCCESS')
          .reduce((sum, t) => sum + t.montant, 0),
      },
      
      // Remboursements
      remboursements: {
        total: demandes.reduce((sum, d) => sum + d.remboursements.length, 0),
        payes: demandes.reduce((sum, d) => 
          sum + d.remboursements.filter(r => r.statut === 'PAYE').length, 0),
        enAttente: demandes.reduce((sum, d) => 
          sum + d.remboursements.filter(r => r.statut === 'EN_ATTENTE').length, 0),
        enRetard: demandes.reduce((sum, d) => 
          sum + d.remboursements.filter(r => r.statut === 'RETARD').length, 0),
      },
      
      // Transactions
      transactions: {
        total: transactions.length,
        success: transactions.filter(t => t.statut === 'SUCCESS').length,
        echec: transactions.filter(t => t.statut === 'ECHEC').length,
        enAttente: transactions.filter(t => t.statut === 'EN_ATTENTE').length,
        totalMontant: transactions
          .filter(t => t.statut === 'SUCCESS')
          .reduce((sum, t) => sum + t.montant, 0),
      },
      
      // Utilisateurs
      utilisateurs: {
        total: users.length,
        actifs: users.filter(u => u.statut === 'ACTIF').length,
        suspendus: users.filter(u => u.statut === 'SUSPENDU').length,
        avecPret: users.filter(u => u._count.demandes > 0).length,
      },
      
      // KPIs avancés
      kpis: {
        tauxRecouvrement: 0,
        montantMoyenPret: 0,
        delaiMoyenRemboursement: 0,
        tauxAcceptation: 0,
      }
    };
    
    // Calculate KPIs
    const demandesTraitees = stats.demandesParStatut.decaissees + 
                             stats.demandesParStatut.remboursees + 
                             stats.demandesParStatut.rejetees;
    
    if (demandesTraitees > 0) {
      stats.kpis.tauxAcceptation = Math.round(
        ((stats.demandesParStatut.decaissees + stats.demandesParStatut.remboursees) / demandesTraitees) * 100
      );
    }
    
    if (stats.demandesParStatut.decaissees + stats.demandesParStatut.remboursees > 0) {
      stats.kpis.montantMoyenPret = Math.round(
        stats.montants.totalDecaisse / (stats.demandesParStatut.decaissees + stats.demandesParStatut.remboursees)
      );
    }
    
    if (stats.montants.totalDecaisse > 0) {
      stats.kpis.tauxRecouvrement = Math.round(
        (stats.montants.totalRembourse / stats.montants.totalDecaisse) * 100
      );
    }
    
    // Monthly data for charts
    const monthlyData = getMonthlyData(demandes);
    const dailyTransactions = getDailyTransactions(transactions);
    
    return NextResponse.json({
      stats,
      demandes: demandes.slice(0, 100), // Limit for performance
      transactions: transactions.slice(0, 100),
      users: users.slice(0, 100),
      monthlyData,
      dailyTransactions,
    });
    
  } catch (error) {
    console.error('Get admin reports error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

function getMonthlyData(demandes: any[]) {
  const monthMap: Record<string, { mois: string; demandes: number; montant: number; rembourse: number }> = {};
  
  demandes.forEach(d => {
    const date = new Date(d.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    
    if (!monthMap[key]) {
      monthMap[key] = { mois: monthName, demandes: 0, montant: 0, rembourse: 0 };
    }
    monthMap[key].demandes += 1;
    monthMap[key].montant += d.montant;
    
    // Add remboursements
    const rembourseTotal = d.remboursements
      .filter((r: any) => r.statut === 'PAYE')
      .reduce((sum: number, r: any) => sum + r.montant, 0);
    monthMap[key].rembourse += rembourseTotal;
  });
  
  return Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, data]) => data);
}

function getDailyTransactions(transactions: any[]) {
  const dayMap: Record<string, { date: string; count: number; montant: number }> = {};
  
  transactions
    .filter(t => t.statut === 'SUCCESS')
    .forEach(t => {
      const date = new Date(t.createdAt);
      const key = date.toISOString().split('T')[0];
      
      if (!dayMap[key]) {
        dayMap[key] = { date: key, count: 0, montant: 0 };
      }
      dayMap[key].count += 1;
      dayMap[key].montant += t.montant;
    });
  
  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([, data]) => data);
}
