import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateContractPDF, generateReceiptPDF, generateAdvanceReceiptPDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
    
    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }
    
    // Get demande with all details
    const demande = await db.demandePret.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            prenom: true,
            nom: true,
            telephone: true,
            adresse: true,
            numeroCNI: true,
          },
        },
        membres: true,
        remboursements: {
          orderBy: { dateEcheance: 'asc' },
        },
      },
    });
    
    if (!demande) {
      return NextResponse.json({ error: 'Demande non trouvee' }, { status: 404 });
    }
    
    // Check authorization
    if (demande.userId !== decoded.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'contract';
    const remboursementIndex = searchParams.get('remboursement');
    
    let pdf;
    
    if (type === 'receipt' && remboursementIndex !== null) {
      const index = parseInt(remboursementIndex);
      const remboursement = demande.remboursements[index];
      
      if (!remboursement || remboursement.statut !== 'PAYE') {
        return NextResponse.json({ error: 'Remboursement non trouve ou non paye' }, { status: 400 });
      }
      
      pdf = generateReceiptPDF(
        {
          ...demande,
          createdAt: demande.createdAt.toISOString(),
          dateDecaissement: demande.dateDecaissement?.toISOString() || null,
          remboursements: demande.remboursements.map(r => ({
            ...r,
            dateEcheance: r.dateEcheance.toISOString(),
            datePaiement: r.datePaiement?.toISOString() || null,
          })),
        },
        {
          ...remboursement,
          dateEcheance: remboursement.dateEcheance.toISOString(),
          datePaiement: remboursement.datePaiement?.toISOString() || null,
        },
        index
      );
    } else if (type === 'advance') {
      pdf = generateAdvanceReceiptPDF({
        ...demande,
        createdAt: demande.createdAt.toISOString(),
        dateDecaissement: demande.dateDecaissement?.toISOString() || null,
        remboursements: demande.remboursements.map(r => ({
          ...r,
          dateEcheance: r.dateEcheance.toISOString(),
          datePaiement: r.datePaiement?.toISOString() || null,
        })),
      });
    } else {
      pdf = generateContractPDF({
        ...demande,
        createdAt: demande.createdAt.toISOString(),
        dateDecaissement: demande.dateDecaissement?.toISOString() || null,
        remboursements: demande.remboursements.map(r => ({
          ...r,
          dateEcheance: r.dateEcheance.toISOString(),
          datePaiement: r.datePaiement?.toISOString() || null,
        })),
      });
    }
    
    // Convert to buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
    
    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="jaango-${type}-${demande.id.slice(-8)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Erreur lors de la generation du PDF' }, { status: 500 });
  }
}
