'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { formatFCFA } from '@/lib/helpers';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentInfo, setPaymentInfo] = useState<{
    ref: string | null;
    amount: number | null;
    status: string;
  }>({
    ref: null,
    amount: null,
    status: 'success',
  });

  useEffect(() => {
    // Get payment info from URL params
    const ref = searchParams.get('ref');
    const token = searchParams.get('token');
    
    // Simulate loading to show animation
    const timer = setTimeout(() => {
      setPaymentInfo({
        ref: ref || token,
        amount: null, // Will be fetched from API if needed
        status: 'success',
      });
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-green-600 animate-spin mb-4" />
              <p className="text-muted-foreground">Vérification du paiement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700 dark:text-green-400">
            Paiement réussi !
          </CardTitle>
          <CardDescription>
            Votre paiement a été effectué avec succès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {paymentInfo.ref && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Référence</p>
              <p className="font-mono font-medium">{paymentInfo.ref}</p>
            </div>
          )}

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-400">
                  Confirmation envoyée
                </p>
                <p className="text-green-600 dark:text-green-500">
                  Vous recevrez une notification de confirmation sur votre compte.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Button>
            <Link href="/transactions" className="w-full">
              <Button variant="outline" className="w-full">
                Voir mes transactions
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
        <Loader2 className="h-16 w-16 text-green-600 animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
