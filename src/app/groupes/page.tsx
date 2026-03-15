'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Plus, Search, Filter, BadgeCheck, 
  Clock, CheckCircle, AlertCircle, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { NIVEAUX_PRET, formatCFA } from '@/lib/groupe-helpers';

interface Membre {
  id: string;
  position: number;
  estChef: boolean;
  user: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
  };
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
  _count: { membres: number };
  cycles: { id: string }[];
}

const statutLabels: Record<string, { label: string; color: string }> = {
  EN_FORMATION: { label: 'En formation', color: 'bg-yellow-500' },
  COMPLET: { label: 'Complet', color: 'bg-blue-500' },
  VALIDEE: { label: 'Validé', color: 'bg-green-500' },
  ACTIF: { label: 'Actif', color: 'bg-emerald-500' },
  SUSPENDU: { label: 'Suspendu', color: 'bg-red-500' },
  DISSOUT: { label: 'Dissous', color: 'bg-gray-500' },
};

export default function GroupesPage() {
  const router = useRouter();
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('all');
  const [filtreNiveau, setFiltreNiveau] = useState<string>('all');

  useEffect(() => {
    fetchGroupes();
  }, [filtreStatut, filtreNiveau]);

  const fetchGroupes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtreStatut !== 'all') params.append('statut', filtreStatut);
      if (filtreNiveau !== 'all') params.append('niveau', filtreNiveau);

      const res = await fetch(`/api/groupes?${params}`);
      const data = await res.json();
      
      if (data.groupes) {
        setGroupes(data.groupes);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroupes = groupes.filter(g => 
    g.nom.toLowerCase().includes(search.toLowerCase()) ||
    g.membres.some(m => 
      `${m.user.prenom} ${m.user.nom}`.toLowerCase().includes(search.toLowerCase())
    )
  );

  const getNiveauInfo = (niveau: string) => {
    return NIVEAUX_PRET[niveau as keyof typeof NIVEAUX_PRET] || NIVEAUX_PRET.BRONZE;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8" />
                Groupes Solidaires
              </h1>
              <p className="mt-2 text-blue-100">
                Gérez vos groupes de 10 femmes et suivez vos cycles de financement
              </p>
            </div>
            <Button 
              onClick={() => router.push('/groupes/nouveau')}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau groupe
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un groupe ou un membre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtreStatut} onValueChange={setFiltreStatut}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_FORMATION">En formation</SelectItem>
                <SelectItem value="COMPLET">Complet</SelectItem>
                <SelectItem value="VALIDEE">Validé</SelectItem>
                <SelectItem value="ACTIF">Actif</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtreNiveau} onValueChange={setFiltreNiveau}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                {Object.entries(NIVEAUX_PRET).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.nom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Liste des groupes */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">Chargement des groupes...</p>
          </div>
        ) : filteredGroupes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Aucun groupe trouvé</h3>
            <p className="mt-2 text-gray-500">
              {search || filtreStatut !== 'all' || filtreNiveau !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Créez votre premier groupe pour commencer'}
            </p>
            <Button 
              onClick={() => router.push('/groupes/nouveau')}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Créer un groupe
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredGroupes.map((groupe) => {
              const niveauInfo = getNiveauInfo(groupe.niveauActuel);
              const statutInfo = statutLabels[groupe.statut] || statutLabels.EN_FORMATION;
              const chef = groupe.membres.find(m => m.estChef);

              return (
                <Link key={groupe.id} href={`/groupes/${groupe.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{groupe.nom}</CardTitle>
                          {chef && (
                            <p className="text-sm text-gray-500 mt-1">
                              Chef: {chef.user.prenom} {chef.user.nom}
                            </p>
                          )}
                        </div>
                        <Badge 
                          style={{ backgroundColor: niveauInfo.couleur }}
                          className="text-white"
                        >
                          {niveauInfo.nom}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {/* Statut */}
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${statutInfo.color}`} />
                          <span className="text-sm text-gray-600">{statutInfo.label}</span>
                        </div>

                        {/* Membres */}
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{groupe._count.membres} / 10 membres</span>
                        </div>

                        {/* Carte */}
                        {groupe.cartePayee ? (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <BadgeCheck className="h-4 w-4" />
                            Carte payée
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <AlertCircle className="h-4 w-4" />
                            Carte non payée
                          </div>
                        )}

                        {/* Cycle en cours */}
                        {groupe.cycles.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Clock className="h-4 w-4" />
                            Cycle en cours
                          </div>
                        )}

                        {/* Prêt actuel */}
                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-500">Prêt actuel</p>
                          <p className="font-semibold text-lg">{formatCFA(niveauInfo.montant)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
