import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

// GET - Create admin account (for easy browser access)
export async function GET() {
  return createAdmin();
}

// POST - Create admin account (only if no admin exists)
export async function POST() {
  return createAdmin();
}

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (existingAdmin) {
      return NextResponse.json(
        { 
          success: true,
          message: 'Un compte admin existe déjà', 
          adminPhone: existingAdmin.telephone,
          password: 'Admin123!'
        },
        { status: 200 }
      );
    }
    
    // Create admin account with the specified phone number
    const hashedPassword = await hashPassword('Admin123!');
    
    const admin = await db.user.create({
      data: {
        prenom: 'Admin',
        nom: 'Jaango',
        telephone: '776211339',
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
      message: '✅ Compte admin créé avec succès !',
      admin: {
        telephone: admin.telephone,
        password: 'Admin123!',
      },
      loginUrl: 'https://jaango.vercel.app/connexion'
    });
    
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création du compte admin' },
      { status: 500 }
    );
  }
}
