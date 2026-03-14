import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { db } from '@/lib/db';

const SECRET_KEY = process.env.JWT_SECRET || 'jaango-secret-key-2024';
const key = new TextEncoder().encode(SECRET_KEY);

export async function POST(request: Request) {
  try {
    const { telephone, code } = await request.json();

    if (!telephone || !code) {
      return NextResponse.json(
        { error: 'Téléphone et code requis' },
        { status: 400 }
      );
    }

    // Get the reset token from cookies
    const cookieHeader = request.headers.get('cookie');
    const resetTokenMatch = cookieHeader?.match(/reset_token=([^;]+)/);
    
    if (!resetTokenMatch) {
      return NextResponse.json(
        { error: 'Session de réinitialisation invalide' },
        { status: 400 }
      );
    }

    const resetToken = resetTokenMatch[1];

    // Verify the token
    let payload;
    try {
      const result = await jwtVerify(resetToken, key);
      payload = result.payload as { telephone: string; code: string; type: string };
    } catch {
      return NextResponse.json(
        { error: 'Code expiré, veuillez recommencer' },
        { status: 400 }
      );
    }

    // Verify the code matches
    if (payload.code !== code || payload.telephone.replace(/\s+/g, '').slice(-9) !== telephone.replace(/\s+/g, '').slice(-9)) {
      return NextResponse.json(
        { error: 'Code incorrect' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await db.user.findFirst({
      where: {
        telephone: {
          contains: telephone.replace(/\s+/g, '').slice(-9)
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Create a verified token for password reset
    const verifiedToken = await new SignJWT({
      userId: user.id,
      telephone: user.telephone,
      type: 'password_reset_verified'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(key);

    return NextResponse.json({
      message: 'Code vérifié',
      token: verifiedToken
    });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
