import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { nom, email, telephone, sujet, message } = await request.json();

    if (!nom || !email || !message) {
      return NextResponse.json(
        { error: 'Veuillez remplir tous les champs obligatoires' },
        { status: 400 }
      );
    }

    // In production, send email or save to database
    // For now, just log and return success
    console.log('Contact form submission:', {
      nom,
      email,
      telephone,
      sujet,
      message,
      timestamp: new Date().toISOString()
    });

    // Create a notification for admins
    try {
      const admins = await db.user.findMany({
        where: { role: 'ADMIN' }
      });

      for (const admin of admins) {
        await db.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEME',
            titre: 'Nouveau message de contact',
            message: `${nom} (${email}) a envoyé un message: ${sujet || 'Sans sujet'}`,
          }
        });
      }
    } catch {
      // Ignore notification errors
    }

    return NextResponse.json({
      message: 'Message envoyé avec succès'
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
