'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Smartphone, CreditCard, ExternalLink } from 'lucide-react';
import { formatFCFA } from '@/lib/helpers';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'AVANCE' | 'REMBOURSEMENT';
  demandeId: string;
  remboursementId?: string;
  amount: number;
  description: string;
  onSuccess: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  type,
  demandeId,
  remboursementId,
  amount,
  description,
  onSuccess,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    redirectUrl?: string;
  } | null>(null);

  const handlePayment = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          demandeId,
          remboursementId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.transaction?.redirect_url) {
        setResult({
          success: true,
          message: 'Redirection vers la page de paiement PayTech...',
          redirectUrl: data.transaction.redirect_url,
        });
        
        // Redirect to PayTech payment page
        window.location.href = data.transaction.redirect_url;
      } else {
        setResult({
          success: false,
          message: data.error || 'Erreur lors de la création du paiement',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Erreur de connexion. Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetModal();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            Paiement via PayTech
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            {/* Amount display */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 mb-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Montant à payer</p>
                <p className="text-4xl font-bold text-green-600">{formatFCFA(amount)}</p>
              </div>
            </div>

            {/* Payment methods info */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Méthodes de paiement disponibles :</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center justify-center gap-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <span className="text-sm font-medium text-orange-600">Orange Money</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <span className="text-sm font-medium text-cyan-600">Wave</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <span className="text-sm font-medium text-red-600">Free Money</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Vous serez redirigé vers PayTech pour choisir votre méthode de paiement
                </p>
              </CardContent>
            </Card>

            {/* Security info */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-700 dark:text-blue-400">Paiement sécurisé</p>
                <p className="text-blue-600 dark:text-blue-500 text-xs">
                  PayTech utilise un cryptage SSL et est conforme aux normes de sécurité PCI DSS.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Result display */
          <div className="py-6 text-center">
            {result.success ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Redirection en cours...</h3>
                <p className="text-muted-foreground mb-4">{result.message}</p>
                {result.redirectUrl && (
                  <Button
                    onClick={() => window.location.href = result.redirectUrl!}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Aller à la page de paiement
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Échec du paiement</h3>
                <p className="text-muted-foreground">{result.message}</p>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!result ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Traitement...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Payer {formatFCFA(amount)}
                  </>
                )}
              </Button>
            </>
          ) : result.success ? (
            <Button
              onClick={() => {
                onSuccess();
                onOpenChange(false);
                resetModal();
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continuer
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
              <Button
                onClick={() => setResult(null)}
                className="bg-green-600 hover:bg-green-700"
              >
                Réessayer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
