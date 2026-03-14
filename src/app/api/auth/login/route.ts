import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validations';
import { verifyPassword, signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Find user by telephone
    const user = await db.user.findUnique({
      where: { telephone: validatedData.telephone }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Numéro de téléphone ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(validatedData.password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Numéro de téléphone ou mot de passe incorrect' },
        { status: 401 }
      );
    }
    
    // Check if user is suspended
    if (user.statut === 'SUSPENDU') {
      return NextResponse.json(
        { error: 'Votre compte a été suspendu. Veuillez contacter l\'administrateur.' },
        { status: 403 }
      );
    }
    
    // Create session token
    const token = await signToken({
      id: user.id,
      prenom: user.prenom,
      nom: user.nom,
      telephone: user.telephone,
      role: user.role,
    });
    
    // Set cookie
    await setSessionCookie(token);
    
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
    
  } catch (error: unknown) {
    console.error('Login error:', error);
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la connexion' },
      { status: 500 }
    );
  }
}
