'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  Gem,
  Crown,
  Star,
  Users,
  AlertCircle,
  Lock,
  Info
} from 'lucide-react';
import { 
  NIVEAUX_PRET, 
  NB_MEMBRES_GROUPE,
  DUREE_CYCLE_MOIS,
  MONTANT_CARTE_GROUPE,
  EPARGNE_MENSUELLE_MEMBRE,
  CONTRIBUTION_MENSUELLE_MEMBRE,
  formatCFA,
  type NiveauPret 
} from '@/lib/groupe-helpers';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

// Ordre des niveaux pour l'affichage
const NIVEAUX_ORDERED: NiveauPret[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMANT'];

interface EligibilityData {
  niveauActuel: NiveauPret | null;
  peutPostuler: boolean;
  prochainNiveau: NiveauPret | null;
  raisonIneligibilite: string[];
  aCycleEnCours: boolean;
  cyclesCompletes: number;
}

function DemandePageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [niveauSelectionne, setNiveauSelectionne] = useState<NiveauPret | null>(null);

  useEffect(() => {
    setMounted(true);
    
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

    const checkEligibility = async () => {
      try {
        const response = await fetch('/api/groupes/eligibilite');
        const data = await response.json();
        
        if (response.ok) {
          setEligibility(data);
          if (data.peutPostuler && data.prochainNiveau) {
            setNiveauSelectionne(data.prochainNiveau);
          }
        }
      } catch (error) {
        console.error('Failed to check eligibility:', error);
      }
      setEligibilityLoading(false);
    };

    checkAuth();
    checkEligibility();
  }, [router]);

  const getNiveauIcon = (niveau: NiveauPret) => {
    switch (niveau) {
      case 'BRONZE': return <Shield className="h-6 w-6" />;
      case 'SILVER': return <Star className="h-6 w-6" />;
      case 'GOLD': return <Sparkles className="h-6 w-6" />;
      case 'PLATINUM': return <Crown className="h-6 w-6" />;
      case 'DIAMANT': return <Gem className="h-6 w-6" />;
    }
  };

  const getNiveauColor = (niveau: NiveauPret) => {
    switch (niveau) {
      case 'BRONZE': return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600', border: 'border-amber-400' };
      case 'SILVER': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500', border: 'border-gray-400' };
      case 'GOLD': return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-600', border: 'border-yellow-400' };
      case 'PLATINUM': return { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-400', border: 'border-slate-300' };
      case 'DIAMANT': return { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-500', border: 'border-cyan-400' };
    }
  };

  const isNiveauAccessible = (niveau: NiveauPret): boolean => {
    if (!eligibility) return false;
    if (!eligibility.niveauActuel && niveau === 'BRONZE') {
      return true;
    }
    return eligibility.prochainNiveau === niveau;
  };

  const handleContinuer = () => {
    if (!niveauSelectionne) {
      toast({
        variant: 'destructive',
        title: 'Sélection requise',
        description: 'Veuillez sélectionner un niveau de prêt',
      });
      return;
    }
    router.push(`/groupes/nouveau?niveau=${niveauSelectionne}`);
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
            
            <Badge variant="outline" className="text-sm">
              Prêts Solidaires
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-5xl">
        {/* Introduction */}
        <Card className="mb-8 border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
                  Prêts Solidaires pour Groupes de 10 Femmes
                </h2>
                <p className="text-green-700 dark:text-green-300 text-sm mb-3">
                  JAANGO propose des prêts progressifs pour les groupes solidaires. Chaque groupe 
                  est composé de <strong>{NB_MEMBRES_GROUPE} femmes</strong> qui se portent garantes les unes pour les autres. 
                  Remboursement sur <strong>{DUREE_CYCLE_MOIS} mois</strong> avec épargne obligatoire.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="bg-white dark:bg-green-900/50 rounded-lg p-2 text-center">
                    <p className="font-bold text-green-700 dark:text-green-300">5 Niveaux</p>
                    <p className="text-xs text-green-600">Progressifs</p>
                  </div>
                  <div className="bg-white dark:bg-green-900/50 rounded-lg p-2 text-center">
                    <p className="font-bold text-green-700 dark:text-green-300">{formatCFA(MONTANT_CARTE_GROUPE)}</p>
                    <p className="text-xs text-green-600">Carte 1er cycle</p>
                  </div>
                  <div className="bg-white dark:bg-green-900/50 rounded-lg p-2 text-center">
                    <p className="font-bold text-green-700 dark:text-green-300">{formatCFA(EPARGNE_MENSUELLE_MEMBRE)}/mois</p>
                    <p className="text-xs text-green-600">Épargne/membre</p>
                  </div>
                  <div className="bg-white dark:bg-green-900/50 rounded-lg p-2 text-center">
                    <p className="font-bold text-green-700 dark:text-green-300">{DUREE_CYCLE_MOIS} mois</p>
                    <p className="text-xs text-green-600">Durée du cycle</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélection du niveau */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Choisissez votre niveau de prêt</CardTitle>
            <CardDescription>
              Sélectionnez le niveau adapté à votre groupe. La progression est conditionnée par l'achèvement du cycle précédent.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {eligibilityLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-3 text-muted-foreground">Vérification de votre éligibilité...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Grille des niveaux */}
                <div className="grid md:grid-cols-5 gap-4">
                  {NIVEAUX_ORDERED.map((niveau) => {
                    const info = NIVEAUX_PRET[niveau];
                    const colors = getNiveauColor(niveau);
                    const accessible = isNiveauAccessible(niveau);
                    const isSelected = niveauSelectionne === niveau;
                    const contribution = CONTRIBUTION_MENSUELLE_MEMBRE[niveau];
                    
                    return (
                      <Card 
                        key={niveau}
                        className={`cursor-pointer transition-all relative overflow-hidden ${
                          isSelected 
                            ? `border-2 ${colors.border} ring-2 ring-offset-2` 
                            : accessible 
                              ? 'border hover:shadow-md' 
                              : 'opacity-50 cursor-not-allowed border-dashed'
                        }`}
                        onClick={() => {
                          if (accessible) {
                            setNiveauSelectionne(niveau);
                          }
                        }}
                      >
                        {!accessible && (
                          <div className="absolute top-2 right-2">
                            <Lock className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        
                        <CardContent className="pt-6 pb-4 text-center">
                          <div className={`w-14 h-14 rounded-full ${colors.bg} mx-auto mb-3 flex items-center justify-center ${colors.text}`}>
                            {getNiveauIcon(niveau)}
                          </div>
                          
                          <h3 className="font-bold text-lg mb-1">{info.nom}</h3>
                          <p className="text-2xl font-bold text-green-600 mb-2">
                            {formatCFA(info.montant)}
                          </p>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>Par membre: {formatCFA(info.montant / NB_MEMBRES_GROUPE)}</p>
                            <p>Mensualité: {formatCFA(contribution)}</p>
                          </div>
                          
                          {isSelected && (
                            <div className="mt-3">
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Sélectionné
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Information sur l'éligibilité */}
                {eligibility && !eligibility.peutPostuler && eligibility.raisonIneligibilite.length > 0 && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                          Conditions non remplies
                        </p>
                        <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                          {eligibility.raisonIneligibilite.map((raison, i) => (
                            <li key={i}>• {raison}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Information si niveau actuel */}
                {eligibility?.niveauActuel && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-blue-800 dark:text-blue-200">
                          Votre progression
                        </p>
                        <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                          Vous avez complété le niveau <strong>{NIVEAUX_PRET[eligibility.niveauActuel].nom}</strong>.
                          {eligibility.prochainNiveau ? (
                            <> Vous pouvez maintenant accéder au niveau <strong>{NIVEAUX_PRET[eligibility.prochainNiveau].nom}</strong>.</>
                          ) : (
                            <> Vous avez atteint le niveau maximum.</>
                          )}
                        </p>
                        {eligibility.cyclesCompletes > 0 && (
                          <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                            Cycles complétés: {eligibility.cyclesCompletes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
            <Button variant="ghost" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <Button 
              onClick={handleContinuer}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              disabled={!niveauSelectionne}
            >
              Créer mon groupe
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>

        {/* Détails des niveaux */}
        <Card>
          <CardHeader>
            <CardTitle>Détails des niveaux de prêt</CardTitle>
            <CardDescription>
              Comparez les différents niveaux et leurs conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Niveau</th>
                    <th className="text-right py-3 px-2">Montant Groupe</th>
                    <th className="text-right py-3 px-2">Par Membre</th>
                    <th className="text-right py-3 px-2">Mensualité/Membre</th>
                    <th className="text-right py-3 px-2">Total Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  {NIVEAUX_ORDERED.map((niveau) => {
                    const info = NIVEAUX_PRET[niveau];
                    const colors = getNiveauColor(niveau);
                    const contribution = CONTRIBUTION_MENSUELLE_MEMBRE[niveau];
                    const totalMensuelGroupe = info.remboursementMensuel + 50000;
                    
                    return (
                      <tr key={niveau} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center ${colors.text}`}>
                              {getNiveauIcon(niveau)}
                            </div>
                            <span className="font-medium">{info.nom}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCFA(info.montant)}</td>
                        <td className="text-right py-3 px-2">{formatCFA(info.montant / NB_MEMBRES_GROUPE)}</td>
                        <td className="text-right py-3 px-2">{formatCFA(contribution)}</td>
                        <td className="text-right py-3 px-2 text-muted-foreground">
                          {formatCFA(totalMensuelGroupe * DUREE_CYCLE_MOIS)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> La mensualité par membre inclut le remboursement du prêt + l'épargne obligatoire de {formatCFA(EPARGNE_MENSUELLE_MEMBRE)}/mois.
                L'épargne est récupérable à la fin du cycle.
              </p>
            </div>
          </CardContent>
        </Card>
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