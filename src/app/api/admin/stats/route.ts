import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Get admin statistics
export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }
    
    // Get counts for each status
    const demandesEnAttente = await db.demandePret.count({
      where: { statut: 'EN_ATTENTE' }
    });
    
    const demandesPayeAvance = await db.demandePret.count({
      where: { statut: 'PAYE_AVANCE' }
    });
    
    const demandesValidees = await db.demandePret.count({
      where: { statut: 'VALIDEE' }
    });
    
    const demandesDecaissees = await db.demandePret.count({
      where: { statut: 'DECAISSE' }
    });
    
    const demandesRemboursees = await db.demandePret.count({
      where: { statut: 'REMBOURSE' }
    });
    
    const demandesRejetees = await db.demandePret.count({
      where: { statut: 'REJETEE' }
    });
    
    // Get financial stats
    const totalMontantDemande = await db.demandePret.aggregate({
      _sum: { montant: true },
      where: {
        statut: { in: ['DECAISSE', 'REMBOURSE'] }
      }
    });
    
    const totalAvancesRecuperees = await db.demandePret.aggregate({
      _sum: { avance: true },
      where: {
        statut: { in: ['PAYE_AVANCE', 'VALIDEE', 'DECAISSE', 'REMBOURSE'] }
      }
    });
    
    const totalRembourse = await db.remboursement.aggregate({
      _sum: { montant: true },
      where: { statut: 'PAYE' }
    });
    
    // Get user count
    const totalUsers = await db.user.count({
      where: { role: 'USER' }
    });
    
    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const nouvellesDemandes = await db.demandePret.count({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    });
    
    return NextResponse.json({
      demandes: {
        enAttente: demandesEnAttente,
        payeAvance: demandesPayeAvance,
        validees: demandesValidees,
        decaissees: demandesDecaissees,
        remboursees: demandesRemboursees,
        rejetees: demandesRejetees,
      },
      finances: {
        totalMontantDemande: totalMontantDemande._sum.montant || 0,
        totalAvancesRecuperees: totalAvancesRecuperees._sum.avance || 0,
        totalRembourse: totalRembourse._sum.montant || 0,
      },
      users: {
        total: totalUsers,
      },
      activite: {
        nouvellesDemandes,
      }
    });
    
  } catch (error) {
    console.error('Get admin stats error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
