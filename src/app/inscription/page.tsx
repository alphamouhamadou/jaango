'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { ArrowLeft, Loader2, User, Phone, MapPin, CreditCard, Calendar, Lock, Eye, EyeOff, CheckCircle2, X } from 'lucide-react';

// Password strength calculator
function calculatePasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'Très faible', color: 'bg-red-500' };
  if (score === 2) return { score: 40, label: 'Faible', color: 'bg-orange-500' };
  if (score === 3) return { score: 60, label: 'Moyen', color: 'bg-yellow-500' };
  if (score === 4) return { score: 80, label: 'Fort', color: 'bg-green-500' };
  return { score: 100, label: 'Très fort', color: 'bg-green-600' };
}

export default function InscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    adresse: '',
    numeroCNI: '',
    dateNaissance: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.prenom.length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }
    if (formData.nom.length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    if (!/^(\+221|0)?[0-9]{9}$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone inval';
    }
    if (formData.adresse.length < 5) {
      newErrors.adresse = 'L\'adresse doit contenir au moins 5 caractères';
    }
    if (formData.numeroCNI.length < 10) {
      newErrors.numeroCNI = 'Numéro CNI invalide';
    }
    if (formData.dateNaissance) {
      const birthDate = new Date(formData.dateNaissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateNaissance = 'Vous devez avoir au moins 18 ans';
      }
    } else {
      newErrors.dateNaissance = 'La date de naissance est requise';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          adresse: formData.adresse,
          numeroCNI: formData.numeroCNI,
          dateNaissance: formData.dateNaissance,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setUser(data.user);
      toast({
        title: 'Inscription réussie !',
        description: 'Bienvenue sur Jaango. Vous êtes maintenant connecté.',
      });
      router.push('/dashboard');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue lors de l\'inscription',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-green-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 justify-center">
            <img 
              src="/logo.jpg" 
              alt="Jaango Logo" 
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="text-2xl font-bold gradient-text">Jaango</span>
          </Link>
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous pour accéder aux prêts communautaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="prenom"
                    placeholder="Votre prénom"
                    className="pl-10"
                    value={formData.prenom}
                    onChange={(e) => updateFormData('prenom', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.prenom && (
                  <p className="text-sm text-destructive">{errors.prenom}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="nom"
                    placeholder="Votre nom"
                    className="pl-10"
                    value={formData.nom}
                    onChange={(e) => updateFormData('nom', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="telephone"
                  placeholder="Ex: 77 123 45 67"
                  className="pl-10"
                  value={formData.telephone}
                  onChange={(e) => updateFormData('telephone', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.telephone && (
                <p className="text-sm text-destructive">{errors.telephone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="adresse"
                  placeholder="Votre adresse complète"
                  className="pl-10"
                  value={formData.adresse}
                  onChange={(e) => updateFormData('adresse', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.adresse && (
                <p className="text-sm text-destructive">{errors.adresse}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroCNI">Numéro CNI</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="numeroCNI"
                  placeholder="Numéro de votre carte d'identité"
                  className="pl-10"
                  value={formData.numeroCNI}
                  onChange={(e) => updateFormData('numeroCNI', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.numeroCNI && (
                <p className="text-sm text-destructive">{errors.numeroCNI}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateNaissance">Date de naissance</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dateNaissance"
                  type="date"
                  className="pl-10"
                  value={formData.dateNaissance}
                  onChange={(e) => updateFormData('dateNaissance', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.dateNaissance && (
                <p className="text-sm text-destructive">{errors.dateNaissance}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 caractères"
                  className="pl-10 pr-10"
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
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
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
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
                  onChange={(e) => updateFormData('confirmPassword', e.target.value)}
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
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Déjà inscrit ?{' '}
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
