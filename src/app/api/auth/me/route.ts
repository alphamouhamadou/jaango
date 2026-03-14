import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        prenom: user.prenom,
        nom: user.nom,
        telephone: user.telephone,
        adresse: user.adresse,
        numeroCNI: user.numeroCNI,
        dateNaissance: user.dateNaissance,
        role: user.role,
        statut: user.statut,
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
