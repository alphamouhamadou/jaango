// Constantes du système JAANGO - Groupes solidaires

// Niveaux de prêt et leurs montants
export const NIVEAUX_PRET = {
  BRONZE: {
    nom: 'Bronze',
    montant: 1_000_000,
    remboursementMensuel: 100_000,  // montant / 10 mois
    couleur: '#CD7F32',
    ordre: 1,
  },
  SILVER: {
    nom: 'Silver',
    montant: 1_500_000,
    remboursementMensuel: 150_000,
    couleur: '#C0C0C0',
    ordre: 2,
  },
  GOLD: {
    nom: 'Gold',
    montant: 2_000_000,
    remboursementMensuel: 200_000,
    couleur: '#FFD700',
    ordre: 3,
  },
  PLATINUM: {
    nom: 'Platinum',
    montant: 2_500_000,
    remboursementMensuel: 250_000,
    couleur: '#E5E4E2',
    ordre: 4,
  },
  DIAMANT: {
    nom: 'Diamant',
    montant: 3_000_000,
    remboursementMensuel: 300_000,
    couleur: '#B9F2FF',
    ordre: 5,
  },
} as const;

// Épargne mensuelle fixe pour le groupe
export const EPARGNE_MENSUELLE_GROUPE = 50_000;

// Épargne mensuelle par membre
export const EPARGNE_MENSUELLE_MEMBRE = 5_000;

// Nombre de membres par groupe
export const NB_MEMBRES_GROUPE = 10;

// Durée du cycle en mois
export const DUREE_CYCLE_MOIS = 10;

// Montant de la carte de groupe
export const MONTANT_CARTE_GROUPE = 100_000;

// Montant individuel par membre pour chaque niveau
export const MONTANT_INDIVIDUEL = {
  BRONZE: 100_000,    // 1_000_000 / 10
  SILVER: 150_000,    // 1_500_000 / 10
  GOLD: 200_000,      // 2_000_000 / 10
  PLATINUM: 250_000,  // 2_500_000 / 10
  DIAMANT: 300_000,   // 3_000_000 / 10
} as const;

// Contribution mensuelle totale par membre (remboursement + épargne)
export const CONTRIBUTION_MENSUELLE_MEMBRE = {
  BRONZE: 15_000,    // 10_000 + 5_000
  SILVER: 20_000,    // 15_000 + 5_000
  GOLD: 25_000,      // 20_000 + 5_000
  PLATINUM: 30_000,  // 25_000 + 5_000
  DIAMANT: 35_000,   // 30_000 + 5_000
} as const;

// Contribution mensuelle totale pour le groupe
export const CONTRIBUTION_MENSUELLE_GROUPE = {
  BRONZE: 150_000,    // 100_000 + 50_000
  SILVER: 200_000,    // 150_000 + 50_000
  GOLD: 250_000,      // 200_000 + 50_000
  PLATINUM: 300_000,  // 250_000 + 50_000
  DIAMANT: 350_000,   // 300_000 + 50_000
} as const;

// Types
export type NiveauPret = keyof typeof NIVEAUX_PRET;

