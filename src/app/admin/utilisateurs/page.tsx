'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft,
  Loader2, 
  LogOut, 
  Users,
  Search,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  UserCheck,
  UserX,
  Eye,
  Wallet,
  Calendar,
  FileText,
  Phone,
  MapPin,
  CreditCard,
  AlertTriangle,
  Ban,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatFCFA, formatDate, formatDateShort, getStatutDemandeLabel, getStatutDemandeColor, getTypePretLabel } from '@/lib/helpers';

interface UserDemande {
  id: string;
  montant: number;
  statut: string;
  typePret: string;
  createdAt: string;
}

interface UserData {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  adresse: string;
  numeroCNI: string;
  statut: string;
  createdAt: string;
  _count: {
    demandes: number;
    remboursements: number;
  };
  demandes: UserDemande[];
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.user || data.user.role !== 'ADMIN') {
          setUser(null);
          router.push('/');
          return;
        }
        
        setUser(data.user);
      } catch {
        setUser(null);
        router.push('/');
      }
    };
    
    checkAuth();
  }, [router, setUser]);

  const fetchUsers = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statutFilter !== 'all') params.append('statut', statutFilter);
      params.append('page', page.toString());
      params.append('limit', '20');
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
      
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statutFilter, toast]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [isAuthenticated, user, fetchUsers]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast({
        title: 'Déconnexion réussie',
        description: 'À bientôt sur Jaango !',
      });
      router.push('/');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de se déconnecter',
      });
    }
  };

  const handleUserAction = async (userId: string, newStatut: 'ACTIF' | 'SUSPENDU') => {
    setActionLoading(userId);
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, statut: newStatut }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
      toast({
        title: 'Action réussie',
        description: data.message,
      });
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, statut: newStatut } : u
      ));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, statut: newStatut } : null);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSearch = () => {
    fetchUsers(1);
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2">
                <img 
                  src="/logo.jpg" 
                  alt="Jaango Logo" 
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <span className="text-2xl font-bold gradient-text">Jaango</span>
              </Link>
              <Badge className="bg-orange-500 text-white ml-2">
                <Shield className="h-3 w-3 mr-1" />
                Admin
              </Badge>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <Link href="/admin/rapports">
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Rapports
                </Button>
              </Link>
              {mounted && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              <Button variant="ghost" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </nav>

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
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/rapports">
                  <Button variant="ghost" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Rapports
                  </Button>
                </Link>
                <Button variant="ghost" onClick={handleLogout} className="justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground">
            Consultez et gérez les comptes utilisateurs de la plateforme
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, prénom ou téléphone..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex gap-2">
                <select
                  className="px-3 py-2 border rounded-md bg-background"
                  value={statutFilter}
                  onChange={(e) => setStatutFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="ACTIF">Actifs</option>
                  <option value="SUSPENDU">Suspendus</option>
                </select>
                <Button onClick={handleSearch}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                  <p className="text-2xl font-bold">{pagination?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Comptes actifs</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.statut === 'ACTIF').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <UserX className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Comptes suspendus</p>
                  <p className="text-2xl font-bold">{users.filter(u => u.statut === 'SUSPENDU').length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {users.map((u) => (
              <Card key={u.id} className="card-hover">
                <CardContent className="pt-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* User Info */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {u.prenom[0]}{u.nom[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{u.prenom} {u.nom}</p>
                          <Badge className={u.statut === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}>
                            {u.statut === 'ACTIF' ? 'Actif' : 'Suspendu'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {u.telephone}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {u.adresse}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Demandes</p>
                        <p className="font-bold">{u._count.demandes}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Remboursements</p>
                        <p className="font-bold">{u._count.remboursements}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Inscrit le</p>
                        <p className="font-bold text-sm">{formatDateShort(u.createdAt)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      {u.statut === 'ACTIF' ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUserAction(u.id, 'SUSPENDU')}
                          disabled={actionLoading === u.id}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Ban className="h-4 w-4 mr-1" />
                          )}
                          Suspendre
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUserAction(u.id, 'ACTIF')}
                          disabled={actionLoading === u.id}
                        >
                          {actionLoading === u.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Réactiver
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => fetchUsers(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Précédent
            </Button>
            <span className="flex items-center px-4">
              Page {pagination.page} sur {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => fetchUsers(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </main>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>
              Informations complètes de {selectedUser?.prenom} {selectedUser?.nom}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Prénom</p>
                  <p className="font-semibold">{selectedUser.prenom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nom</p>
                  <p className="font-semibold">{selectedUser.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone</p>
                  <p className="font-semibold">{selectedUser.telephone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut</p>
                  <Badge className={selectedUser.statut === 'ACTIF' ? 'bg-green-500' : 'bg-red-500'}>
                    {selectedUser.statut === 'ACTIF' ? 'Actif' : 'Suspendu'}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Adresse</p>
                  <p className="font-semibold">{selectedUser.adresse}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Numéro CNI
                  </p>
                  <p className="font-semibold">{selectedUser.numeroCNI}</p>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Date d'inscription</p>
                  <p className="font-semibold">{formatDate(selectedUser.createdAt)}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total demandes</p>
                  <p className="font-bold text-2xl">{selectedUser._count.demandes}</p>
                </div>
              </div>

              {/* Recent Demandes */}
              {selectedUser.demandes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Demandes récentes</h4>
                    <div className="space-y-2">
                      {selectedUser.demandes.map((d) => (
                        <div key={d.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <Badge variant="outline" className="mr-2">
                              {getTypePretLabel(d.typePret)}
                            </Badge>
                            <span className="font-semibold">{formatFCFA(d.montant)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatutDemandeColor(d.statut)}>
                              {getStatutDemandeLabel(d.statut)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateShort(d.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <DialogFooter>
                {selectedUser.statut === 'ACTIF' ? (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleUserAction(selectedUser.id, 'SUSPENDU');
                      setDetailsOpen(false);
                    }}
                    disabled={actionLoading === selectedUser.id}
                  >
                    {actionLoading === selectedUser.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    Suspendre le compte
                  </Button>
                ) : (
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleUserAction(selectedUser.id, 'ACTIF');
                      setDetailsOpen(false);
                    }}
                    disabled={actionLoading === selectedUser.id}
                  >
                    {actionLoading === selectedUser.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Réactiver le compte
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
