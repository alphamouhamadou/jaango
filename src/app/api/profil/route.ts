import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, hashPassword, verifyPassword } from '@/lib/auth';
import { z } from 'zod';

const updateProfileSchema = z.object({
  prenom: z.string().min(2).optional(),
  nom: z.string().min(2).optional(),
  adresse: z.string().min(5).optional(),
  telephone: z.string().regex(/^(\+221|0)?[0-9]{9}$/).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);
    
    // If changing password, verify current password
    if (validatedData.newPassword) {
      if (!validatedData.currentPassword) {
        return NextResponse.json(
          { error: 'Le mot de passe actuel est requis pour changer le mot de passe' },
          { status: 400 }
        );
      }
      
      const isValid = await verifyPassword(validatedData.currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Le mot de passe actuel est incorrect' },
          { status: 400 }
        );
      }
    }
    
    // Check if telephone is already used by another user
    if (validatedData.telephone && validatedData.telephone !== user.telephone) {
      const existingUser = await db.user.findUnique({
        where: { telephone: validatedData.telephone }
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 400 }
        );
      }
    }
    
    // Update user
    const updateData: Record<string, unknown> = {};
    
    if (validatedData.prenom) updateData.prenom = validatedData.prenom;
    if (validatedData.nom) updateData.nom = validatedData.nom;
    if (validatedData.adresse) updateData.adresse = validatedData.adresse;
    if (validatedData.telephone) updateData.telephone = validatedData.telephone;
    if (validatedData.newPassword) {
      updateData.password = await hashPassword(validatedData.newPassword);
    }
    
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
    });
    
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        telephone: updatedUser.telephone,
        adresse: updatedUser.adresse,
        numeroCNI: updatedUser.numeroCNI,
        dateNaissance: updatedUser.dateNaissance,
        role: updatedUser.role,
        statut: updatedUser.statut,
      }
    });
    
  } catch (error: unknown) {
    console.error('Update profile error:', error);
    
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { error: 'Données invalides', details: (error as { issues: unknown[] }).issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la mise à jour' },
      { status: 500 }
    );
  }
}
