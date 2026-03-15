'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, ArrowLeft, Search, UserPlus, X, 
  AlertCircle, CheckCircle, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NB_MEMBRES_GROUPE } from '@/lib/groupe-helpers';

interface User {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
}

export default function NouveauGroupePage() {
  const router = useRouter();
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [membresSelectionnes, setMembresSelectionnes] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Rechercher des utilisateurs
  useEffect(() => {
    const searchUsers = async () => {
      if (searchUser.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchUser)}`);
        const data = await res.json();
        
        if (data.users) {
          // Exclure les membres déjà sélectionnés
          const selectedIds = membresSelectionnes.map(m => m.id);
          setSearchResults(
            data.users
              .filter((u: User) => !selectedIds.includes(u.id))
              .slice(0, 5)
          );
        }
      } catch (err) {
        console.error('Erreur recherche:', err);
      } finally {
        setSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchUser, membresSelectionnes]);

  const ajouterMembre = (user: User) => {
    if (membresSelectionnes.length >= NB_MEMBRES_GROUPE) {
      setError(`Un groupe ne peut pas avoir plus de ${NB_MEMBRES_GROUPE} membres`);
      return;
    }

    if (!membresSelectionnes.find(m => m.id === user.id)) {
      setMembresSelectionnes([...membresSelectionnes, user]);
      setSearchUser('');
      setSearchResults([]);
      setError(null);
    }
  };

  const retirerMembre = (userId: string) => {
    setMembresSelectionnes(membresSelectionnes.filter(m => m.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom.trim()) {
      setError('Le nom du groupe est requis');
      return;
    }

    if (membresSelectionnes.length === 0) {
      setError('Ajoutez au moins un membre au groupe');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/groupes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: nom.trim(),
          description: description.trim() || null,
          membres: membresSelectionnes.map(m => m.id)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la création');
      }

      router.push(`/groupes/${data.groupe.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (prenom: string, nom: string) => {
    return `${prenom[0]}${nom[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Créer un groupe solidaire</h1>
          <p className="text-gray-500 mt-1">
            Un groupe doit contenir exactement 10 femmes
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          {/* Informations du groupe */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Informations du groupe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nom">Nom du groupe *</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Les Courageuses de Dakar"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez votre groupe et ses objectifs..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ajout de membres */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Membres du groupe</span>
                <Badge variant={membresSelectionnes.length === NB_MEMBRES_GROUPE ? 'default' : 'secondary'}>
                  {membresSelectionnes.length} / {NB_MEMBRES_GROUPE}
                </Badge>
              </CardTitle>
              <CardDescription>
                Le premier membre ajouté sera le chef du groupe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  placeholder="Rechercher par nom ou téléphone..."
                  className="pl-10"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Résultats de recherche */}
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => ajouterMembre(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left"
                    >
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(user.prenom, user.nom)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.prenom} {user.nom}</p>
                        <p className="text-sm text-gray-500">{user.telephone}</p>
                      </div>
                      <UserPlus className="h-5 w-5 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Membres sélectionnés */}
              {membresSelectionnes.length > 0 && (
                <div className="space-y-2">
                  <Label>Membres sélectionnés</Label>
                  <div className="space-y-2">
                    {membresSelectionnes.map((membre, index) => (
                      <div 
                        key={membre.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(membre.prenom, membre.nom)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {membre.prenom} {membre.nom}
                            {index === 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                Chef
                              </Badge>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{membre.telephone}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => retirerMembre(membre.id)}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message si pas de membres */}
              {membresSelectionnes.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>Recherchez et ajoutez des membres à votre groupe</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Résumé */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                {membresSelectionnes.length === NB_MEMBRES_GROUPE ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="text-sm">
                  {membresSelectionnes.length === NB_MEMBRES_GROUPE
                    ? 'Le groupe est complet et prêt à être créé'
                    : `Encore ${NB_MEMBRES_GROUPE - membresSelectionnes.length} membre(s) à ajouter`}
                </span>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading || membresSelectionnes.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    'Créer le groupe'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
