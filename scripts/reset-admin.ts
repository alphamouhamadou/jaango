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
  const adminTelephone = '771234567';
  const adminPassword = 'Admin123!';
  const hashedPassword = await hashPassword(adminPassword);

  try {
    // Update admin with new password
    const admin = await prisma.user.update({
      where: { telephone: adminTelephone },
      data: { 
        password: hashedPassword,
        role: 'ADMIN', 
        statut: 'ACTIF' 
      }
    });

    console.log('✅ Admin account reset successfully!');
    console.log('-----------------------------------');
    console.log('Téléphone:', admin.telephone);
    console.log('Mot de passe:', adminPassword);
    console.log('Role:', admin.role);
    console.log('Statut:', admin.statut);
    console.log('Hash:', hashedPassword);
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
