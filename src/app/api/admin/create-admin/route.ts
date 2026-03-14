import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// POST - Create admin account (only if no admin exists)
export async function POST() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Un compte admin existe déjà', adminPhone: existingAdmin.telephone },
        { status: 400 }
      );
    }
    
    // Create admin account
    const hashedPassword = await hashPassword('admin123');
    
    const admin = await db.user.create({
      data: {
        prenom: 'Admin',
        nom: 'Jaango',
        telephone: '771234567',
        adresse: 'Dakar, Sénégal',
        numeroCNI: 'ADMIN-001-JAANGO',
        dateNaissance: new Date('1990-01-01'),
        password: hashedPassword,
        role: 'ADMIN',
        statut: 'ACTIF',
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Compte admin créé avec succès',
      admin: {
        telephone: admin.telephone,
        password: 'admin123',
      }
    });
    
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte admin' },
      { status: 500 }
    );
  }
}
