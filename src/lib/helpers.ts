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
) {
  const mensualite = 100000;
  const nombreMensualites = Math.ceil(montant / mensualite);
  const schedule = [];
  
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
