'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Users, Heart, Target, Award, Globe, Sparkles } from 'lucide-react';

export default function AProposPage() {
  const values = [
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Confiance",
      description: "Nous construisons des relations basées sur la transparence et l'intégrité. Chaque transaction est sécurisée et traçable."
    },
    {
      icon: <Users className="h-8 w-8 text-orange-500" />,
      title: "Solidarité",
      description: "Notre système de prêt communautaire renforce les liens sociaux et permet l'entraide entre membres d'une même communauté."
    },
    {
      icon: <Heart className="h-8 w-8 text-red-500" />,
      title: "Engagement",
      description: "Nous sommes engagés à soutenir l'entrepreneuriat local et le développement économique au Sénégal."
    },
    {
      icon: <Target className="h-8 w-8 text-blue-500" />,
      title: "Innovation",
      description: "Nous utilisons la technologie pour simplifier l'accès au crédit et offrir une expérience utilisateur optimale."
    }
  ];

  const stats = [
    { value: "5000+", label: "Utilisateurs" },
    { value: "2000+", label: "Prêts accordés" },
    { value: "1.5M", label: "FCFA distribués" },
    { value: "98%", label: "Taux de remboursement" }
  ];

  return (
    <div className="min-h-screen bg-background">
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
            
            <Button variant="ghost" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-6 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Notre Histoire
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            À propos de <span className="gradient-text">Jaango</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Une plateforme innovante de prêts communautaires qui transforme la façon dont les Sénégalais 
            accèdent au crédit pour réaliser leurs projets.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Notre Mission</h2>
                <p className="text-muted-foreground mb-4">
                  Jaango est né d'une conviction simple : l'accès au crédit ne devrait pas être un privilège 
                  réservé à quelques-uns, mais une opportunité accessible à tous ceux qui ont un projet et 
                  la détermination de le réaliser.
                </p>
                <p className="text-muted-foreground mb-4">
                  Au Sénégal, de nombreux entrepreneurs et particuliers font face à des difficultés pour 
                  obtenir des financements auprès des institutions traditionnelles. Les garanties exigées 
                  sont souvent hors de portée, et les procédures peuvent être longues et complexes.
                </p>
                <p className="text-muted-foreground">
                  C'est pourquoi nous avons créé Jaango, une solution basée sur la solidarité communautaire, 
                  où chaque membre peut bénéficier du soutien de son entourage pour accéder au crédit.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center">
                  <Globe className="h-32 w-32 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl md:text-5xl font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Nos Valeurs</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des principes qui guident chacune de nos actions
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <Card key={index} className="card-hover text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-orange-500">
        <div className="container mx-auto px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Comment ça marche ?</h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Notre système de prêt communautaire repose sur la confiance et la solidarité entre membres.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Communauté</h3>
              <p className="text-sm text-white/80">
                Réunissez 10 membres de confiance qui garantiront votre prêt
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
                <Award className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Validation</h3>
              <p className="text-sm text-white/80">
                Payez l'avance de 10% et notre équipe valide votre demande
              </p>
            </div>
            <div>
              <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Sécurité</h3>
              <p className="text-sm text-white/80">
                Recevez vos fonds et remboursez selon un échéancier clair
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Notre Équipe</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une équipe passionnée et dévouée à votre service
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { name: "Amadou Diallo", role: "Directeur Général" },
              { name: "Fatou Ndiaye", role: "Responsable Opérations" },
              { name: "Moussa Sow", role: "Responsable Technique" }
            ].map((member, index) => (
              <Card key={index} className="card-hover text-center">
                <CardContent className="pt-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-orange-500 mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto bg-muted/50">
            <CardContent className="pt-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Prêt à rejoindre Jaango ?</h2>
              <p className="text-muted-foreground mb-6">
                Créez votre compte dès maintenant et accédez aux prêts communautaires.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/inscription">Créer un compte</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/contact">Nous contacter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
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
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/conditions" className="hover:text-foreground transition-colors">
                Conditions
              </Link>
              <Link href="/confidentialite" className="hover:text-foreground transition-colors">
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
