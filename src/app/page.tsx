'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield, 
  Users, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Wallet, 
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store';

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Use queueMicrotask to defer state update outside of effect sync execution
    // This is the standard pattern for hydration with next-themes
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          useAuthStore.getState().setUser(data.user);
        } else {
          useAuthStore.getState().setUser(null);
        }
      })
      .catch(() => {
        useAuthStore.getState().setUser(null);
      });
  }, []);

  const steps = [
    {
      icon: <Users className="h-8 w-8 text-green-600" />,
      title: "Créez votre compte",
      description: "Inscrivez-vous en quelques minutes avec vos informations personnelles"
    },
    {
      icon: <Wallet className="h-8 w-8 text-orange-500" />,
      title: "Choisissez votre prêt",
      description: "Sélectionnez entre Silver ou Gold selon vos besoins"
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Ajoutez 10 membres",
      description: "Constituez votre groupe de garant avec 10 membres de confiance"
    },
    {
      icon: <CheckCircle2 className="h-8 w-8 text-orange-500" />,
      title: "Recevez vos fonds",
      description: "Après validation, recevez votre prêt rapidement"
    }
  ];

  const advantages = [
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Taux attractifs",
      description: "Des conditions de prêt avantageuses pour votre projet"
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Processus rapide",
      description: "Obtenez une réponse sous 48 heures"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurisé",
      description: "Vos données sont protégées et confidentielles"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Solidaire",
      description: "Un système de prêt basé sur l'entraide communautaire"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/logo.jpg" 
                alt="Jaango Logo" 
                className="w-10 h-10 rounded-lg object-cover"
              />
              <span className="text-2xl font-bold gradient-text">Jaango</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#comment-ca-marche" className="text-muted-foreground hover:text-foreground transition-colors">
                Comment ça marche
              </Link>
              <Link href="#prets" className="text-muted-foreground hover:text-foreground transition-colors">
                Nos prêts
              </Link>
              <Link href="#avantages" className="text-muted-foreground hover:text-foreground transition-colors">
                Avantages
              </Link>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              {isAuthenticated ? (
                <>
                  {user?.role === 'ADMIN' && (
                    <Button variant="outline" asChild>
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/dashboard">
                      Tableau de bord
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/connexion">Connexion</Link>
                  </Button>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/inscription">
                      Inscription
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t mt-4">
              <div className="flex flex-col gap-4">
                <Link 
                  href="#comment-ca-marche" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Comment ça marche
                </Link>
                <Link 
                  href="#prets" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Nos prêts
                </Link>
                <Link 
                  href="#avantages" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Avantages
                </Link>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  {mounted && (
                    <Button
                      variant="ghost"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="justify-start"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="h-5 w-5 mr-2" /> Mode clair
                        </>
                      ) : (
                        <>
                          <Moon className="h-5 w-5 mr-2" /> Mode sombre
                        </>
                      )}
                    </Button>
                  )}
                  {isAuthenticated ? (
                    <>
                      {user?.role === 'ADMIN' && (
                        <Button variant="outline" asChild className="w-full">
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </Link>
                        </Button>
                      )}
                      <Button asChild className="bg-green-600 hover:bg-green-700 w-full">
                        <Link href="/dashboard">
                          Tableau de bord
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" asChild>
                        <Link href="/connexion">Connexion</Link>
                      </Button>
                      <Button asChild className="bg-green-600 hover:bg-green-700">
                        <Link href="/inscription">Inscription</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              <Sparkles className="h-3 w-3 mr-1" />
              Plateforme de prêts communautaires
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Financez vos projets avec{' '}
              <span className="gradient-text">Jaango</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Une solution simple, transparente et sécurisée pour vos prêts communautaires. 
              Accédez à des fonds pour réaliser vos rêves.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 btn-animate">
                <Link href={isAuthenticated ? "/demande" : "/inscription"}>
                  {isAuthenticated ? "Faire une demande" : "Commencer maintenant"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#comment-ca-marche">
                  En savoir plus
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un processus simple en 4 étapes pour obtenir votre prêt communautaire
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="relative card-hover">
                <CardHeader>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-orange-500 text-white flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="mb-4">{step.icon}</div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">{step.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Types de prêts */}
      <section id="prets" className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nos types de prêts
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choisissez le prêt adapté à vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Silver Card */}
            <Card className="card-hover border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-gray-300 to-gray-400" />
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-gray-500" />
                </div>
                <CardTitle className="text-2xl">Prêt Silver</CardTitle>
                <CardDescription>Premier prêt pour démarrer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-300">1 000 000 FCFA</p>
                  <p className="text-sm text-muted-foreground">Montant maximum</p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Conditions d'accès simples",
                    "Remboursement 100 000 FCFA/mois",
                    "Frais d'avance 10%",
                    "Durée jusqu'à 10 mois",
                    "Accès au prêt Gold après remboursement"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full bg-gray-600 hover:bg-gray-700">
                  <Link href={isAuthenticated ? "/demande?type=silver" : "/inscription"}>
                    Choisir Silver
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Gold Card */}
            <Card className="card-hover border-2 border-orange-300 dark:border-orange-700 overflow-hidden relative">
              <div className="absolute top-4 right-4">
                <Badge className="bg-orange-500 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              <div className="h-2 bg-gradient-to-r from-orange-400 to-yellow-400" />
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 mx-auto mb-4 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-orange-500" />
                </div>
                <CardTitle className="text-2xl">Prêt Gold</CardTitle>
                <CardDescription>Pour les membres confirmés</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">3 000 000 FCFA</p>
                  <p className="text-sm text-muted-foreground">Montant maximum</p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Réservé aux membres Silver remboursés",
                    "Remboursement 100 000 FCFA/mois",
                    "Frais d'avance 10%",
                    "Durée jusqu'à 30 mois",
                    "Conditions préférentielles"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full bg-orange-500 hover:bg-orange-600">
                  <Link href={isAuthenticated ? "/demande?type=gold" : "/inscription"}>
                    Choisir Gold
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section id="avantages" className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pourquoi choisir Jaango ?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des avantages qui font la différence
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((advantage, index) => (
              <Card key={index} className="text-center card-hover">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center text-green-600 dark:text-green-400">
                    {advantage.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{advantage.title}</h3>
                  <p className="text-sm text-muted-foreground">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-green-600 to-orange-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à démarrer votre projet ?
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Rejoignez des milliers de personnes qui ont déjà fait confiance à Jaango pour financer leurs projets.
          </p>
          <Button asChild size="lg" variant="secondary" className="btn-animate">
            <Link href={isAuthenticated ? "/demande" : "/inscription"}>
              {isAuthenticated ? "Faire une demande" : "Créer un compte"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-6">
            {/* Logo and copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/logo.jpg" 
                  alt="Jaango Logo" 
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <span className="font-semibold gradient-text">Jaango</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                © {new Date().getFullYear()} Jaango. Tous droits réservés.
              </p>
            </div>
            
            {/* Footer Links - Grid for mobile */}
            <div className="grid grid-cols-2 sm:flex items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/conditions" className="hover:text-foreground transition-colors text-center">
                Conditions
              </Link>
              <Link href="/confidentialite" className="hover:text-foreground transition-colors text-center">
                Confidentialité
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors text-center">
                Contact
              </Link>
              <Link href="/a-propos" className="hover:text-foreground transition-colors text-center">
                À propos
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
