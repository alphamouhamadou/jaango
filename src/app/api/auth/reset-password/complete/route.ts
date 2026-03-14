import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

const SECRET_KEY = process.env.JWT_SECRET || 'jaango-secret-key-2024';
const key = new TextEncoder().encode(SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Verify the token
    let payload;
    try {
      const result = await jwtVerify(token, key);
      payload = result.payload as { userId: string; telephone: string; type: string };
    } catch {
      return NextResponse.json(
        { error: 'Token expiré ou invalide' },
        { status: 400 }
      );
    }

    if (payload.type !== 'password_reset_verified') {
      return NextResponse.json(
        { error: 'Type de token invalide' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update the user's password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    const response = NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

    // Clear the reset token cookie
    response.cookies.delete('reset_token');

    return response;
  } catch (error) {
    console.error('Complete reset error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
