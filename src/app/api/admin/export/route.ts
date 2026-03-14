import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Export data as CSV
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
    const type = searchParams.get('type') || 'demandes';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    
    const whereClause = (startDate || endDate) ? { createdAt: dateFilter } : {};
    
    let csvContent = '';
    let filename = '';
    
    switch (type) {
      case 'demandes':
        csvContent = await exportDemandes(whereClause);
        filename = `demandes_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'transactions':
        csvContent = await exportTransactions(whereClause);
        filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'utilisateurs':
        csvContent = await exportUtilisateurs();
        filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      case 'remboursements':
        csvContent = await exportRemboursements(whereClause);
        filename = `remboursements_${new Date().toISOString().split('T')[0]}.csv`;
        break;
      default:
        return NextResponse.json({ error: 'Type non supporté' }, { status: 400 });
    }
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'export' },
      { status: 500 }
    );
  }
}

async function exportDemandes(whereClause: any) {
  const demandes = await db.demandePret.findMany({
    where: whereClause,
    include: {
      user: { select: { prenom: true, nom: true, telephone: true, adresse: true } },
      membres: true,
      remboursements: true,
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const headers = [
    'ID', 'Date', 'Demandeur', 'Téléphone', 'Adresse',
    'Type Prêt', 'Montant', 'Avance', 'Statut',
    'Nb Membres', 'Nb Remboursements', 'Total Remboursé',
    'Date Décaissement'
  ];
  
  const rows = demandes.map(d => [
    d.id,
    new Date(d.createdAt).toLocaleDateString('fr-FR'),
    `${d.user.prenom} ${d.user.nom}`,
    d.user.telephone,
    d.user.adresse,
    d.typePret,
    d.montant.toString(),
    d.avance.toString(),
    d.statut,
    d.membres.length.toString(),
    d.remboursements.length.toString(),
    d.remboursements
      .filter(r => r.statut === 'PAYE')
      .reduce((sum, r) => sum + r.montant, 0)
      .toString(),
    d.dateDecaissement ? new Date(d.dateDecaissement).toLocaleDateString('fr-FR') : ''
  ]);
  
  return [headers, ...rows].map(row => row.join(';')).join('\n');
}

async function exportTransactions(whereClause: any) {
  const transactions = await db.transaction.findMany({
    where: whereClause,
    include: {
      user: { select: { prenom: true, nom: true, telephone: true } },
      demandePret: { select: { id: true, montant: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const headers = [
    'ID', 'Date', 'Utilisateur', 'Téléphone',
    'Type', 'Montant', 'Frais', 'Provider',
    'Référence', 'Statut', 'ID Demande', 'Message'
  ];
  
  const rows = transactions.map(t => [
    t.id,
    new Date(t.createdAt).toLocaleDateString('fr-FR'),
    `${t.user.prenom} ${t.user.nom}`,
    t.user.telephone,
    t.type,
    t.montant.toString(),
    t.frais.toString(),
    t.provider,
    t.reference,
    t.statut,
    t.demandePretId || '',
    t.message || ''
  ]);
  
  return [headers, ...rows].map(row => row.join(';')).join('\n');
}

async function exportUtilisateurs() {
  const users = await db.user.findMany({
    where: { role: 'USER' },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      adresse: true,
      numeroCNI: true,
      statut: true,
      createdAt: true,
      _count: { select: { demandes: true, remboursements: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const headers = [
    'ID', 'Date Inscription', 'Prénom', 'Nom',
    'Téléphone', 'Adresse', 'Numéro CNI', 'Statut',
    'Nb Demandes', 'Nb Remboursements'
  ];
  
  const rows = users.map(u => [
    u.id,
    new Date(u.createdAt).toLocaleDateString('fr-FR'),
    u.prenom,
    u.nom,
    u.telephone,
    u.adresse,
    u.numeroCNI,
    u.statut,
    u._count.demandes.toString(),
    u._count.remboursements.toString()
  ]);
  
  return [headers, ...rows].map(row => row.join(';')).join('\n');
}

async function exportRemboursements(whereClause: any) {
  const remboursements = await db.remboursement.findMany({
    where: whereClause,
    include: {
      user: { select: { prenom: true, nom: true, telephone: true } },
      demandePret: { select: { id: true, montant: true, typePret: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  const headers = [
    'ID', 'Date Création', 'Utilisateur', 'Téléphone',
    'Montant', 'Date Échéance', 'Date Paiement',
    'Statut', 'ID Demande', 'Type Prêt', 'Montant Prêt'
  ];
  
  const rows = remboursements.map(r => [
    r.id,
    new Date(r.createdAt).toLocaleDateString('fr-FR'),
    `${r.user.prenom} ${r.user.nom}`,
    r.user.telephone,
    r.montant.toString(),
    new Date(r.dateEcheance).toLocaleDateString('fr-FR'),
    r.datePaiement ? new Date(r.datePaiement).toLocaleDateString('fr-FR') : '',
    r.statut,
    r.demandePretId,
    r.demandePret.typePret,
    r.demandePret.montant.toString()
  ]);
  
  return [headers, ...rows].map(row => row.join(';')).join('\n');
}
