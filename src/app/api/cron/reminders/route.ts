import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPushNotificationToUser } from '@/lib/push-service';

// Cron job endpoint to send payment reminders
// Can be called by external cron services like cron-job.org, Vercel Cron, etc.
// Should be secured with a secret token

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended for production)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const results = {
      remindersSent: 0,
      pushSent: 0,
      errors: 0,
    };
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);
    
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(23, 59, 59, 999);
    
    // Find payments due in 1 or 3 days
    const upcomingPayments = await db.remboursement.findMany({
      where: {
        statut: 'EN_ATTENTE',
        dateEcheance: {
          gte: now,
          lte: in3Days,
        },
      },
      include: {
        user: {
          include: {
            notificationSettings: true,
            pushSubscriptions: true,
          }
        },
        demandePret: {
          select: {
            id: true,
            montant: true,
          }
        }
      }
    });
    
    for (const payment of upcomingPayments) {
      try {
        const daysUntilDue = Math.ceil(
          (payment.dateEcheance.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Create in-app notification
        await db.notification.create({
          data: {
            userId: payment.userId,
            type: 'ECHEANCE',
            titre: `Rappel : échéance dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}`,
            message: `Paiement de ${payment.montant.toLocaleString('fr-FR')} FCFA à effectuer avant le ${payment.dateEcheance.toLocaleDateString('fr-FR')}.`,
            lien: `/pret/${payment.demandePretId}`,
          }
        });
        
        results.remindersSent++;
        
        // Send push notification if enabled
        if (payment.user.notificationSettings?.pushEnabled && 
            payment.user.notificationSettings?.echeanceEnabled &&
            payment.user.pushSubscriptions.length > 0) {
          
          await sendPushNotificationToUser(payment.userId, {
            title: `Rappel d'échéance Jaango`,
            body: `Paiement de ${payment.montant.toLocaleString('fr-FR')} FCFA dans ${daysUntilDue} jour${daysUntilDue > 1 ? 's' : ''}.`,
            icon: '/logo.jpg',
            badge: '/logo.jpg',
            tag: `echeance-${payment.id}`,
            url: `/pret/${payment.demandePretId}`,
          });
          
          results.pushSent++;
        }
        
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        results.errors++;
      }
    }
    
    // Also check for overdue payments and mark them
    const overduePayments = await db.remboursement.updateMany({
      where: {
        statut: 'EN_ATTENTE',
        dateEcheance: {
          lt: now,
        }
      },
      data: {
        statut: 'RETARD',
      }
    });
    
    // Send overdue notifications
    const overdueWithUsers = await db.remboursement.findMany({
      where: {
        statut: 'RETARD',
      },
      include: {
        user: {
          include: {
            notificationSettings: true,
            pushSubscriptions: true,
          }
        },
        demandePret: {
          select: { id: true }
        }
      },
      take: 50, // Limit to prevent overwhelming
    });
    
    for (const payment of overdueWithUsers) {
      try {
        // Create overdue notification
        await db.notification.create({
          data: {
            userId: payment.userId,
            type: 'ECHEANCE',
            titre: 'Paiement en retard',
            message: `Votre paiement de ${payment.montant.toLocaleString('fr-FR')} FCFA est en retard. Veuillez régulariser votre situation.`,
            lien: `/pret/${payment.demandePretId}`,
          }
        });
        
        // Send push for overdue
        if (payment.user.notificationSettings?.pushEnabled && 
            payment.user.pushSubscriptions.length > 0) {
          
          await sendPushNotificationToUser(payment.userId, {
            title: 'Paiement en retard - Jaango',
            body: `Paiement de ${payment.montant.toLocaleString('fr-FR')} FCFA en retard. Veuillez régulariser.`,
            icon: '/logo.jpg',
            badge: '/logo.jpg',
            tag: `retard-${payment.id}`,
            url: `/pret/${payment.demandePretId}`,
          });
        }
        
      } catch (error) {
        console.error(`Error processing overdue payment ${payment.id}:`, error);
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results: {
        ...results,
        overdueMarked: overduePayments.count,
      }
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
