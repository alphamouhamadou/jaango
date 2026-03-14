'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Smartphone, Check, Loader2, AlertCircle } from 'lucide-react';

interface NotificationSettingsData {
  pushEnabled: boolean;
  echeanceEnabled: boolean;
  validationEnabled: boolean;
  rejetEnabled: boolean;
  decaissementEnabled: boolean;
  remboursementEnabled: boolean;
  paiementEnabled: boolean;
  systemeEnabled: boolean;
}

interface NotificationPreferencesProps {
  onSettingsChange?: (settings: NotificationSettingsData) => void;
}

export function NotificationPreferences({ onSettingsChange }: NotificationPreferencesProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [hasPushSubscription, setHasPushSubscription] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettingsData>({
    pushEnabled: false,
    echeanceEnabled: true,
    validationEnabled: true,
    rejetEnabled: true,
    decaissementEnabled: true,
    remboursementEnabled: true,
    paiementEnabled: true,
    systemeEnabled: true,
  });

  // Check push notification support and load settings
  useEffect(() => {
    const init = async () => {
      // Check if push notifications are supported
      const supported = 'serviceWorker' in navigator && 'PushManager' in window;
      setPushSupported(supported);
      
      if (supported) {
        // Check permission status
        const permission = Notification.permission;
        setPushPermission(permission);
        
        // Check if service worker is registered
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          setHasPushSubscription(!!subscription);
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
      
      // Load settings from server
      try {
        const response = await fetch('/api/notification-settings');
        const data = await response.json();
        
        if (data.settings) {
          setSettings({
            pushEnabled: data.settings.pushEnabled ?? false,
            echeanceEnabled: data.settings.echeanceEnabled ?? true,
            validationEnabled: data.settings.validationEnabled ?? true,
            rejetEnabled: data.settings.rejetEnabled ?? true,
            decaissementEnabled: data.settings.decaissementEnabled ?? true,
            remboursementEnabled: data.settings.remboursementEnabled ?? true,
            paiementEnabled: data.settings.paiementEnabled ?? true,
            systemeEnabled: data.settings.systemeEnabled ?? true,
          });
          setHasPushSubscription(data.hasPushSubscription ?? false);
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
      
      setIsLoading(false);
    };
    
    init();
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = async () => {
    if (!pushSupported) {
      toast({
        variant: 'destructive',
        title: 'Non supporté',
        description: 'Votre navigateur ne supporte pas les notifications push.',
      });
      return;
    }
    
    setIsSubscribing(true);
    
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission !== 'granted') {
        toast({
          variant: 'destructive',
          title: 'Permission refusée',
          description: 'Veuillez autoriser les notifications dans les paramètres de votre navigateur.',
        });
        setIsSubscribing(false);
        return;
      }
      
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const vapidResponse = await fetch('/api/push/vapid-key');
      const vapidData = await vapidResponse.json();
      
      if (!vapidResponse.ok || !vapidData.publicKey) {
        throw new Error('Impossible de récupérer la clé VAPID');
      }
      
      // Subscribe
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidData.publicKey),
      });
      
      // Send subscription to server
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
      
      if (!subscribeResponse.ok) {
        throw new Error('Failed to save subscription');
      }
      
      setHasPushSubscription(true);
      
      toast({
        title: 'Notifications activées',
        description: 'Vous recevrez maintenant des notifications push.',
      });
      
    } catch (error) {
      console.error('Push subscription error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible d\'activer les notifications push.',
      });
    }
    
    setIsSubscribing(false);
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async () => {
    setIsSubscribing(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        // Send unsubscribe to server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        
        // Unsubscribe locally
        await subscription.unsubscribe();
      }
      
      setHasPushSubscription(false);
      
      toast({
        title: 'Notifications désactivées',
        description: 'Vous ne recevrez plus de notifications push.',
      });
      
    } catch (error) {
      console.error('Push unsubscription error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de désactiver les notifications push.',
      });
    }
    
    setIsSubscribing(false);
  };

  // Update a setting
  const updateSetting = async (key: keyof NotificationSettingsData, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      
      if (onSettingsChange) {
        onSettingsChange(newSettings);
      }
      
    } catch (error) {
      console.error('Error updating setting:', error);
      // Revert on error
      setSettings(settings);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de sauvegarder les paramètres.',
      });
    }
    
    setIsSaving(false);
  };

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Notifications Push
              </CardTitle>
              <CardDescription>
                Recevez des notifications même lorsque vous n'êtes pas sur le site
              </CardDescription>
            </div>
            {!pushSupported && (
              <Badge variant="secondary">Non supporté</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupported ? (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Navigateur non compatible
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Les notifications push ne sont pas supportées par votre navigateur. 
                  Essayez Chrome, Firefox, Edge ou Safari.
                </p>
              </div>
            </div>
          ) : pushPermission === 'denied' ? (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <BellOff className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">
                  Permission bloquée
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Vous avez bloqué les notifications. Veuillez les autoriser dans les 
                  paramètres de votre navigateur.
                </p>
              </div>
            </div>
          ) : hasPushSubscription ? (
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Notifications push activées
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                  Vous recevrez des notifications sur cet appareil.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={unsubscribeFromPush}
                disabled={isSubscribing}
                className="shrink-0"
              >
                {isSubscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <BellOff className="h-4 w-4 mr-2" />
                    Désactiver
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  Activez les notifications push
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Restez informé de vos échéances et mises à jour importantes.
                </p>
              </div>
              <Button
                onClick={subscribeToPush}
                disabled={isSubscribing}
                className="shrink-0 bg-green-600 hover:bg-green-700"
              >
                {isSubscribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Activer
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Types de notifications
          </CardTitle>
          <CardDescription>
            Choisissez les types de notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="echeance" className="font-medium">Échéances de remboursement</Label>
                <p className="text-sm text-muted-foreground">
                  Rappels avant chaque échéance
                </p>
              </div>
              <Switch
                id="echeance"
                checked={settings.echeanceEnabled}
                onCheckedChange={(checked) => updateSetting('echeanceEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="validation" className="font-medium">Validation de demande</Label>
                <p className="text-sm text-muted-foreground">
                  Quand votre demande est validée
                </p>
              </div>
              <Switch
                id="validation"
                checked={settings.validationEnabled}
                onCheckedChange={(checked) => updateSetting('validationEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="rejet" className="font-medium">Rejet de demande</Label>
                <p className="text-sm text-muted-foreground">
                  Si votre demande est rejetée
                </p>
              </div>
              <Switch
                id="rejet"
                checked={settings.rejetEnabled}
                onCheckedChange={(checked) => updateSetting('rejetEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="decaissement" className="font-medium">Décaissement</Label>
                <p className="text-sm text-muted-foreground">
                  Quand les fonds sont décaissés
                </p>
              </div>
              <Switch
                id="decaissement"
                checked={settings.decaissementEnabled}
                onCheckedChange={(checked) => updateSetting('decaissementEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="remboursement" className="font-medium">Remboursement</Label>
                <p className="text-sm text-muted-foreground">
                  Confirmation de vos paiements
                </p>
              </div>
              <Switch
                id="remboursement"
                checked={settings.remboursementEnabled}
                onCheckedChange={(checked) => updateSetting('remboursementEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="paiement" className="font-medium">Paiements</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications de paiement
                </p>
              </div>
              <Switch
                id="paiement"
                checked={settings.paiementEnabled}
                onCheckedChange={(checked) => updateSetting('paiementEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="systeme" className="font-medium">Système</Label>
                <p className="text-sm text-muted-foreground">
                  Annonces et mises à jour importantes
                </p>
              </div>
              <Switch
                id="systeme"
                checked={settings.systemeEnabled}
                onCheckedChange={(checked) => updateSetting('systemeEnabled', checked)}
              />
            </div>
          </div>
          
          {isSaving && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Sauvegarde en cours...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
