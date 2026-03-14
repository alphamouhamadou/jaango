import jsPDF from 'jspdf';
import { formatFCFA, formatDate, getTypePretLabel, getStatutDemandeLabel } from './helpers';

interface DemandeData {
  id: string;
  typePret: string;
  montant: number;
  avance: number;
  statut: string;
  createdAt: string;
  dateDecaissement: string | null;
  user: {
    prenom: string;
    nom: string;
    telephone: string;
    adresse: string;
    numeroCNI: string;
  };
  membres: Array<{
    prenom: string;
    nom: string;
    telephone: string;
    numeroCNI: string;
  }>;
  remboursements: Array<{
    montant: number;
    dateEcheance: string;
    datePaiement: string | null;
    statut: string;
  }>;
}

// Generate loan contract PDF
export function generateContractPDF(demande: DemandeData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(34, 197, 94); // Green color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('JAANGO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Contrat de Pret Communautaire', pageWidth / 2, 32, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let y = 55;
  
  // Contract reference
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reference: ${demande.id}`, 20, y);
  doc.text(`Date: ${formatDate(demande.createdAt)}`, pageWidth - 20, y, { align: 'right' });
  
  y += 15;
  
  // Borrower info section
  doc.setFillColor(243, 244, 246);
  doc.rect(15, y - 5, pageWidth - 30, 35, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMATIONS DE L\'EMPRUNTEUR', 20, y + 5);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 12;
  doc.text(`Nom complet: ${demande.user.prenom} ${demande.user.nom}`, 20, y);
  y += 7;
  doc.text(`Telephone: ${demande.user.telephone}`, 20, y);
  doc.text(`CNI: ${demande.user.numeroCNI}`, pageWidth - 20, y, { align: 'right' });
  y += 7;
  doc.text(`Adresse: ${demande.user.adresse}`, 20, y);
  
  y += 20;
  
  // Loan details section
  doc.setFillColor(243, 244, 246);
  doc.rect(15, y - 5, pageWidth - 30, 45, 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DETAILS DU PRET', 20, y + 5);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y += 12;
  doc.text(`Type de pret: ${getTypePretLabel(demande.typePret)}`, 20, y);
  doc.text(`Statut: ${getStatutDemandeLabel(demande.statut)}`, pageWidth - 20, y, { align: 'right' });
  y += 7;
  doc.text(`Montant demande: ${formatFCFA(demande.montant)}`, 20, y);
  y += 7;
  doc.text(`Avance (10%): ${formatFCFA(demande.avance)}`, 20, y);
  y += 7;
  doc.text(`Montant net decaisse: ${formatFCFA(demande.montant - demande.avance)}`, 20, y);
  
  y += 20;
  
  // Guarantors section
  doc.setFillColor(243, 244, 246);
  doc.rect(15, y - 5, pageWidth - 30, 10 + (demande.membres.length * 8), 'F');
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMBRES GARANTS', 20, y + 5);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  y += 12;
  
  demande.membres.forEach((membre, index) => {
    doc.text(`${index + 1}. ${membre.prenom} ${membre.nom} - Tel: ${membre.telephone} - CNI: ${membre.numeroCNI}`, 20, y);
    y += 7;
  });
  
  y += 15;
  
  // Terms and conditions
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDITIONS GENERALES', 20, y);
  
  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const terms = [
    '1. L\'emprunteur s\'engage a rembourser le pret selon le calendrier etabli.',
    '2. Le montant de la mensualite est fixe a 100 000 FCFA.',
    '3. Tout retard de paiement entraine des penalites.',
    '4. Les membres garants s\'engagent solidairement au remboursement.',
    '5. Le pret est accorde sous reserve de validation par l\'administrateur.',
  ];
  
  terms.forEach(term => {
    const lines = doc.splitTextToSize(term, pageWidth - 40);
    lines.forEach((line: string) => {
      doc.text(line, 20, y);
      y += 5;
    });
  });
  
  y += 15;
  
  // Signatures
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  const signatureY = Math.max(y + 10, 250);
  
  doc.text('Signature de l\'emprunteur', 40, signatureY, { align: 'center' });
  doc.text('Date', pageWidth / 2, signatureY, { align: 'center' });
  doc.text('Cachet Jaango', pageWidth - 40, signatureY, { align: 'center' });
  
  doc.line(20, signatureY + 25, 70, signatureY + 25);
  doc.line(pageWidth / 2 - 25, signatureY + 25, pageWidth / 2 + 25, signatureY + 25);
  doc.line(pageWidth - 70, signatureY + 25, pageWidth - 20, signatureY + 25);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('Jaango - Plateforme de pret communautaire au Senegal', pageWidth / 2, 290, { align: 'center' });
  
  return doc;
}

// Generate payment receipt PDF
export function generateReceiptPDF(demande: DemandeData, remboursement: { montant: number; datePaiement: string | null; dateEcheance: string }, index: number): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(34, 197, 94);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JAANGO', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Recu de Paiement', pageWidth / 2, 27, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  let y = 50;
  
  // Receipt number and date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Recu N: ${demande.id.slice(-8).toUpperCase()}-${String(index + 1).padStart(3, '0')}`, 20, y);
  doc.text(`Date: ${formatDate(remboursement.datePaiement || new Date())}`, pageWidth - 20, y, { align: 'right' });
  
  y += 20;
  
  // Success icon box
  doc.setFillColor(34, 197, 94);
  doc.rect(pageWidth / 2 - 20, y, 40, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('OK', pageWidth / 2, y + 27, { align: 'center' });
  
  // Reset
  doc.setTextColor(0, 0, 0);
  y += 55;
  
  // Amount box
  doc.setFillColor(243, 244, 246);
  doc.rect(15, y - 5, pageWidth - 30, 30, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Montant paye:', 20, y + 5);
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(formatFCFA(remboursement.montant), pageWidth - 20, y + 12, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  y += 40;
  
  // Payment details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    { label: 'Emprunteur', value: `${demande.user.prenom} ${demande.user.nom}` },
    { label: 'Telephone', value: demande.user.telephone },
    { label: 'Type de pret', value: getTypePretLabel(demande.typePret) },
    { label: 'Echeance', value: formatDate(remboursement.dateEcheance) },
    { label: 'Mensualite', value: `${index + 1} / ${demande.remboursements.length}` },
  ];
  
  details.forEach(({ label, value }) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(`${label}:`, 20, y);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(value, 80, y);
    y += 8;
  });
  
  y += 15;
  
  // Payment method
  doc.setFillColor(243, 244, 246);
  doc.rect(15, y - 5, pageWidth - 30, 20, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Mode de paiement: Mobile Money (Orange Money / Wave / Free Money)', 20, y + 8);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Merci pour votre paiement!', pageWidth / 2, 280, { align: 'center' });
  doc.text('Jaango - Plateforme de pret communautaire au Senegal', pageWidth / 2, 287, { align: 'center' });
  
  return doc;
}

