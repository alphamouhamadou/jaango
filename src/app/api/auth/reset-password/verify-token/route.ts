import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'jaango-secret-key-2024';
const key = new TextEncoder().encode(SECRET_KEY);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token manquant' },
        { status: 400 }
      );
    }

    // Verify the token
    try {
      const result = await jwtVerify(token, key);
      const payload = result.payload as { userId: string; telephone: string; type: string };

      if (payload.type !== 'password_reset_verified') {
        return NextResponse.json(
          { valid: false, error: 'Type de token invalide' },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        userId: payload.userId
      });
    } catch {
      return NextResponse.json(
        { valid: false, error: 'Token expiré ou invalide' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
