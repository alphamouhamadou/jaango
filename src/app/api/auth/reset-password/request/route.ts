import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SignJWT } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'jaango-secret-key-2024';
const key = new TextEncoder().encode(SECRET_KEY);

// Generate a 6-digit code
function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { telephone } = await request.json();

    if (!telephone) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = telephone.replace(/\s+/g, '').replace(/^\+221/, '');

    // Check if user exists
    const user = await db.user.findFirst({
      where: {
        telephone: {
          contains: normalizedPhone.slice(-9)
        }
      }
    });

    if (!user) {
      // Don't reveal if user exists or not
      return NextResponse.json({
        message: 'Si ce numéro est associé à un compte, un code sera envoyé',
        code: generateResetCode() // Return fake code for security
      });
    }

    // Generate reset code
    const resetCode = generateResetCode();

    // In production, send SMS here
    // For development, return the code
    console.log(`Reset code for ${telephone}: ${resetCode}`);

    // Create a temporary token with the reset code
    const resetToken = await new SignJWT({
      telephone: user.telephone,
      code: resetCode,
      type: 'password_reset'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(key);

    // Store in a cookie or return for development
    const response = NextResponse.json({
      message: 'Code envoyé avec succès',
      // In development, return the code
      code: process.env.NODE_ENV === 'development' ? resetCode : undefined
    });

    // Set the reset token as a cookie
    response.cookies.set('reset_token', resetToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15, // 15 minutes
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Reset password request error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
