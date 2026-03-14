import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { registerSchema } from '@/lib/validations';
import { hashPassword, signToken, setSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { telephone: validatedData.telephone },
          { numeroCNI: validatedData.numeroCNI }
        ]
      }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec ce numéro de téléphone ou CNI existe déjà' },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create user
    const user = await db.user.create({
      data: {
        prenom: validatedData.prenom,
        nom: validatedData.nom,
        telephone: validatedData.telephone,
        adresse: validatedData.adresse,
        numeroCNI: validatedData.numeroCNI,
        dateNaissance: new Date(validatedData.dateNaissance),
        password: hashedPassword,
      }
    });
    
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
    console.error('Registration error:', error);
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    );
  }
}
