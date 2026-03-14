'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Lock, Eye, EyeOff, CheckCircle2, X, KeyRound } from 'lucide-react';

// Password strength calculator
function calculatePasswordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'Très faible' };
  if (score === 2) return { score: 40, label: 'Faible' };
  if (score === 3) return { score: 60, label: 'Moyen' };
  if (score === 4) return { score: 80, label: 'Fort' };
  return { score: 100, label: 'Très fort' };
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/reset-password/verify-token?token=${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setValidToken(true);
        } else {
          toast({
            variant: 'destructive',
            title: 'Lien invalide',
            description: 'Ce lien de réinitialisation a expiré ou est invalide',
          });
        }
      } catch {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Une erreur est survenue',
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Les mots de passe ne correspondent pas',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      toast({
        title: 'Mot de passe réinitialisé',
        description: 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe',
      });

      router.push('/connexion');
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

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!validToken) {
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
            <CardTitle className="text-2xl text-red-600">Lien invalide</CardTitle>
            <CardDescription>
              Ce lien de réinitialisation a expiré ou est invalide
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/mot-de-passe-oublie">
                Demander un nouveau lien
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/connexion">
                Retour à la connexion
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
            <KeyRound className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <CardDescription>
            Créez un nouveau mot de passe pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Force du mot de passe</span>
                    <span className={`font-medium ${calculatePasswordStrength(formData.password).score >= 60 ? 'text-green-600' : calculatePasswordStrength(formData.password).score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {calculatePasswordStrength(formData.password).label}
                    </span>
                  </div>
                  <Progress 
                    value={calculatePasswordStrength(formData.password).score} 
                    className="h-1.5"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Retapez votre mot de passe"
                  className="pl-10 pr-10"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Password match indicator */}
              {formData.confirmPassword && (
                <div className="flex items-center gap-2 text-xs">
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span className="text-green-600">Les mots de passe correspondent</span>
                    </>
                  ) : (
                    <>
                      <X className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-red-600">Les mots de passe ne correspondent pas</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
          </form>

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
