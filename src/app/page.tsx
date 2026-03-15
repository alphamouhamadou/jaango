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
  Sun,
  Medal,
  Gem,
  Diamond
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
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Rejoignez un groupe",
      description: "Intégrez un groupe solidaire de 10 femmes"
    },
    {
      icon: <Wallet className="h-8 w-8 text-orange-500" />,
      title: "Payez la carte de groupe",
      description: "100 000 FCFA pour accéder au premier cycle"
    },
    {
      icon: <CheckCircle2 className="h-8 w-8 text-green-600" />,
      title: "Recevez votre prêt",
      description: "Accédez à des prêts de 1M à 3M FCFA sur 10 mois"
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
              Nos niveaux de financement
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              5 niveaux progressifs pour accompagner votre croissance
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
            {/* Bronze */}
            <Card className="card-hover border-2 border-amber-600 dark:border-amber-700 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-amber-600 to-amber-700" />
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 mx-auto mb-2 flex items-center justify-center">
                  <Medal className="h-6 w-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">Bronze</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-xl font-bold text-amber-600">1 000 000</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
                <p className="text-xs mt-2">150 000/mois</p>
              </CardContent>
            </Card>

            {/* Silver */}
            <Card className="card-hover border-2 border-gray-300 dark:border-gray-600 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-gray-300 to-gray-400" />
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-2 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-gray-500" />
                </div>
                <CardTitle className="text-lg">Silver</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-xl font-bold text-gray-600">1 500 000</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
                <p className="text-xs mt-2">200 000/mois</p>
              </CardContent>
            </Card>

            {/* Gold */}
            <Card className="card-hover border-2 border-yellow-400 dark:border-yellow-600 overflow-hidden relative">
              <div className="absolute top-2 right-2">
                <Badge className="bg-yellow-500 text-white text-xs">Populaire</Badge>
              </div>
              <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-500" />
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mx-auto mb-2 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </div>
                <CardTitle className="text-lg">Gold</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-xl font-bold text-yellow-600">2 000 000</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
                <p className="text-xs mt-2">250 000/mois</p>
              </CardContent>
            </Card>

            {/* Platinum */}
            <Card className="card-hover border-2 border-cyan-300 dark:border-cyan-600 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-cyan-300 to-cyan-400" />
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 mx-auto mb-2 flex items-center justify-center">
                  <Gem className="h-6 w-6 text-cyan-500" />
                </div>
                <CardTitle className="text-lg">Platinum</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-xl font-bold text-cyan-600">2 500 000</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
                <p className="text-xs mt-2">300 000/mois</p>
              </CardContent>
            </Card>

            {/* Diamant */}
            <Card className="card-hover border-2 border-blue-400 dark:border-blue-600 overflow-hidden relative">
              <div className="absolute top-2 right-2">
                <Badge className="bg-blue-500 text-white text-xs">Premium</Badge>
              </div>
              <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-500" />
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mx-auto mb-2 flex items-center justify-center">
                  <Diamond className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-lg">Diamant</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-xl font-bold text-blue-600">3 000 000</p>
                <p className="text-xs text-muted-foreground">FCFA</p>
                <p className="text-xs mt-2">350 000/mois</p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
              <Link href={isAuthenticated ? "/groupes" : "/inscription"}>
                {isAuthenticated ? "Voir les groupes" : "Créer un compte"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
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