// Generate advance payment receipt
export function generateAdvanceReceiptPDF(demande: DemandeData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFillColor(249, 115, 22); // Orange for advance
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JAANGO', pageWidth / 2, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Recu - Paiement d\'Avance', pageWidth / 2, 27, { align: 'center' });
  
  // Reset
  doc.setTextColor(0, 0, 0);
  
  let y = 50;
  
  // Receipt info
  doc.setFontSize(10);
  doc.text(`Reference: ${demande.id}`, 20, y);
  doc.text(`Date: ${formatDate(demande.createdAt)}`, pageWidth - 20, y, { align: 'right' });
  
  y += 20;
  
  // Amount box
  doc.setFillColor(254, 243, 199);
  doc.rect(15, y - 5, pageWidth - 30, 35, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Montant de l\'avance (10%):', 20, y + 5);
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(249, 115, 22);
  doc.text(formatFCFA(demande.avance), pageWidth / 2, y + 23, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  y += 45;
  
  // Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const details = [
    { label: 'Emprunteur', value: `${demande.user.prenom} ${demande.user.nom}` },
    { label: 'Telephone', value: demande.user.telephone },
    { label: 'Type de pret', value: getTypePretLabel(demande.typePret) },
    { label: 'Montant du pret', value: formatFCFA(demande.montant) },
  ];
  
  details.forEach(({ label, value }) => {
    doc.setTextColor(107, 114, 128);
    doc.text(`${label}:`, 20, y);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 80, y);
    doc.setFont('helvetica', 'normal');
    y += 8;
  });
  
  y += 20;
  
  // Note
  doc.setFillColor(254, 243, 199);
  doc.rect(15, y - 5, pageWidth - 30, 25, 'F');
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text('Note: Cette avance represente 10% du montant demande.', 20, y + 5);
  doc.text('Elle est non remboursable et sera deduite du montant decaisse.', 20, y + 12);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Jaango - Plateforme de pret communautaire au Senegal', pageWidth / 2, 287, { align: 'center' });
  
  return doc;
}
