'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Phone, KeyRound } from 'lucide-react';

export default function MotDePasseOubliePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code' | 'success'>('phone');
  const [telephone, setTelephone] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (telephone.length < 9) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer un numéro de téléphone valide',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      // In development, show the code; in production, it would be sent via SMS
      if (data.code) {
        setResetCode(data.code);
      }
      
      setStep('code');
      toast({
        title: 'Code envoyé',
        description: data.message || 'Un code de réinitialisation a été envoyé',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (enteredCode.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez entrer le code à 6 chiffres',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telephone, code: enteredCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Code invalide');
      }

      // Redirect to reset password page with token
      router.push(`/reinitialiser-mot-de-passe?token=${data.token}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Code invalide',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-green-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
            <img 
              src="/logo.jpg" 
              alt="Jaango Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="text-2xl font-bold gradient-text">Jaango</span>
          </Link>
          <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-orange-500" />
          </div>
          <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Entrez votre numéro de téléphone pour recevoir un code de réinitialisation'
              : 'Entrez le code reçu par SMS'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' && (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="telephone"
                    placeholder="Ex: 77 123 45 67"
                    className="pl-10"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  'Envoyer le code'
                )}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {/* Development mode: show the code */}
              {resetCode && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Mode test:</strong> Code de réinitialisation: <span className="font-mono font-bold">{resetCode}</span>
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="code">Code de vérification</Label>
                <Input
                  id="code"
                  placeholder="Entrez le code à 6 chiffres"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Vérifier le code'
                )}
              </Button>

              <Button 
                type="button" 
                variant="ghost" 
                className="w-full"
                onClick={() => setStep('phone')}
              >
                Renvoyer le code
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Vous vous souvenez de votre mot de passe ?{' '}
              <Link href="/connexion" className="text-green-600 hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-4">
            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
