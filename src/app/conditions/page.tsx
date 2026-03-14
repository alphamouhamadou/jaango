'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function ConditionsPage() {
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
              <FileText className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground">
              Dernière mise à jour : Janvier 2025
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <h2 className="text-xl font-semibold mb-4">1. Objet</h2>
                <p className="text-muted-foreground mb-6">
                  Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir les 
                  modalités et conditions d'utilisation de la plateforme Jaango, ainsi que de définir 
                  les droits et obligations des parties dans ce cadre. En utilisant Jaango, vous 
                  acceptez sans réserve les présentes CGU.
                </p>

                <h2 className="text-xl font-semibold mb-4">2. Définitions</h2>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li><strong>Jaango</strong> : Plateforme de gestion de prêts communautaires accessible via le site web et l'application mobile.</li>
                  <li><strong>Utilisateur</strong> : Toute personne physique inscrite sur la plateforme Jaango.</li>
                  <li><strong>Prêt Silver</strong> : Prêt d'un montant compris entre 500 000 et 1 000 000 FCFA.</li>
                  <li><strong>Prêt Gold</strong> : Prêt d'un montant compris entre 1 000 001 et 3 000 000 FCFA, réservé aux membres éligibles.</li>
                  <li><strong>Membres garants</strong> : Les 10 personnes désignées par l'emprunteur pour garantir son prêt.</li>
                  <li><strong>Avance</strong> : Frais de 10% du montant du prêt, payables avant le décaissement.</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">3. Conditions d'inscription</h2>
                <p className="text-muted-foreground mb-4">
                  Pour s'inscrire sur Jaango, l'utilisateur doit :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    Être une personne physique majeure (18 ans et plus)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    Résider au Sénégal
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    Disposer d'une pièce d'identité valide (CNI)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    Fournir des informations exactes et complètes
                  </li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">4. Modalités des prêts</h2>
                <h3 className="font-semibold mb-2">4.1 Types de prêts</h3>
                <p className="text-muted-foreground mb-4">
                  Jaango propose deux types de prêts :
                </p>
                <ul className="text-muted-foreground mb-4 space-y-2">
                  <li><strong>Prêt Silver</strong> : Accessible à tous les membres inscrits, montant de 500 000 à 1 000 000 FCFA.</li>
                  <li><strong>Prêt Gold</strong> : Réservé aux membres ayant remboursé au moins un prêt Silver, montant de 1 000 001 à 3 000 000 FCFA.</li>
                </ul>

                <h3 className="font-semibold mb-2">4.2 Avance obligatoire</h3>
                <p className="text-muted-foreground mb-4">
                  Tout prêt est soumis au paiement d'une avance de 10% du montant demandé. Cette avance 
                  doit être payée avant que la demande ne soit examinée par l'administration.
                </p>

                <h3 className="font-semibold mb-2">4.3 Membres garants</h3>
                <p className="text-muted-foreground mb-4">
                  Chaque demande de prêt doit inclure 10 membres garants. Ces membres doivent fournir 
                  leurs informations personnelles (nom, prénom, date de naissance, numéro CNI, téléphone, 
                  adresse). Ils s'engagent à soutenir l'emprunteur dans son projet.
                </p>

                <h3 className="font-semibold mb-2">4.4 Remboursement</h3>
                <p className="text-muted-foreground mb-4">
                  Le remboursement s'effectue par mensualités fixes de 100 000 FCFA. L'emprunteur peut 
                  effectuer des remboursements anticipés sans pénalité. Le non-respect des échéances 
                  peut entraîner des pénalités et affecter l'éligibilité future.
                </p>

                <h2 className="text-xl font-semibold mb-4">5. Obligations de l'utilisateur</h2>
                <p className="text-muted-foreground mb-4">
                  L'utilisateur s'engage à :
                </p>
                <ul className="text-muted-foreground mb-6 space-y-2">
                  <li>Fournir des informations exactes et à jour</li>
                  <li>Ne pas créer de comptes multiples</li>
                  <li>Respecter les engagements de remboursement</li>
                  <li>Ne pas utiliser la plateforme à des fins frauduleuses</li>
                  <li>Signaler toute activité suspecte à l'administration</li>
                </ul>

                <h2 className="text-xl font-semibold mb-4">6. Responsabilités</h2>
                <p className="text-muted-foreground mb-4">
                  Jaango s'engage à traiter les demandes dans les meilleurs délais, à garantir la 
                  confidentialité des données personnelles, et à assurer la sécurité des transactions. 
                  Cependant, Jaango ne peut être tenu responsable des dommages indirects liés à 
                  l'utilisation de la plateforme.
                </p>

                <h2 className="text-xl font-semibold mb-4">7. Confidentialité</h2>
                <p className="text-muted-foreground mb-4">
                  Les données personnelles des utilisateurs sont traitées conformément à notre 
                  <Link href="/confidentialite" className="text-green-600 hover:underline ml-1">Politique de Confidentialité</Link>.
                  Jaango s'engage à protéger ces données et à ne pas les divulguer à des tiers 
                  sans consentement, sauf obligation légale.
                </p>

                <h2 className="text-xl font-semibold mb-4">8. Suspension et résiliation</h2>
                <p className="text-muted-foreground mb-4">
                  Jaango se réserve le droit de suspendre ou de résilier le compte d'un utilisateur 
                  en cas de non-respect des CGU, de fraude, ou de comportement nuisible à la 
                  communauté. L'utilisateur peut également demander la suppression de son compte.
                </p>

                <h2 className="text-xl font-semibold mb-4">9. Modifications</h2>
                <p className="text-muted-foreground mb-4">
                  Jaango se réserve le droit de modifier les présentes CGU à tout moment. Les 
                  utilisateurs seront informés des modifications par notification sur la plateforme. 
                  L'utilisation continue de la plateforme vaut acceptation des nouvelles CGU.
                </p>

                <h2 className="text-xl font-semibold mb-4">10. Contact</h2>
                <p className="text-muted-foreground">
                  Pour toute question relative aux présentes CGU, vous pouvez nous contacter à 
                  l'adresse email : <a href="mailto:contact@jaango.sn" className="text-green-600 hover:underline">contact@jaango.sn</a> ou 
                  via notre <Link href="/contact" className="text-green-600 hover:underline">formulaire de contact</Link>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptance */}
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              En utilisant Jaango, vous reconnaissez avoir lu, compris et accepté les présentes Conditions Générales d'Utilisation.
            </p>
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/inscription">Créer un compte</Link>
            </Button>
          </div>
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
