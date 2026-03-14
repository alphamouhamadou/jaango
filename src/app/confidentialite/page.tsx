'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, UserCheck } from 'lucide-react';

export default function ConfidentialitePage() {
  const dataTypes = [
    {
      icon: <UserCheck className="h-6 w-6 text-green-600" />,
      title: "Données d'identité",
      description: "Nom, prénom, date de naissance, numéro CNI, adresse"
    },
    {
      icon: <Lock className="h-6 w-6 text-orange-500" />,
      title: "Données de contact",
      description: "Numéro de téléphone, adresse email (si fournie)"
    },
    {
      icon: <Database className="h-6 w-6 text-blue-500" />,
      title: "Données financières",
      description: "Historique des prêts, remboursements, transactions"
    },
    {
      icon: <Eye className="h-6 w-6 text-purple-500" />,
      title: "Données d'utilisation",
      description: "Logs de connexion, préférences, interactions avec la plateforme"
    }
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : Janvier 2025
            </p>
          </div>

          {/* Introduction */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Chez Jaango, nous attachons une grande importance à la protection de vos données 
                personnelles. Cette politique de confidentialité explique comment nous collectons, 
                utilisons, stockons et protégeons vos informations lorsque vous utilisez notre 
                plateforme de prêts communautaires.
              </p>
            </CardContent>
          </Card>

          {/* Data Types */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-6">Données collectées</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {dataTypes.map((type, index) => (
                <Card key={index} className="card-hover">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {type.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{type.title}</h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Detailed Policy */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h2 className="text-xl font-semibold mb-4">1. Finalité de la collecte</h2>
                <p className="text-muted-foreground mb-4">
                  Vos données personnelles sont collectées pour les finalités suivantes :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>Gestion de votre compte utilisateur</li>
                  <li>Traitement des demandes de prêt</li>
                  <li>Gestion des remboursements et transactions</li>
                  <li>Communication avec vous (notifications, alertes)</li>
                  <li>Amélioration de nos services</li>
                  <li>Respect de nos obligations légales</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">2. Base légale du traitement</h2>
                <p className="text-muted-foreground mb-6">
                  Le traitement de vos données personnelles est fondé sur :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>L'exécution du contrat de prêt</li>
                  <li>Votre consentement pour les communications marketing</li>
                  <li>Nos obligations légales (lutte contre le blanchiment, etc.)</li>
                  <li>Notre intérêt légitime pour améliorer nos services</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">3. Destinataires des données</h2>
                <p className="text-muted-foreground mb-4">
                  Vos données peuvent être partagées avec :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>Les membres garants de vos prêts (informations limitées)</li>
                  <li>Nos prestataires techniques (hébergement, paiement)</li>
                  <li>Les autorités compétentes si requis par la loi</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  Nous ne vendons jamais vos données à des tiers.
                </p>

                <h2 className="text-xl font-semibold mb-4">4. Durée de conservation</h2>
                <p className="text-muted-foreground mb-4">
                  Vos données sont conservées pendant la durée de votre relation contractuelle 
                  avec Jaango, et pour les durées imposées par la loi (notamment 5 ans après 
                  la fin de la relation commerciale pour les données financières, conformément 
                  aux obligations de lutte contre le blanchiment).
                </p>

                <h2 className="text-xl font-semibold mb-4">5. Sécurité des données</h2>
                <p className="text-muted-foreground mb-4">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées 
                  pour protéger vos données :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>Chiffrement des données en transit et au repos</li>
                  <li>Authentification sécurisée</li>
                  <li>Accès restreint aux données personnelles</li>
                  <li>Surveillance et audit réguliers</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">6. Vos droits</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément à la réglementation applicable, vous disposez des droits suivants :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li><strong>Droit d'accès</strong> : Obtenir une copie de vos données</li>
                  <li><strong>Droit de rectification</strong> : Corriger vos données inexactes</li>
                  <li><strong>Droit à l'effacement</strong> : Demander la suppression de vos données</li>
                  <li><strong>Droit à la limitation</strong> : Restreindre le traitement</li>
                  <li><strong>Droit à la portabilité</strong> : Recevoir vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition</strong> : Vous opposer au traitement</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  Pour exercer ces droits, contactez-nous à : 
                  <a href="mailto:privacy@jaango.sn" className="text-green-600 hover:underline ml-1">privacy@jaango.sn</a>
                </p>

                <h2 className="text-xl font-semibold mb-4">7. Cookies et traceurs</h2>
                <p className="text-muted-foreground mb-4">
                  Jaango utilise des cookies pour :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>Assurer le bon fonctionnement de la plateforme (session, sécurité)</li>
                  <li>Mémoriser vos préférences (thème, langue)</li>
                  <li>Analyser l'utilisation de la plateforme (statistiques anonymes)</li>
                </ul>
                <p className="text-muted-foreground mb-4">
                  Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela 
                  peut affecter le fonctionnement de la plateforme.
                </p>

                <h2 className="text-xl font-semibold mb-4">8. Modifications</h2>
                <p className="text-muted-foreground mb-4">
                  Nous nous réservons le droit de modifier cette politique à tout moment. 
                  Les utilisateurs seront informés des modifications significatives par 
                  notification sur la plateforme.
                </p>

                <h2 className="text-xl font-semibold mb-4">9. Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question relative à cette politique ou à vos données personnelles, 
                  contactez notre Délégué à la Protection des Données à : 
                  <a href="mailto:dpo@jaango.sn" className="text-green-600 hover:underline ml-1">dpo@jaango.sn</a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* User Rights Card */}
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-orange-50 dark:from-green-900/20 dark:to-orange-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Bell className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Exercez vos droits</h3>
                  <p className="text-muted-foreground mb-4">
                    Pour accéder, modifier ou supprimer vos données personnelles, contactez-nous 
                    ou utilisez votre espace personnel sur la plateforme.
                  </p>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/contact">Nous contacter</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t mt-12">
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
