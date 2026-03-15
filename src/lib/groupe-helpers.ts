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
