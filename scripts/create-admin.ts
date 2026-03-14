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
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { telephone: adminTelephone }
    });

    if (existingUser) {
      console.log('Compte existant trouvé, mise à jour en ADMIN...');
      
      const updated = await prisma.user.update({
        where: { telephone: adminTelephone },
        data: { 
          password: hashedPassword,
          role: 'ADMIN', 
          statut: 'ACTIF' 
        }
      });
      
      console.log('✅ Compte admin mis à jour!');
      console.log('-----------------------------------');
      console.log('Téléphone:', updated.telephone);
      console.log('Mot de passe:', adminPassword);
      console.log('Role:', updated.role);
      console.log('-----------------------------------');
    } else {
      // Create new admin
      const admin = await prisma.user.create({
        data: {
          prenom: 'Admin',
          nom: 'Jaango',
          telephone: adminTelephone,
          adresse: 'Dakar, Sénégal',
          numeroCNI: 'ADMIN-' + adminTelephone,
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
      console.log('Role:', admin.role);
      console.log('-----------------------------------');
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
