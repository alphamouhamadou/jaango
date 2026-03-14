import { db } from './db';
import { sendPushNotificationToUser } from './push-service';

export type NotificationType = 
  | 'ECHEANCE' 
  | 'VALIDATION' 
  | 'REJET' 
  | 'DECAISSEMENT' 
  | 'REMBOURSEMENT' 
  | 'SYSTEME' 
  | 'PAIEMENT';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  titre: string;
  message: string;
  lien?: string;
  sendPush?: boolean; // Option to also send push notification
}

/**
 * Crée une notification pour un utilisateur
 * Envoie aussi une notification push si l'utilisateur l'a activé
 */
export async function createNotification({
  userId,
  type,
  titre,
  message,
  lien,
  sendPush = true,
}: CreateNotificationParams) {
  try {
    // Create in-app notification
    const notification = await db.notification.create({
      data: {
        userId,
        type,
        titre,
        message,
        lien,
      },
    });
    
    // Check if user has push notifications enabled for this type
    if (sendPush) {
      const settings = await db.notificationSettings.findUnique({
        where: { userId }
      });
      
      // Check if push is enabled and this notification type is enabled
      const typeEnabled = getTypeEnabled(settings, type);
      
      if (settings?.pushEnabled && typeEnabled) {
        // Send push notification
        try {
          await sendPushNotificationToUser(userId, {
            title: titre,
            body: message,
            icon: '/logo.jpg',
            badge: '/logo.jpg',
            tag: `jaango-${type.toLowerCase()}`,
            url: lien || '/notifications',
            notificationId: notification.id,
          });
        } catch (pushError) {
          // Log but don't fail if push fails
          console.error('Push notification failed:', pushError);
        }
      }
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Check if a notification type is enabled in settings
 */
function getTypeEnabled(settings: { [key: string]: boolean } | null, type: NotificationType): boolean {
  if (!settings) return true; // Default to enabled
  
  const typeMap: Record<NotificationType, string> = {
    ECHEANCE: 'echeanceEnabled',
    VALIDATION: 'validationEnabled',
    REJET: 'rejetEnabled',
    DECAISSEMENT: 'decaissementEnabled',
    REMBOURSEMENT: 'remboursementEnabled',
    SYSTEME: 'systemeEnabled',
    PAIEMENT: 'paiementEnabled',
  };
  
  return settings[typeMap[type]] ?? true;
}

/**
 * Notifie l'utilisateur d'une nouvelle échéance
 */
export async function notifyEcheance(
  userId: string,
  montant: number,
  dateEcheance: Date,
  pretId: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  const dateStr = dateEcheance.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
  
  return createNotification({
    userId,
    type: 'ECHEANCE',
    titre: 'Échéance de remboursement',
    message: `Rappel : échéance de ${montantFCFA} FCFA le ${dateStr}. Pensez à effectuer votre paiement.`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Notifie l'utilisateur de la validation de sa demande
 */
export async function notifyValidation(
  userId: string,
  montant: number,
  pretId: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'VALIDATION',
    titre: 'Demande validée',
    message: `Félicitations ! Votre demande de prêt de ${montantFCFA} FCFA a été validée. Le décaissement sera effectué sous peu.`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Notifie l'utilisateur du rejet de sa demande
 */
export async function notifyRejet(
  userId: string,
  montant: number,
  raison?: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'REJET',
    titre: 'Demande rejetée',
    message: `Votre demande de prêt de ${montantFCFA} FCFA a été rejetée. ${raison || 'Contactez le support pour plus d\'informations.'}`,
  });
}

/**
 * Notifie l'utilisateur du décaissement de son prêt
 */
export async function notifyDecaissement(
  userId: string,
  montant: number,
  pretId: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'DECAISSEMENT',
    titre: 'Fonds décaissés',
    message: `Votre prêt de ${montantFCFA} FCFA a été décaissé. Consultez votre échéancier de remboursement.`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Notifie l'utilisateur d'un remboursement effectué
 */
export async function notifyRemboursement(
  userId: string,
  montant: number,
  pretId: string,
  reste: number
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  const resteFCFA = reste.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'REMBOURSEMENT',
    titre: 'Remboursement enregistré',
    message: `Paiement de ${montantFCFA} FCFA enregistré avec succès. Reste à payer : ${resteFCFA} FCFA.`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Notifie l'utilisateur d'un paiement reçu
 */
export async function notifyPaiement(
  userId: string,
  montant: number,
  pretId: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'PAIEMENT',
    titre: 'Paiement confirmé',
    message: `Votre paiement de ${montantFCFA} FCFA a été confirmé avec succès.`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Notifie l'utilisateur de la création de sa demande
 */
export async function notifyDemandeCreee(
  userId: string,
  montant: number,
  pretId: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'SYSTEME',
    titre: 'Demande enregistrée',
    message: `Votre demande de prêt de ${montantFCFA} FCFA a été enregistrée. Elle sera examinée sous 48h.`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Notifie l'utilisateur que son prêt est entièrement remboursé
 */
export async function notifyPretRembourse(
  userId: string,
  montant: number,
  pretId: string
) {
  const montantFCFA = montant.toLocaleString('fr-FR');
  
  return createNotification({
    userId,
    type: 'REMBOURSEMENT',
    titre: 'Prêt remboursé 🎉',
    message: `Félicitations ! Votre prêt de ${montantFCFA} FCFA est entièrement remboursé. Vous êtes maintenant éligible au prêt Gold !`,
    lien: `/pret/${pretId}`,
  });
}

/**
 * Envoie des rappels d'échéance aux utilisateurs
 * À exécuter quotidiennement via cron job
 */
export async function sendEcheanceReminders() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);
  
  // Trouver les remboursements avec échéance dans 1 ou 3 jours
  const remboursements = await db.remboursement.findMany({
    where: {
      statut: 'EN_ATTENTE',
      dateEcheance: {
        gte: today,
        lte: in3Days,
      },
    },
    include: {
      demandePret: true,
      user: true,
    },
  });
  
  for (const remb of remboursements) {
    await notifyEcheance(
      remb.userId,
      remb.montant,
      remb.dateEcheance,
      remb.demandePretId
    );
  }
  
  return remboursements.length;
}
