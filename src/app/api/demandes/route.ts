import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { demandePretSchema } from '@/lib/validations';
import { generateRepaymentSchedule } from '@/lib/helpers';
import { notifyDemandeCreee } from '@/lib/notifications';

// GET - List all demandes for current user
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const demandes = await db.demandePret.findMany({
      where: { userId: session.id },
      include: {
        membres: true,
        remboursements: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({ demandes });
    
  } catch (error) {
    console.error('Get demandes error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

// POST - Create a new demande
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = demandePretSchema.parse(body);
    
    // Validate loan type conditions
    if (validatedData.typePret === 'SILVER') {
      if (validatedData.montant < 500000 || validatedData.montant > 1000000) {
        return NextResponse.json(
          { error: 'Le montant pour un prêt Silver doit être entre 500 000 et 1 000 000 FCFA' },
          { status: 400 }
        );
      }
    } else if (validatedData.typePret === 'GOLD') {
      // Check if user has completed a SILVER loan
      const completedSilver = await db.demandePret.findFirst({
        where: {
          userId: session.id,
          typePret: 'SILVER',
          statut: 'REMBOURSE',
        }
      });
      
      if (!completedSilver) {
        return NextResponse.json(
          { error: 'Vous devez avoir remboursé un prêt Silver pour accéder au prêt Gold' },
          { status: 400 }
        );
      }
      
      if (validatedData.montant < 1000001 || validatedData.montant > 3000000) {
        return NextResponse.json(
          { error: 'Le montant pour un prêt Gold doit être entre 1 000 001 et 3 000 000 FCFA' },
          { status: 400 }
        );
      }
    }
    
    const avance = validatedData.montant * 0.1;
    
    // Create demande with membres
    const demande = await db.demandePret.create({
      data: {
        userId: session.id,
        typePret: validatedData.typePret,
        montant: validatedData.montant,
        avance: avance,
        statut: 'EN_ATTENTE',
        membres: {
          create: validatedData.membres.map(membre => ({
            prenom: membre.prenom,
            nom: membre.nom,
            dateNaissance: new Date(membre.dateNaissance),
            numeroCNI: membre.numeroCNI,
            telephone: membre.telephone,
            adresse: membre.adresse,
          }))
        }
      },
      include: {
        membres: true,
      }
    });
    
    // Send notification to user
    await notifyDemandeCreee(session.id, validatedData.montant, demande.id);
    
    return NextResponse.json({ demande });
    
  } catch (error: unknown) {
    console.error('Create demande error:', error);
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de la demande' },
      { status: 500 }
    );
  }
}
