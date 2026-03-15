'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowRight, 
  Loader2, 
  LogOut, 
  Plus, 
  Wallet, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  User,
  Settings,
  Bell,
  History,
  FileText,
  Home,
  Users
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatFCFA, formatDate, formatDateShort, getStatutDemandeLabel, getStatutDemandeColor, getStatutRembLabel, getStatutRembColor, getTypePretLabel } from '@/lib/helpers';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

interface Demande {
  id: string;
  typePret: string;
  montant: number;
  avance: number;
  statut: string;
  createdAt: string;
  dateDecaissement: string | null;
  remboursements: Remboursement[];
}

interface Remboursement {
  id: string;
  montant: number;
  dateEcheance: string;
  datePaiement: string | null;
  statut: string;
  demandePretId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated, setLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check auth status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
          router.push('/connexion');
        }
      } catch {
        setUser(null);
        router.push('/connexion');
      }
    };
    
    checkAuth();
  }, [router, setUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/demandes');
      const data = await response.json();
      setDemandes(data.demandes || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  // Calculate statistics
  const stats = {
    totalEmprunte: demandes.reduce((sum, d) => sum + d.montant, 0),
    totalRembourse: demandes
      .flatMap(d => d.remboursements)
      .filter(r => r.statut === 'PAYE')
      .reduce((sum, r) => sum + r.montant, 0),
    enCours: demandes.filter(d => d.statut === 'DECAISSE').length,
    prochainesEcheances: demandes
      .flatMap(d => d.remboursements)
      .filter(r => r.statut === 'EN_ATTENTE')
      .sort((a, b) => new Date(a.dateEcheance).getTime() - new Date(b.dateEcheance).getTime())
      .slice(0, 3),
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

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
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-muted-foreground">
                Bonjour, <span className="font-medium text-foreground">{user?.prenom}</span>
              </span>
              {user?.role === 'ADMIN' && (
                <Button variant="outline" asChild>
                  <Link href="/admin">
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Link>
                </Button>
              )}
              <Button variant="ghost" size="icon" asChild>
                <Link href="/profil">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <NotificationBell />
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
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground px-2 mb-2">
                  Bonjour, <span className="font-medium text-foreground">{user?.prenom}</span>
                </span>
                
                {/* Navigation principale mobile */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/dashboard">
                      <Home className="h-4 w-4 mr-2" /> Accueil
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/historique">
                      <History className="h-4 w-4 mr-2" /> Historique
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/transactions">
                      <FileText className="h-4 w-4 mr-2" /> Transactions
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="justify-start">
                    <Link href="/demande">
                      <Plus className="h-4 w-4 mr-2" /> Nouveau prêt
                    </Link>
                  </Button>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  {user?.role === 'ADMIN' && (
                    <Button variant="outline" asChild className="w-full mb-2">
                      <Link href="/admin">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/profil">
                      <User className="h-5 w-5 mr-2" /> Mon Profil
                    </Link>
                  </Button>
                  <Button variant="ghost" asChild className="w-full justify-start">
                    <Link href="/notifications">
                      <Bell className="h-5 w-5 mr-2" /> Notifications
                    </Link>
                  </Button>
                  {mounted && (
                    <Button
                      variant="ghost"
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="w-full justify-start"
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
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </Button>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>

      <MobileBottomNav />

      {/* Main Content - with padding bottom for mobile nav */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenue, {user?.prenom} {user?.nom}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos prêts et suivez vos remboursements depuis votre tableau de bord.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total emprunté</p>
                  <p className="text-2xl font-bold">{formatFCFA(stats.totalEmprunte)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total remboursé</p>
                  <p className="text-2xl font-bold">{formatFCFA(stats.totalRembourse)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prêts en cours</p>
                  <p className="text-2xl font-bold">{stats.enCours}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button asChild className="w-full h-full min-h-[76px] bg-green-600 hover:bg-green-700">
                <Link href="/demande">
                  <Plus className="h-5 w-5 mr-2" />
                  Nouvelle demande
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Groupes Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Groupes Solidaires
                </CardTitle>
                <CardDescription>
                  Rejoignez un groupe de 10 femmes pour accéder aux financements communautaires
                </CardDescription>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/groupes">
                  Voir les groupes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Groupes disponibles</p>
                  <p className="font-semibold">5 niveaux</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prêts de</p>
                  <p className="font-semibold">1M à 3M FCFA</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Épargne mensuelle</p>
                  <p className="font-semibold">5 000 FCFA/membre</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Demandes List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Historique des demandes</CardTitle>
              <CardDescription>Vos demandes de prêt et leur statut</CardDescription>
            </CardHeader>
            <CardContent>
              {demandes.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucune demande de prêt</p>
                  <Button asChild className="bg-green-600 hover:bg-green-700">
                    <Link href="/demande">
                      <Plus className="h-4 w-4 mr-2" />
                      Faire une demande
                    </Link>
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {demandes.map((demande) => {
                      const rembourse = demande.remboursements.filter(r => r.statut === 'PAYE').length;
                      const total = demande.remboursements.length;
                      const progress = total > 0 ? (rembourse / total) * 100 : 0;
                      
                      return (
                        <Link
                          key={demande.id}
                          href={`/pret/${demande.id}`}
                          className="block"
                        >
                          <Card className="card-hover cursor-pointer">
                            <CardContent className="pt-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-semibold">{getTypePretLabel(demande.typePret)}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Demande du {formatDateShort(demande.createdAt)}
                                  </p>
                                </div>
                                <Badge className={getStatutDemandeColor(demande.statut)}>
                                  {getStatutDemandeLabel(demande.statut)}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-lg font-bold">{formatFCFA(demande.montant)}</span>
                                {demande.statut === 'DECAISSE' && (
                                  <span className="text-sm text-muted-foreground">
                                    {rembourse}/{total} mensualités
                                  </span>
                                )}
                              </div>
                              {demande.statut === 'DECAISSE' && (
                                <Progress value={progress} className="h-2" />
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Prochaines échéances
              </CardTitle>
              <CardDescription>Vos paiements à venir</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.prochainesEcheances.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">Aucune échéance à venir</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3 pr-4">
                    {stats.prochainesEcheances.map((echeance) => {
                      const demande = demandes.find(d => d.id === echeance.demandePretId);
                      const isOverdue = new Date(echeance.dateEcheance) < new Date();
                      
                      return (
                        <Card key={echeance.id} className={isOverdue ? 'border-destructive' : ''}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-semibold">{formatFCFA(echeance.montant)}</p>
                              <Badge className={isOverdue ? 'bg-red-100 text-red-800' : getStatutRembColor(echeance.statut)}>
                                {isOverdue ? 'En retard' : getStatutRembLabel(echeance.statut)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              Échéance: {formatDate(echeance.dateEcheance)}
                            </p>
                            {demande && (
                              <Link
                                href={`/pret/${demande.id}`}
                                className="text-sm text-green-600 hover:underline"
                              >
                                Voir le prêt →
                              </Link>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