// Niveaux ordonnés pour l'affichage
export const NIVEAUX_PRET_ORDERED: NiveauPret[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMANT'];

// Interface pour le calendrier de remboursement
interface ScheduleItem {
  demandePretId: string;
  userId: string;
  montant: number;
  dateEcheance: Date;
}

// Fonctions utilitaires
export function getNiveauInfo(niveau: NiveauPret) {
  return NIVEAUX_PRET[niveau];
}

export function getNiveauSuivant(niveau: NiveauPret): NiveauPret | null {
  const ordre = NIVEAUX_PRET[niveau].ordre;
  const niveaux = Object.entries(NIVEAUX_PRET).find(([, v]) => v.ordre === ordre + 1);
  return niveaux ? (niveaux[0] as NiveauPret) : null;
}

export function calculerMontantsCycle(niveau: NiveauPret) {
  const info = NIVEAUX_PRET[niveau];
  return {
    montantPret: info.montant,
    remboursementMensuel: info.remboursementMensuel,
    epargneMensuelle: EPARGNE_MENSUELLE_GROUPE,
    totalMensuel: info.remboursementMensuel + EPARGNE_MENSUELLE_GROUPE,
    montantIndividuel: MONTANT_INDIVIDUEL[niveau],
    contributionMembre: CONTRIBUTION_MENSUELLE_MEMBRE[niveau],
  };
}

export function formatDateCycle(dateDebut: Date): Date {
  const dateFin = new Date(dateDebut);
  dateFin.setMonth(dateFin.getMonth() + DUREE_CYCLE_MOIS);
  return dateFin;
}

// Formater les montants en FCFA
export function formatMoney(montant: number): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

// Formater en FCFA simple
export function formatCFA(montant: number): string {
  return `${montant.toLocaleString('fr-SN')} FCFA`;
}

// Format amount in FCFA
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date in French format
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-SN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

// Format date short
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-SN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

// Calculate loan details
export function calculateLoanDetails(montant: number) {
  const avance = montant * 0.1; // 10% advance
  const montantNet = montant - avance;
  const mensualite = 100000; // Fixed monthly payment
  const dureeMois = Math.ceil(montant / mensualite);
  
  return {
    montant,
    avance,
    montantNet,
    mensualite,
    dureeMois,
  };
}

// Generate repayment schedule
export function generateRepaymentSchedule(
  demandePretId: string,
  userId: string,
  montant: number,
  startDate: Date = new Date()
): ScheduleItem[] {
  const mensualite = 100000;
  const nombreMensualites = Math.ceil(montant / mensualite);
  const schedule: ScheduleItem[] = [];
  
  for (let i = 0; i < nombreMensualites; i++) {
    const dateEcheance = new Date(startDate);
    dateEcheance.setMonth(dateEcheance.getMonth() + i + 1);
    dateEcheance.setDate(5); // Due on the 5th of each month
    
    const montantRestant = montant - (i * mensualite);
    const montantMensualite = Math.min(mensualite, montantRestant);
    
    schedule.push({
      demandePretId,
      userId,
      montant: montantMensualite,
      dateEcheance,
    });
  }
  
  return schedule;
}

// Get loan type label
export function getTypePretLabel(type: string): string {
  switch (type) {
    case 'SILVER':
      return 'Prêt Silver';
    case 'GOLD':
      return 'Prêt Gold';
    case 'BRONZE':
      return 'Prêt Bronze';
    case 'PLATINUM':
      return 'Prêt Platinum';
    case 'DIAMANT':
      return 'Prêt Diamant';
    default:
      return type;
  }
}

// Get status label
export function getStatutDemandeLabel(statut: string): string {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'En attente';
    case 'PAYE_AVANCE':
      return 'Avance payée';
    case 'VALIDEE':
      return 'Validée';
    case 'DECAISSE':
      return 'Décaissé';
    case 'REMBOURSE':
      return 'Remboursé';
    case 'REJETEE':
      return 'Rejetée';
    default:
      return statut;
  }
}

// Get repayment status label
export function getStatutRembLabel(statut: string): string {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'En attente';
    case 'PAYE':
      return 'Payé';
    case 'RETARD':
      return 'En retard';
    default:
      return statut;
  }
}

// Get status color class
export function getStatutDemandeColor(statut: string): string {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAYE_AVANCE':
      return 'bg-blue-100 text-blue-800';
    case 'VALIDEE':
      return 'bg-green-100 text-green-800';
    case 'DECAISSE':
      return 'bg-purple-100 text-purple-800';
    case 'REMBOURSE':
      return 'bg-green-100 text-green-800';
    case 'REJETEE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Get repayment status color
export function getStatutRembColor(statut: string): string {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'bg-yellow-100 text-yellow-800';
    case 'PAYE':
      return 'bg-green-100 text-green-800';
    case 'RETARD':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}