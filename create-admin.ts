import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

const SECRET_KEY = process.env.JWT_SECRET || 'jaango-secret-key-2024';

async function hashPassword(password: string): Promise<string> {
  const data = Buffer.from(password + SECRET_KEY);
  const hashBuffer = crypto.createHash('sha256').update(data).digest();
  return hashBuffer.toString('hex');
}

async function main() {
  const adminTelephone = '776211339';
  const adminPassword = 'Admin123!';
  const hashedPassword = await hashPassword(adminPassword);

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      console.log('✅ Un compte admin existe déjà!');
      console.log('Téléphone:', existingAdmin.telephone);
      console.log('Mot de passe: Admin123!');
      
      // Update password
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword, role: 'ADMIN', statut: 'ACTIF' }
      });
      console.log('Mot de passe réinitialisé!');
      return;
    }

    // Create new admin
    const admin = await prisma.user.create({
      data: {
        prenom: 'Admin',
        nom: 'Jaango',
        telephone: adminTelephone,
        adresse: 'Dakar, Sénégal',
        numeroCNI: 'ADMIN-001-JAANGO',
        dateNaissance: new Date('1990-01-01'),
        password: hashedPassword,
        role: 'ADMIN',
        statut: 'ACTIF'
      }
    });

    console.log('✅ Compte admin créé avec succès!');
    console.log('-----------------------------------');
    console.log('Téléphone:', admin.telephone);
    console.log('Mot de passe:', adminPassword);
    console.log('-----------------------------------');
    console.log('Connectez-vous sur: https://jaango.vercel.app/connexion');
    
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();