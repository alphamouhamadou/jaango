import { NextResponse } from 'next/server';

// VAPID public key - This is safe to share publicly
// Must match the key used in web-push configuration
export async function GET() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  
  if (!publicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    publicKey
  });
}
