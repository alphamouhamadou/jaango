'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, AlertTriangle, ArrowRight, RefreshCcw, Loader2 } from 'lucide-react';

function PaymentErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorInfo, setErrorInfo] = useState<{
    ref: string | null;
    message: string;
  }>({
    ref: null,
    message: 'Une erreur est survenue lors du paiement.',
  });

  useEffect(() => {
    // Get error info from URL params
    const ref = searchParams.get('ref');
    const message = searchParams.get('message');
    const status = searchParams.get('status');
    
    // Simulate loading
    const timer = setTimeout(() => {
      setErrorInfo({
        ref: ref,
        message: message || getErrorMessage(status),
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const getErrorMessage = (status: string | null): string => {
    switch (status) {
      case 'cancelled':
        return 'Le paiement a été annulé.';
      case 'expired':
        return 'La session de paiement a expiré.';
      case 'insufficient_funds':
        return 'Fonds insuffisants sur votre compte.';
      case 'invalid_phone':
        return 'Numéro de téléphone invalide.';
      default:
        return 'Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-red-600 animate-spin mb-4" />
              <p className="text-muted-foreground">Vérification...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700 dark:text-red-400">
            Paiement échoué
          </CardTitle>
          <CardDescription>
            Le paiement n'a pas pu être effectué
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errorInfo.ref && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Référence</p>
              <p className="font-mono font-medium">{errorInfo.ref}</p>
            </div>
          )}

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-700 dark:text-red-400">
                  Détails de l'erreur
                </p>
                <p className="text-red-600 dark:text-red-500">
                  {errorInfo.message}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Aide :</strong> Si le problème persiste, vérifiez que vous avez suffisamment de fonds sur votre compte Mobile Money et réessayez.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.back()}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Réessayer le paiement
            </Button>
            <Link href="/dashboard" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowRight className="h-4 w-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
            <Link href="/transactions" className="w-full">
              <Button variant="ghost" className="w-full">
                Voir mes transactions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
        <Loader2 className="h-16 w-16 text-red-600 animate-spin" />
      </div>
    }>
      <PaymentErrorContent />
    </Suspense>
  );
}
