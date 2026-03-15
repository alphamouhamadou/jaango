'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, Search, CheckCircle, XCircle, Eye, Play,
  AlertCircle, BadgeCheck, Clock, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { NIVEAUX_PRET, formatCFA, NB_MEMBRES_GROUPE } from '@/lib/groupe-helpers';

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
  cycles: { id: string; statut: string }[];
}

const statutLabels: Record<string, { label: string; color: string }> = {
  EN_FORMATION: { label: 'En formation', color: 'bg-yellow-500' },
  COMPLET: { label: 'Complet', color: 'bg-blue-500' },
  VALIDEE: { label: 'Validé', color: 'bg-green-500' },
  ACTIF: { label: 'Actif', color: 'bg-emerald-500' },
  SUSPENDU: { label: 'Suspendu', color: 'bg-red-500' },
  DISSOUT: { label: 'Dissous', color: 'bg-gray-500' },
};

export default function AdminGroupesPage() {
  const router = useRouter();
  const [groupes, setGroupes] = useState<Groupe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('all');
  const [selectedGroupe, setSelectedGroupe] = useState<Groupe | null>(null);
  const [showValidateDialog, setShowValidateDialog] = useState(false);
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [selectedNiveau, setSelectedNiveau] = useState<string>('BRONZE');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchGroupes();
  }, [filtreStatut]);

  const fetchGroupes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtreStatut !== 'all') params.append('statut', filtreStatut);

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

  const validerGroupe = async (groupeId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/groupes/${groupeId}/valider`, {
        method: 'POST'
      });
      
      if (res.ok) {
        fetchGroupes();
        setShowValidateDialog(false);
        setSelectedGroupe(null);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const demarrerCycle = async () => {
    if (!selectedGroupe || !selectedNiveau) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/groupes/${selectedGroupe.id}/cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niveau: selectedNiveau })
      });
      
      if (res.ok) {
        fetchGroupes();
        setShowCycleDialog(false);
        setSelectedGroupe(null);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredGroupes = groupes.filter(g => 
    g.nom.toLowerCase().includes(search.toLowerCase())
  );

  const getNiveauInfo = (niveau: string) => {
    return NIVEAUX_PRET[niveau as keyof typeof NIVEAUX_PRET] || NIVEAUX_PRET.BRONZE;
  };

  // Groupes en attente de validation
  const groupesEnAttente = groupes.filter(g => g.statut === 'COMPLET');
  const groupesActifs = groupes.filter(g => g.statut === 'ACTIF');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Groupes</h1>
          <p className="text-gray-500 mt-1">
            Validez les groupes et gérez les cycles de financement
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-sm">Total groupes</span>
              </div>
              <p className="text-2xl font-bold">{groupes.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-yellow-600 mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-sm">En attente</span>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{groupesEnAttente.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Actifs</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{groupesActifs.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <BadgeCheck className="h-4 w-4" />
                <span className="text-sm">Validés</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {groupes.filter(g => g.statut === 'VALIDEE').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un groupe..."
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
                {Object.entries(statutLabels).map(([key, value]) => (
                  <SelectItem key={key} value={key}>{value.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Liste des groupes */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroupes.map((groupe) => {
              const statutInfo = statutLabels[groupe.statut] || statutLabels.EN_FORMATION;
              const niveauInfo = getNiveauInfo(groupe.niveauActuel);
              const chef = groupe.membres.find(m => m.estChef);
              const cycleEnCours = groupe.cycles.find(c => c.statut === 'EN_COURS');

              return (
                <Card key={groupe.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{groupe.nom}</h3>
                          <Badge 
                            style={{ backgroundColor: niveauInfo.couleur }}
                            className="text-white"
                          >
                            {niveauInfo.nom}
                          </Badge>
                          <Badge variant="outline" className={statutInfo.color}>
                            {statutInfo.label}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {groupe._count.membres} / {NB_MEMBRES_GROUPE} membres
                          </span>
                          {chef && (
                            <span>Chef: {chef.user.prenom} {chef.user.nom}</span>
                          )}
                          {groupe.cartePayee && (
                            <span className="flex items-center gap-1 text-green-600">
                              <BadgeCheck className="h-4 w-4" />
                              Carte payée
                            </span>
                          )}
                          {cycleEnCours && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Play className="h-4 w-4" />
                              Cycle en cours
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/groupes/${groupe.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </Link>

                        {groupe.statut === 'COMPLET' && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedGroupe(groupe);
                              setShowValidateDialog(true);
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valider
                          </Button>
                        )}

                        {(groupe.statut === 'VALIDEE' || groupe.statut === 'COMPLET') && 
                         !cycleEnCours && groupe.cartePayee && (
                          <Button 
                            size="sm"
                            onClick={() => {
                              setSelectedGroupe(groupe);
                              setShowCycleDialog(true);
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Démarrer cycle
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Validation */}
      <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider le groupe</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir valider le groupe "{selectedGroupe?.nom}" ?
              Les membres pourront ensuite payer la carte de groupe.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={() => validerGroupe(selectedGroupe!.id)} disabled={actionLoading}>
              {actionLoading ? 'Validation...' : 'Valider'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Démarrer Cycle */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Démarrer un nouveau cycle</DialogTitle>
            <DialogDescription>
              Sélectionnez le niveau de prêt pour le groupe "{selectedGroupe?.nom}"
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Niveau de prêt</Label>
            <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NIVEAUX_PRET).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: value.couleur }}
                      />
                      {value.nom} - {formatCFA(value.montant)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedNiveau && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Mensualité groupe:</strong> {formatCFA(NIVEAUX_PRET[selectedNiveau as keyof typeof NIVEAUX_PRET].remboursementMensuel + 50000)}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Par membre:</strong> {formatCFA((NIVEAUX_PRET[selectedNiveau as keyof typeof NIVEAUX_PRET].remboursementMensuel + 50000) / 10)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCycleDialog(false)}>
              Annuler
            </Button>
            <Button onClick={demarrerCycle} disabled={actionLoading}>
              {actionLoading ? 'Démarrage...' : 'Démarrer le cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
