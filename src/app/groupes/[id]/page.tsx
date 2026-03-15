'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, ArrowLeft, Settings, BadgeCheck, AlertCircle,
  Clock, TrendingUp, Wallet, Calendar, CheckCircle,
  Play, ChevronRight, Crown, Phone, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  NIVEAUX_PRET, formatCFA, DUREE_CYCLE_MOIS, 
  MONTANT_CARTE_GROUPE, NB_MEMBRES_GROUPE 
} from '@/lib/groupe-helpers';

interface Membre {
  id: string;
  position: number;
  estChef: boolean;
  statut: string;
  user: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
    adresse: string;
  };
}

interface Cycle {
  id: string;
  niveau: string;
  numeroCycle: number;
  montantPret: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
  moisPayes: number;
  montantTotalPaye: number;
  totalMensuel: number;
  remboursementMensuel: number;
  epargneMensuelle: number;
}

interface Groupe {
  id: string;
  nom: string;
  description: string | null;
  statut: string;
  niveauActuel: string;
  cartePayee: boolean;
  createdAt: string;
  membres: Membre[];
  cycles: Cycle[];
}

interface Stats {
  nbMembres: number;
  estComplet: boolean;
  cycleActif: Cycle | null;
  totalEpargne: number;
  peutDemarrerCycle: boolean;
}

const statutLabels: Record<string, { label: string; color: string }> = {
  EN_FORMATION: { label: 'En formation', color: 'bg-yellow-500' },
  COMPLET: { label: 'Complet', color: 'bg-blue-500' },
  VALIDEE: { label: 'Validé', color: 'bg-green-500' },
  ACTIF: { label: 'Actif', color: 'bg-emerald-500' },
  SUSPENDU: { label: 'Suspendu', color: 'bg-red-500' },
  DISSOUT: { label: 'Dissous', color: 'bg-gray-500' },
};

export default function GroupeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [groupe, setGroupe] = useState<Groupe | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [eligibilite, setEligibilite] = useState<{
    estEligible: boolean;
    verification: Record<string, boolean>;
    prochainNiveau: string | null;
    raisonIneligibilite: string | null;
  } | null>(null);

  useEffect(() => {
    fetchGroupe();
    fetchEligibilite();
  }, [params.id]);

  const fetchGroupe = async () => {
    try {
      const res = await fetch(`/api/groupes/${params.id}`);
      const data = await res.json();
      
      if (data.groupe) {
        setGroupe(data.groupe);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibilite = async () => {
    try {
      const res = await fetch(`/api/groupes/${params.id}/eligibilite`);
      const data = await res.json();
      setEligibilite(data);
    } catch (error) {
      console.error('Erreur éligibilité:', error);
    }
  };

  const getNiveauInfo = (niveau: string) => {
    return NIVEAUX_PRET[niveau as keyof typeof NIVEAUX_PRET] || NIVEAUX_PRET.BRONZE;
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!groupe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Groupe non trouvé</h2>
          <Button onClick={() => router.push('/groupes')} className="mt-4">
            Retour aux groupes
          </Button>
        </div>
      </div>
    );
  }

  const niveauInfo = getNiveauInfo(groupe.niveauActuel);
  const statutInfo = statutLabels[groupe.statut] || statutLabels.EN_FORMATION;
  const cycleActif = stats?.cycleActif;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/groupes')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux groupes
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{groupe.nom}</h1>
                <Badge 
                  style={{ backgroundColor: niveauInfo.couleur }}
                  className="text-white"
                >
                  {niveauInfo.nom}
                </Badge>
              </div>
              {groupe.description && (
                <p className="mt-2 text-blue-100">{groupe.description}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statutInfo.color} text-white`}>
                {statutInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Statistiques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Membres</span>
              </div>
              <p className="text-2xl font-bold">
                {stats?.nbMembres} / {NB_MEMBRES_GROUPE}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Wallet className="h-4 w-4" />
                <span className="text-sm">Prêt actuel</span>
              </div>
              <p className="text-2xl font-bold">{formatCFA(niveauInfo.montant)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Épargne totale</span>
              </div>
              <p className="text-2xl font-bold">{formatCFA(stats?.totalEpargne || 0)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Cycles</span>
              </div>
              <p className="text-2xl font-bold">{groupe.cycles.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Cycle en cours */}
        {cycleActif && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Cycle {cycleActif.numeroCycle} en cours - {cycleActif.niveau}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progression des paiements</span>
                    <span>{cycleActif.moisPayes} / {DUREE_CYCLE_MOIS} mois</span>
                  </div>
                  <Progress 
                    value={(cycleActif.moisPayes / DUREE_CYCLE_MOIS) * 100} 
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Montant prêté</p>
                    <p className="font-semibold">{formatCFA(cycleActif.montantPret)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Mensualité totale</p>
                    <p className="font-semibold">{formatCFA(cycleActif.totalMensuel)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total payé</p>
                    <p className="font-semibold text-green-600">{formatCFA(cycleActif.montantTotalPaye)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date de fin</p>
                    <p className="font-semibold">
                      {new Date(cycleActif.dateFin).toLocaleDateString('fr-SN')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carte de groupe */}
        {!groupe.cartePayee && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800">Carte de groupe non payée</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Payez la carte de groupe ({formatCFA(MONTANT_CARTE_GROUPE)}) pour pouvoir démarrer votre premier cycle.
                  </p>
                  <Button className="mt-3" variant="outline">
                    Payer la carte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Éligibilité au prochain cycle */}
        {eligibilite && !cycleActif && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {eligibilite.estEligible ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                Prochain cycle
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eligibilite.estEligible ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span>Le groupe est éligible pour démarrer un nouveau cycle</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Prochain niveau</p>
                      <p className="font-semibold text-lg">{eligibilite.prochainNiveau}</p>
                    </div>
                    <Button>
                      <Play className="h-4 w-4 mr-2" />
                      Démarrer le cycle
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-yellow-50 rounded-lg text-yellow-700">
                    {eligibilite.raisonIneligibilite}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Conditions à remplir :</p>
                    {Object.entries(eligibilite.verification).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {value ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={value ? 'text-green-700' : 'text-red-700'}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Membres du groupe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres du groupe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {groupe.membres.map((membre, index) => (
                <div 
                  key={membre.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                    {membre.position}
                  </div>
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(membre.user.prenom, membre.user.nom)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {membre.user.prenom} {membre.user.nom}
                      </p>
                      {membre.estChef && (
                        <Badge variant="secondary" className="text-xs">
                          <Crown className="h-3 w-3 mr-1" />
                          Chef
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {membre.user.telephone}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Historique des cycles */}
        {groupe.cycles.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des cycles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {groupe.cycles.map((cycle) => (
                  <div 
                    key={cycle.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Badge style={{ backgroundColor: getNiveauInfo(cycle.niveau).couleur }} className="text-white">
                        {cycle.niveau}
                      </Badge>
                      <div>
                        <p className="font-medium">Cycle {cycle.numeroCycle}</p>
                        <p className="text-sm text-gray-500">
                          {formatCFA(cycle.montantPret)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={cycle.statut === 'TERMINE' ? 'default' : 'secondary'}>
                        {cycle.statut}
                      </Badge>
                      <p className="text-sm text-gray-500 mt-1">
                        {cycle.moisPayes}/{DUREE_CYCLE_MOIS} mois
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
