'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft,
  Loader2, 
  LogOut, 
  Wallet, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  PlayCircle,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  Shield,
  Ban,
  DollarSign,
  Activity,
  FileText,
  Search,
  Filter,
  Download,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatFCFA, formatDate, formatDateShort, getStatutDemandeLabel, getStatutDemandeColor, getTypePretLabel } from '@/lib/helpers';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface Demande {
  id: string;
  typePret: string;
  montant: number;
  avance: number;
  statut: string;
  createdAt: string;
  user: {
    id: string;
    prenom: string;
    nom: string;
    telephone: string;
    adresse: string;
  };
  membres: { id: string }[];
  remboursements: { id: string; dateEcheance: string; statut: string; montant: number }[];
}

interface Stats {
  demandes: {
    enAttente: number;
    payeAvance: number;
    validees: number;
    decaissees: number;
    remboursees: number;
    rejetees: number;
  };
  finances: {
    totalMontantDemande: number;
    totalAvancesRecuperees: number;
    totalRembourse: number;
  };
  users: {
    total: number;
  };
  activite: {
    nouvellesDemandes: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    // Check auth and admin role
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

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchData();
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      const [demandesRes, statsRes] = await Promise.all([
        fetch('/api/admin/demandes'),
        fetch('/api/admin/stats')
      ]);
      
      if (!demandesRes.ok || !statsRes.ok) {
        throw new Error('Erreur lors du chargement des données');
      }
      
      const demandesData = await demandesRes.json();
      const statsData = await statsRes.json();
      
      setDemandes(demandesData.demandes || []);
      setStats(statsData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
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

  const handleAction = async (demandeId: string, action: 'validate' | 'reject' | 'disburse') => {
    setActionLoading(demandeId);
    
    try {
      const response = await fetch(`/api/admin/demandes/${demandeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
      toast({
        title: 'Action réussie',
        description: data.message,
      });
      
      // Refresh data
      fetchData();
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

  // Filter and search logic
  const filteredDemandes = demandes.filter(d => {
    const matchesStatut = filterStatut === 'all' || d.statut === filterStatut;
    const matchesSearch = searchQuery === '' || 
      d.user.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.user.telephone.includes(searchQuery) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatut && matchesSearch;
  });

  const getActionButtons = (demande: Demande) => {
    const buttons = [];
    
    if (demande.statut === 'PAYE_AVANCE') {
      buttons.push(
        <Button
          key="validate"
          size="sm"
          className="bg-green-600 hover:bg-green-700"
          onClick={() => handleAction(demande.id, 'validate')}
          disabled={actionLoading === demande.id}
        >
          {actionLoading === demande.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 mr-1" />
          )}
          Valider
        </Button>
      );
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="destructive"
          onClick={() => handleAction(demande.id, 'reject')}
          disabled={actionLoading === demande.id}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rejeter
        </Button>
      );
    }
    
    if (demande.statut === 'VALIDEE') {
      buttons.push(
        <Button
          key="disburse"
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => handleAction(demande.id, 'disburse')}
          disabled={actionLoading === demande.id}
        >
          {actionLoading === demande.id ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="h-4 w-4 mr-1" />
          )}
          Décaisser
        </Button>
      );
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="destructive"
          onClick={() => handleAction(demande.id, 'reject')}
          disabled={actionLoading === demande.id}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rejeter
        </Button>
      );
    }
    
    if (demande.statut === 'EN_ATTENTE') {
      buttons.push(
        <Button
          key="reject"
          size="sm"
          variant="destructive"
          onClick={() => handleAction(demande.id, 'reject')}
          disabled={actionLoading === demande.id}
        >
          <XCircle className="h-4 w-4 mr-1" />
          Rejeter
        </Button>
      );
    }
    
    return buttons;
  };

  // Calculate advanced KPIs
  const kpis = stats ? {
    tauxRecouvrement: stats.finances.totalMontantDemande > 0 
      ? Math.round((stats.finances.totalRembourse / stats.finances.totalMontantDemande) * 100) 
      : 0,
    montantMoyenPret: stats.demandes.decaissees > 0 
      ? Math.round(stats.finances.totalMontantDemande / stats.demandes.decaissees) 
      : 0,
    tauxValidation: (() => {
      const total = Object.values(stats.demandes).reduce((a, b) => a + b, 0);
      const validated = stats.demandes.decaissees + stats.demandes.remboursees + stats.demandes.validees;
      return total > 0 ? Math.round((validated / total) * 100) : 0;
    })(),
    pretsActifs: stats.demandes.decaissees,
  } : null;

  // Chart data
  const statusChartData = stats ? [
    { name: 'En attente', value: stats.demandes.enAttente, color: '#f59e0b' },
    { name: 'Avance payée', value: stats.demandes.payeAvance, color: '#3b82f6' },
    { name: 'Validées', value: stats.demandes.validees, color: '#8b5cf6' },
    { name: 'Décaissées', value: stats.demandes.decaissees, color: '#22c55e' },
    { name: 'Remboursées', value: stats.demandes.remboursees, color: '#10b981' },
    { name: 'Rejetées', value: stats.demandes.rejetees, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const monthlyData = (() => {
    const monthMap: Record<string, { mois: string; demandes: number; montant: number }> = {};
    
    demandes.forEach(d => {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      
      if (!monthMap[key]) {
        monthMap[key] = { mois: monthName, demandes: 0, montant: 0 };
      }
      monthMap[key].demandes += 1;
      monthMap[key].montant += d.montant;
    });
    
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, data]) => data);
  })();

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
              <Link href="/" className="flex items-center gap-2">
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
              <span className="text-muted-foreground">
                Bonjour, <span className="font-medium text-foreground">{user?.prenom}</span>
              </span>
              <Link href="/admin/rapports">
                <Button variant="ghost" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Rapports
                </Button>
              </Link>
              <Link href="/admin/utilisateurs">
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Utilisateurs
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
              <div className="flex flex-col gap-2">
                <span className="text-muted-foreground px-2">
                  Bonjour, <span className="font-medium text-foreground">{user?.prenom}</span>
                </span>
                <Link href="/admin/rapports">
                  <Button variant="ghost" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Rapports
                  </Button>
                </Link>
                <Link href="/admin/utilisateurs">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Utilisateurs
                  </Button>
                </Link>
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
          <h1 className="text-3xl font-bold mb-2">Tableau de bord Admin</h1>
          <p className="text-muted-foreground">
            Gérez les demandes de prêt et suivez l'activité de la plateforme
          </p>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
                    <p className="text-2xl font-bold text-green-600">{kpis.tauxRecouvrement}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Objectif: 100%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-800/50 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant moyen/prêt</p>
                    <p className="text-xl font-bold text-blue-600">{formatFCFA(kpis.montantMoyenPret)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Par prêt décaissé</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-200 dark:bg-blue-800/50 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de validation</p>
                    <p className="text-2xl font-bold text-purple-600">{kpis.tauxValidation}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle2 className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-purple-600">Demandes approuvées</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-800/50 flex items-center justify-center">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Prêts actifs</p>
                    <p className="text-2xl font-bold text-orange-600">{kpis.pretsActifs}</p>
                    <p className="text-xs text-muted-foreground mt-1">En cours de remboursement</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total utilisateurs</p>
                    <p className="text-2xl font-bold">{stats.users.total}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Prêts actifs</p>
                    <p className="text-2xl font-bold">{stats.demandes.decaissees}</p>
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
                    <p className="text-sm text-muted-foreground">En attente validation</p>
                    <p className="text-2xl font-bold">{stats.demandes.payeAvance + stats.demandes.validees}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total décaissé</p>
                    <p className="text-xl font-bold">{formatFCFA(stats.finances.totalMontantDemande)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly demandes chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution des demandes
              </CardTitle>
              <CardDescription>Nombre de demandes et montants par mois</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorDemandes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mois" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number, name: string) => [
                          name === 'demandes' ? value : formatFCFA(value),
                          name === 'demandes' ? 'Demandes' : 'Montant'
                        ]}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="demandes"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorDemandes)"
                        name="Demandes"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status distribution pie chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Répartition des statuts
              </CardTitle>
              <CardDescription>Distribution par statut de demande</CardDescription>
            </CardHeader>
            <CardContent>
              {statusChartData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [value, 'Demandes']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        {stats && (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avances récupérées</p>
                    <p className="text-xl font-bold">{formatFCFA(stats.finances.totalAvancesRecuperees)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total remboursé</p>
                    <p className="text-xl font-bold">{formatFCFA(stats.finances.totalRembourse)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nouvelles demandes (7j)</p>
                    <p className="text-xl font-bold">{stats.activite.nouvellesDemandes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Summary */}
        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Répartition des demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{stats.demandes.enAttente}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.demandes.payeAvance}</p>
                  <p className="text-sm text-muted-foreground">Avance payée</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.demandes.validees}</p>
                  <p className="text-sm text-muted-foreground">Validées</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.demandes.decaissees}</p>
                  <p className="text-sm text-muted-foreground">Décaissées</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{stats.demandes.remboursees}</p>
                  <p className="text-sm text-muted-foreground">Remboursées</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.demandes.rejetees}</p>
                  <p className="text-sm text-muted-foreground">Rejetées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Demandes List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Demandes de prêt</CardTitle>
                  <CardDescription>Gérez les demandes des utilisateurs</CardDescription>
                </div>
                <div className="text-sm text-muted-foreground">
                  {filteredDemandes.length} sur {demandes.length} demandes
                </div>
              </div>
              
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, téléphone ou ID..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Status Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatut === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatut('all')}
                >
                  Toutes
                </Button>
                <Button
                  variant={filterStatut === 'PAYE_AVANCE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatut('PAYE_AVANCE')}
                >
                  À valider
                </Button>
                <Button
                  variant={filterStatut === 'VALIDEE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatut('VALIDEE')}
                >
                  À décaisser
                </Button>
                <Button
                  variant={filterStatut === 'DECAISSE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatut('DECAISSE')}
                >
                  En cours
                </Button>
                <Button
                  variant={filterStatut === 'REMBOURSE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatut('REMBOURSE')}
                >
                  Remboursées
                </Button>
                <Button
                  variant={filterStatut === 'REJETEE' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatut('REJETEE')}
                >
                  Rejetées
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDemandes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune demande trouvée</p>
                {searchQuery && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Essayez de modifier votre recherche
                  </p>
                )}
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {filteredDemandes.map((demande) => (
                    <Card key={demande.id} className="card-hover">
                      <CardContent className="pt-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* User Info */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white font-bold">
                              {demande.user.prenom[0]}{demande.user.nom[0]}
                            </div>
                            <div>
                              <p className="font-semibold">
                                {demande.user.prenom} {demande.user.nom}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {demande.user.telephone}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={getStatutDemandeColor(demande.statut)}>
                                  {getStatutDemandeLabel(demande.statut)}
                                </Badge>
                                <Badge variant="outline">
                                  {demande.typePret === 'SILVER' ? (
                                    <Shield className="h-3 w-3 mr-1" />
                                  ) : (
                                    <Sparkles className="h-3 w-3 mr-1" />
                                  )}
                                  {getTypePretLabel(demande.typePret)}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Loan Info */}
                          <div className="flex flex-wrap items-center gap-6">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Montant</p>
                              <p className="font-bold">{formatFCFA(demande.montant)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Avance</p>
                              <p className="font-bold text-orange-500">{formatFCFA(demande.avance)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Membres</p>
                              <p className="font-bold">{demande.membres.length}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Date</p>
                              <p className="font-bold text-sm">{formatDateShort(demande.createdAt)}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Dialog open={detailsOpen && selectedDemande?.id === demande.id} onOpenChange={(open) => {
                              setDetailsOpen(open);
                              if (!open) setSelectedDemande(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedDemande(demande);
                                    setDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Détails
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails de la demande</DialogTitle>
                                  <DialogDescription>
                                    Demande de {selectedDemande?.user.prenom} {selectedDemande?.user.nom}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedDemande && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Type de prêt</p>
                                        <p className="font-semibold">{getTypePretLabel(selectedDemande.typePret)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Montant</p>
                                        <p className="font-semibold">{formatFCFA(selectedDemande.montant)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Avance payée</p>
                                        <p className="font-semibold text-orange-500">{formatFCFA(selectedDemande.avance)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Statut</p>
                                        <Badge className={getStatutDemandeColor(selectedDemande.statut)}>
                                          {getStatutDemandeLabel(selectedDemande.statut)}
                                        </Badge>
                                      </div>
                                    </div>

                                    <Separator />

                                    <div>
                                      <h4 className="font-semibold mb-2">Informations du demandeur</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p className="text-muted-foreground">Nom complet</p>
                                          <p>{selectedDemande.user.prenom} {selectedDemande.user.nom}</p>
                                        </div>
                                        <div>
                                          <p className="text-muted-foreground">Téléphone</p>
                                          <p>{selectedDemande.user.telephone}</p>
                                        </div>
                                        <div className="col-span-2">
                                          <p className="text-muted-foreground">Adresse</p>
                                          <p>{selectedDemande.user.adresse}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <Separator />

                                    <div>
                                      <h4 className="font-semibold mb-2">Membres garants ({selectedDemande.membres.length})</h4>
                                      <div className="bg-muted/50 rounded-lg p-4">
                                        <p className="text-sm text-muted-foreground text-center">
                                          {selectedDemande.membres.length} membres inscrits
                                        </p>
                                      </div>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-end gap-2">
                                      {getActionButtons(selectedDemande).map((btn, i) => (
                                        <div key={i} onClick={() => setDetailsOpen(false)}>
                                          {btn}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>

                            {getActionButtons(demande)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
