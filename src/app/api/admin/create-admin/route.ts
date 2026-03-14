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
    console.log('Starting createAdmin...');
    
    // Check if admin already exists
    const existingAdmin = await db.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    console.log('Existing admin check:', existingAdmin);
    
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
    console.log('Hashing password...');
    const hashedPassword = await hashPassword('Admin123!');
    console.log('Password hashed:', hashedPassword ? 'OK' : 'FAILED');
    
    console.log('Creating admin in database...');
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
    
    console.log('Admin created:', admin.id);
    
    return NextResponse.json({
      success: true,
      message: '✅ Compte admin créé avec succès !',
      admin: {
        telephone: admin.telephone,
        password: 'Admin123!',
      },
      loginUrl: 'https://jaango.vercel.app/connexion'
    });
    
  } catch (error: unknown) {
    console.error('Create admin error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la création du compte admin.',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}