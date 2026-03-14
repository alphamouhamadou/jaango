'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Lock,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { formatFCFA, calculateLoanDetails } from '@/lib/helpers';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

interface EligibilityData {
  isGoldEligible: boolean;
  hasActiveLoan: boolean;
  hasPendingLoan: boolean;
  repaidSilverLoans: number;
  totalLoans: number;
  repaidLoans: number;
  silverLoansCount: number;
  ineligibilityReasons: string[];
}

interface MembreForm {
  prenom: string;
  nom: string;
  dateNaissance: string;
  numeroCNI: string;
  telephone: string;
  adresse: string;
}

const emptyMembre: MembreForm = {
  prenom: '',
  nom: '',
  dateNaissance: '',
  numeroCNI: '',
  telephone: '',
  adresse: '',
};

function DemandePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [typePret, setTypePret] = useState<'SILVER' | 'GOLD' | null>(null);
  const [montant, setMontant] = useState(1000000);
  const [membres, setMembres] = useState<MembreForm[]>(Array(10).fill(null).map(() => ({ ...emptyMembre })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentMembreIndex, setCurrentMembreIndex] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdDemandeId, setCreatedDemandeId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check auth
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.user) {
          useAuthStore.getState().setUser(null);
          router.push('/connexion');
        } else {
          useAuthStore.getState().setUser(data.user);
        }
      } catch {
        useAuthStore.getState().setUser(null);
        router.push('/connexion');
      }
    };

    // Check eligibility
    const checkEligibility = async () => {
      try {
        const response = await fetch('/api/user/eligibility');
        const data = await response.json();
        
        if (response.ok) {
          setEligibility(data);
        }
      } catch {
        console.error('Failed to check eligibility');
      }
      setEligibilityLoading(false);
    };

    // Run auth and eligibility checks
    checkAuth();
    checkEligibility();

    // Check URL params for loan type
    const type = searchParams.get('type');
    if (type === 'silver') {
      setTypePret('SILVER');
      setMontant(1000000);
    } else if (type === 'gold') {
      // Only allow Gold if eligible - will be handled after eligibility loads
    }
  }, [router, searchParams]);

  // Handle Gold eligibility when eligibility loads
  useEffect(() => {
    if (eligibility && searchParams.get('type') === 'gold') {
      if (eligibility.isGoldEligible) {
        setTypePret('GOLD');
        setMontant(1500000);
      } else {
        setTypePret('SILVER');
        setMontant(1000000);
        toast({
          variant: 'destructive',
          title: 'Non éligible au prêt Gold',
          description: 'Vous devez d\'abord rembourser un prêt Silver avant d\'accéder au prêt Gold.',
        });
      }
    }
  }, [eligibility, searchParams, toast]);

  const loanDetails = calculateLoanDetails(montant);

  const validateMembre = (membre: MembreForm): Record<string, string> => {
    const membreErrors: Record<string, string> = {};
    
    if (membre.prenom.length < 2) {
      membreErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }
    if (membre.nom.length < 2) {
      membreErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    if (!/^(\+221|0)?[0-9]{9}$/.test(membre.telephone)) {
      membreErrors.telephone = 'Numéro de téléphone invalide';
    }
    if (membre.adresse.length < 5) {
      membreErrors.adresse = 'L\'adresse doit contenir au moins 5 caractères';
    }
    if (membre.numeroCNI.length < 10) {
      membreErrors.numeroCNI = 'Numéro CNI invalide';
    }
    if (membre.dateNaissance) {
      const birthDate = new Date(membre.dateNaissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        membreErrors.dateNaissance = 'Le membre doit avoir au moins 18 ans';
      }
    } else {
      membreErrors.dateNaissance = 'La date de naissance est requise';
    }
    
    return membreErrors;
  };

  const handleMembreChange = (field: string, value: string) => {
    const newMembres = [...membres];
    newMembres[currentMembreIndex] = {
      ...newMembres[currentMembreIndex],
      [field]: value,
    };
    setMembres(newMembres);
    
    // Clear error for this field
    const errorKey = `membre_${currentMembreIndex}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateCurrentMembre = (): boolean => {
    const membreErrors = validateMembre(membres[currentMembreIndex]);
    const newErrors: Record<string, string> = {};
    
    Object.keys(membreErrors).forEach(field => {
      newErrors[`membre_${currentMembreIndex}_${field}`] = membreErrors[field];
    });
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(membreErrors).length === 0;
  };

  const canProceedToNextMembre = (): boolean => {
    return Object.keys(validateMembre(membres[currentMembreIndex])).length === 0;
  };

  const completedMembres = membres.filter(m => 
    m.prenom && m.nom && m.dateNaissance && m.numeroCNI && m.telephone && m.adresse &&
    Object.keys(validateMembre(m)).length === 0
  ).length;

  const handleNextStep = () => {
    if (currentStep === 1 && !typePret) {
      setErrors({ typePret: 'Veuillez sélectionner un type de prêt' });
      return;
    }
    
    if (currentStep === 2) {
      // Validate loan amount
      if (typePret === 'SILVER' && (montant < 500000 || montant > 1000000)) {
        setErrors({ montant: 'Le montant pour un prêt Silver doit être entre 500 000 et 1 000 000 FCFA' });
        return;
      }
      if (typePret === 'GOLD' && (montant < 1000001 || montant > 3000000)) {
        setErrors({ montant: 'Le montant pour un prêt Gold doit être entre 1 000 001 et 3 000 000 FCFA' });
        return;
      }
    }
    
    if (currentStep === 3) {
      // Validate all membres before proceeding
      let allValid = true;
      const newErrors: Record<string, string> = {};
      
      membres.forEach((membre, index) => {
        const membreErrors = validateMembre(membre);
        if (Object.keys(membreErrors).length > 0) {
          allValid = false;
          Object.keys(membreErrors).forEach(field => {
            newErrors[`membre_${index}_${field}`] = membreErrors[field];
          });
        }
      });
      
      setErrors(newErrors);
      
      if (!allValid) {
        toast({
          variant: 'destructive',
          title: 'Validation requise',
          description: 'Veuillez compléter tous les membres correctement',
        });
        return;
      }
    }
    
    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typePret,
          montant,
          membres,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
      setCreatedDemandeId(data.demande.id);
      setCurrentStep(5); // Go to payment step
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

  const handlePayment = async () => {
    if (!createdDemandeId) return;
    
    setPaymentProcessing(true);
    
    try {
      const response = await fetch(`/api/demandes/${createdDemandeId}/statut`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du paiement');
      }
      
      setPaymentSuccess(true);
      toast({
        title: 'Paiement réussi !',
        description: 'Votre demande a été soumise avec succès',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur de paiement',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/logo.jpg" 
                alt="Jaango Logo" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="text-2xl font-bold gradient-text">Jaango</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">Étape {currentStep}/5</span>
              <Progress value={(currentStep / 5) * 100} className="w-24 h-2" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-4xl">
        {/* Step 1: Loan Type Selection */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choisissez votre type de prêt</CardTitle>
              <CardDescription>Sélectionnez le prêt adapté à vos besoins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {eligibilityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                  <span className="ml-2">Vérification de votre éligibilité...</span>
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Silver Option */}
                    <Card 
                      className={`cursor-pointer transition-all ${typePret === 'SILVER' ? 'border-2 border-gray-400 ring-2 ring-gray-200' : 'border hover:border-gray-300'}`}
                      onClick={() => {
                        setTypePret('SILVER');
                        setMontant(1000000);
                        setErrors({});
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-semibold">Prêt Silver</p>
                            <p className="text-sm text-muted-foreground">Jusqu'à 1 000 000 FCFA</p>
                          </div>
                          {typePret === 'SILVER' && (
                            <CheckCircle2 className="h-6 w-6 text-gray-500 ml-auto" />
                          )}
                        </div>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Conditions d'accès simples
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Remboursement mensuel fixe
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Accès au Gold après remboursement
                          </li>
                        </ul>
                      </CardContent>
                    </Card>

                    {/* Gold Option */}
                    <Card 
                      className={`transition-all ${
                        !eligibility?.isGoldEligible 
                          ? 'opacity-60 cursor-not-allowed border' 
                          : typePret === 'GOLD' 
                            ? 'border-2 border-orange-400 ring-2 ring-orange-200 cursor-pointer' 
                            : 'border hover:border-orange-300 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (eligibility?.isGoldEligible) {
                          setTypePret('GOLD');
                          setMontant(1500000);
                          setErrors({});
                        }
                      }}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center relative">
                            <Sparkles className="h-6 w-6 text-orange-500" />
                            {!eligibility?.isGoldEligible && (
                              <Lock className="h-4 w-4 text-red-500 absolute -top-1 -right-1" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold flex items-center gap-2">
                              Prêt Gold
                              {!eligibility?.isGoldEligible && (
                                <Badge variant="secondary" className="text-xs">Verrouillé</Badge>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">Jusqu'à 3 000 000 FCFA</p>
                          </div>
                          {typePret === 'GOLD' && eligibility?.isGoldEligible && (
                            <CheckCircle2 className="h-6 w-6 text-orange-500 ml-auto" />
                          )}
                        </div>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Montant plus élevé
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Conditions préférentielles
                          </li>
                          <li className="flex items-center gap-2">
                            {!eligibility?.isGoldEligible ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                            )}
                            Réservé aux membres Silver remboursés
                          </li>
                        </ul>
                        
                        {!eligibility?.isGoldEligible && (
                          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                              <div className="text-xs text-red-700 dark:text-red-400">
                                <p className="font-semibold">Conditions non remplies :</p>
                                <ul className="mt-1 space-y-1">
                                  {eligibility?.ineligibilityReasons.map((reason, i) => (
                                    <li key={i}>• {reason}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  {errors.typePret && (
                    <p className="text-sm text-destructive">{errors.typePret}</p>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
              <Button variant="ghost" asChild className="w-full sm:w-auto">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
              <Button onClick={handleNextStep} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Loan Amount */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Montant du prêt</CardTitle>
              <CardDescription>
                {typePret === 'SILVER' 
                  ? 'Choisissez un montant entre 500 000 et 1 000 000 FCFA'
                  : 'Choisissez un montant entre 1 000 001 et 3 000 000 FCFA'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="montant">Montant souhaité (FCFA)</Label>
                <Input
                  id="montant"
                  type="number"
                  value={montant}
                  onChange={(e) => {
                    setMontant(Number(e.target.value));
                    setErrors({});
                  }}
                  min={typePret === 'SILVER' ? 500000 : 1000001}
                  max={typePret === 'SILVER' ? 1000000 : 3000000}
                  step={50000}
                  className="text-lg"
                />
                {errors.montant && (
                  <p className="text-sm text-destructive">{errors.montant}</p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex flex-wrap gap-2">
                {typePret === 'SILVER' ? (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setMontant(500000)}>500 000</Button>
                    <Button variant="outline" size="sm" onClick={() => setMontant(750000)}>750 000</Button>
                    <Button variant="outline" size="sm" onClick={() => setMontant(1000000)}>1 000 000</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setMontant(1500000)}>1 500 000</Button>
                    <Button variant="outline" size="sm" onClick={() => setMontant(2000000)}>2 000 000</Button>
                    <Button variant="outline" size="sm" onClick={() => setMontant(2500000)}>2 500 000</Button>
                    <Button variant="outline" size="sm" onClick={() => setMontant(3000000)}>3 000 000</Button>
                  </>
                )}
              </div>

              {/* Loan Summary */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">Récapitulatif</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant demandé</span>
                      <span className="font-semibold">{formatFCFA(loanDetails.montant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avance (10%)</span>
                      <span className="font-semibold text-orange-500">-{formatFCFA(loanDetails.avance)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant net à recevoir</span>
                      <span className="font-bold text-green-600">{formatFCFA(loanDetails.montantNet)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mensualité</span>
                      <span className="font-semibold">{formatFCFA(loanDetails.mensualite)}/mois</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Durée estimée</span>
                      <span className="font-semibold">{loanDetails.dureeMois} mois</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(1)} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button onClick={handleNextStep} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Members Form */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ajoutez vos 10 membres</CardTitle>
                  <CardDescription>Les membres qui garantiront votre prêt</CardDescription>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {completedMembres}/10 complétés
                </Badge>
              </div>
              <Progress value={(completedMembres / 10) * 100} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Member Navigation */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                {membres.map((membre, index) => {
                  const isComplete = Object.keys(validateMembre(membre)).length === 0 && membre.prenom;
                  const isCurrent = index === currentMembreIndex;
                  
                  return (
                    <Button
                      key={index}
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      className={`w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm ${isComplete && !isCurrent ? 'bg-green-100 text-green-700 border-green-300' : ''}`}
                      onClick={() => setCurrentMembreIndex(index)}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        index + 1
                      )}
                    </Button>
                  );
                })}
              </div>

              {/* Current Member Form */}
              <Card className="border-2">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Membre {currentMembreIndex + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Prénom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          placeholder="Prénom"
                          value={membres[currentMembreIndex].prenom}
                          onChange={(e) => handleMembreChange('prenom', e.target.value)}
                        />
                      </div>
                      {errors[`membre_${currentMembreIndex}_prenom`] && (
                        <p className="text-sm text-destructive">{errors[`membre_${currentMembreIndex}_prenom`]}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Nom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          placeholder="Nom"
                          value={membres[currentMembreIndex].nom}
                          onChange={(e) => handleMembreChange('nom', e.target.value)}
                        />
                      </div>
                      {errors[`membre_${currentMembreIndex}_nom`] && (
                        <p className="text-sm text-destructive">{errors[`membre_${currentMembreIndex}_nom`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Date de naissance</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-10"
                        value={membres[currentMembreIndex].dateNaissance}
                        onChange={(e) => handleMembreChange('dateNaissance', e.target.value)}
                      />
                    </div>
                    {errors[`membre_${currentMembreIndex}_dateNaissance`] && (
                      <p className="text-sm text-destructive">{errors[`membre_${currentMembreIndex}_dateNaissance`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Numéro CNI</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Numéro de carte d'identité"
                        value={membres[currentMembreIndex].numeroCNI}
                        onChange={(e) => handleMembreChange('numeroCNI', e.target.value)}
                      />
                    </div>
                    {errors[`membre_${currentMembreIndex}_numeroCNI`] && (
                      <p className="text-sm text-destructive">{errors[`membre_${currentMembreIndex}_numeroCNI`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Ex: 77 123 45 67"
                        value={membres[currentMembreIndex].telephone}
                        onChange={(e) => handleMembreChange('telephone', e.target.value)}
                      />
                    </div>
                    {errors[`membre_${currentMembreIndex}_telephone`] && (
                      <p className="text-sm text-destructive">{errors[`membre_${currentMembreIndex}_telephone`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10"
                        placeholder="Adresse complète"
                        value={membres[currentMembreIndex].adresse}
                        onChange={(e) => handleMembreChange('adresse', e.target.value)}
                      />
                    </div>
                    {errors[`membre_${currentMembreIndex}_adresse`] && (
                      <p className="text-sm text-destructive">{errors[`membre_${currentMembreIndex}_adresse`]}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentMembreIndex(Math.max(0, currentMembreIndex - 1))}
                  disabled={currentMembreIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentMembreIndex(Math.min(9, currentMembreIndex + 1))}
                  disabled={currentMembreIndex === 9}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(2)} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={handleNextStep}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                disabled={completedMembres < 10}
              >
                Continuer
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Summary */}
        {currentStep === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif de votre demande</CardTitle>
              <CardDescription>Vérifiez les informations avant de soumettre</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Loan Details */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-4">Détails du prêt</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type de prêt</span>
                      <span className="font-semibold">{typePret === 'SILVER' ? 'Prêt Silver' : 'Prêt Gold'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant demandé</span>
                      <span className="font-semibold">{formatFCFA(loanDetails.montant)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avance à payer (10%)</span>
                      <span className="font-semibold text-orange-500">{formatFCFA(loanDetails.avance)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant net à recevoir</span>
                      <span className="font-bold text-green-600">{formatFCFA(loanDetails.montantNet)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Members List */}
              <div>
                <h4 className="font-semibold mb-4">Membres ({membres.length})</h4>
                <ScrollArea className="h-64">
                  <div className="space-y-2 pr-4">
                    {membres.map((membre, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{membre.prenom} {membre.nom}</p>
                          <p className="text-sm text-muted-foreground">{membre.telephone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setCurrentStep(3)} className="w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button 
                onClick={handleSubmit}
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Soumission...
                  </>
                ) : (
                  <>
                    Soumettre la demande
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 5: Payment */}
        {currentStep === 5 && (
          <Card>
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-4 flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-orange-500" />
              </div>
              <CardTitle className="text-2xl">Paiement de l'avance</CardTitle>
              <CardDescription>
                Payez {formatFCFA(loanDetails.avance)} pour finaliser votre demande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentSuccess ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Paiement réussi !</h3>
                  <p className="text-muted-foreground mb-6">
                    Votre demande a été soumise avec succès. Elle sera examinée sous 48 heures.
                  </p>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/dashboard">
                      Retour au tableau de bord
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Montant de l'avance (10%)</span>
                          <span className="font-bold text-lg">{formatFCFA(loanDetails.avance)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Référence</span>
                          <span className="font-mono">JAANGO-{Date.now().toString(36).toUpperCase()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Simulated Payment Methods */}
                  <div className="grid gap-3">
                    <Button 
                      variant="outline" 
                      className="h-16 justify-start px-4"
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500 mr-4 flex items-center justify-center text-white font-bold">
                        O
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Orange Money</p>
                        <p className="text-sm text-muted-foreground">Paiement via Orange Money</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 justify-start px-4"
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-500 mr-4 flex items-center justify-center text-white font-bold">
                        W
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Wave</p>
                        <p className="text-sm text-muted-foreground">Paiement via Wave</p>
                      </div>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 justify-start px-4"
                      onClick={handlePayment}
                      disabled={paymentProcessing}
                    >
                      <div className="w-10 h-10 rounded-full bg-green-500 mr-4 flex items-center justify-center text-white font-bold">
                        F
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Free Money</p>
                        <p className="text-sm text-muted-foreground">Paiement via Free Money</p>
                      </div>
                    </Button>
                  </div>

                  {paymentProcessing && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Traitement du paiement en cours...</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}

export default function DemandePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    }>
      <DemandePageContent />
    </Suspense>
  );
}
