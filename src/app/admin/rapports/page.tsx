'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft,
  Loader2, 
  LogOut, 
  Download,
  Calendar,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  PieChart,
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  RefreshCw,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  CreditCard,
  Percent
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatFCFA, formatDate, formatDateShort } from '@/lib/helpers';
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
  LineChart,
  Line,
  Legend,
} from 'recharts';

interface ReportStats {
  demandesParStatut: {
    enAttente: number;
    payeAvance: number;
    validees: number;
    decaissees: number;
    remboursees: number;
    rejetees: number;
  };
  demandesParType: {
    silver: number;
    gold: number;
  };
  montants: {
    totalDemande: number;
    totalAvance: number;
    totalDecaisse: number;
    totalRembourse: number;
  };
  remboursements: {
    total: number;
    payes: number;
    enAttente: number;
    enRetard: number;
  };
  transactions: {
    total: number;
    success: number;
    echec: number;
    enAttente: number;
    totalMontant: number;
  };
  utilisateurs: {
    total: number;
    actifs: number;
    suspendus: number;
    avecPret: number;
  };
  kpis: {
    tauxRecouvrement: number;
    montantMoyenPret: number;
    delaiMoyenRemboursement: number;
    tauxAcceptation: number;
  };
}

interface MonthlyData {
  mois: string;
  demandes: number;
  montant: number;
  rembourse: number;
}

interface DailyTransaction {
  date: string;
  count: number;
  montant: number;
}

export default function AdminReportsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [dailyTransactions, setDailyTransactions] = useState<DailyTransaction[]>([]);
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });
  const [exportLoading, setExportLoading] = useState<string | null>(null);

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);
      
      const response = await fetch(`/api/admin/reports?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }
      
      setStats(data.stats);
      setMonthlyData(data.monthlyData || []);
      setDailyTransactions(data.dailyTransactions || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  }, [dateFilter.startDate, dateFilter.endDate, toast]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'ADMIN') {
      fetchData();
    }
  }, [isAuthenticated, user, fetchData]);

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

  const handleExport = async (type: string) => {
    setExportLoading(type);
    try {
      const params = new URLSearchParams({ type });
      if (dateFilter.startDate) params.append('startDate', dateFilter.startDate);
      if (dateFilter.endDate) params.append('endDate', dateFilter.endDate);
      
      const response = await fetch(`/api/admin/export?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'export');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      
      toast({
        title: 'Export réussi',
        description: 'Le fichier a été téléchargé',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de l\'export',
      });
    } finally {
      setExportLoading(null);
    }
  };

  const applyDateFilter = () => {
    fetchData();
  };

  const clearDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
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

  // Chart data
  const statusChartData = stats ? [
    { name: 'En attente', value: stats.demandesParStatut.enAttente, color: '#f59e0b' },
    { name: 'Avance payée', value: stats.demandesParStatut.payeAvance, color: '#3b82f6' },
    { name: 'Validées', value: stats.demandesParStatut.validees, color: '#8b5cf6' },
    { name: 'Décaissées', value: stats.demandesParStatut.decaissees, color: '#22c55e' },
    { name: 'Remboursées', value: stats.demandesParStatut.remboursees, color: '#10b981' },
    { name: 'Rejetées', value: stats.demandesParStatut.rejetees, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  const loanTypeData = stats ? [
    { name: 'Silver', value: stats.demandesParType.silver, color: '#64748b' },
    { name: 'Gold', value: stats.demandesParType.gold, color: '#fbbf24' },
  ].filter(d => d.value > 0) : [];

  const repaymentData = stats ? [
    { name: 'Payés', value: stats.remboursements.payes, color: '#22c55e' },
    { name: 'En attente', value: stats.remboursements.enAttente, color: '#f59e0b' },
    { name: 'En retard', value: stats.remboursements.enRetard, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

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
              <div className="flex flex-col gap-4">
                <Link href="/admin">
                  <Button variant="ghost" className="w-full justify-start">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/admin/utilisateurs">
                  <Button variant="ghost" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Utilisateurs
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rapports & Statistiques</h1>
            <p className="text-muted-foreground">
              Analyse détaillée de l'activité de la plateforme
            </p>
          </div>
          
          {/* Date Filter */}
          <Card className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Date début</Label>
                <Input
                  type="date"
                  value={dateFilter.startDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-40"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Date fin</Label>
                <Input
                  type="date"
                  value={dateFilter.endDate}
                  onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-40"
                />
              </div>
              <Button onClick={applyDateFilter} size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtrer
              </Button>
              <Button onClick={clearDateFilter} variant="outline" size="sm">
                Réinitialiser
              </Button>
            </div>
          </Card>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button 
            variant="outline" 
            onClick={() => handleExport('demandes')}
            disabled={exportLoading !== null}
          >
            {exportLoading === 'demandes' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter Demandes
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('transactions')}
            disabled={exportLoading !== null}
          >
            {exportLoading === 'transactions' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter Transactions
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('remboursements')}
            disabled={exportLoading !== null}
          >
            {exportLoading === 'remboursements' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter Remboursements
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('utilisateurs')}
            disabled={exportLoading !== null}
          >
            {exportLoading === 'utilisateurs' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Exporter Utilisateurs
          </Button>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Taux de recouvrement</p>
                    <p className="text-3xl font-bold text-green-600">{stats.kpis.tauxRecouvrement}%</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Objectif: 100%</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-200 dark:bg-green-800/50 flex items-center justify-center">
                    <Percent className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Montant moyen/prêt</p>
                    <p className="text-xl font-bold text-blue-600">{formatFCFA(stats.kpis.montantMoyenPret)}</p>
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
                    <p className="text-sm text-muted-foreground">Taux d'acceptation</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.kpis.tauxAcceptation}%</p>
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
                    <p className="text-sm text-muted-foreground">Remboursements en retard</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.remboursements.enRetard}</p>
                    <p className="text-xs text-muted-foreground mt-1">À traiter en priorité</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-orange-200 dark:bg-orange-800/50 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Financial Summary */}
        {stats && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total décaissé</p>
                    <p className="text-xl font-bold">{formatFCFA(stats.montants.totalDecaisse)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total remboursé</p>
                    <p className="text-xl font-bold">{formatFCFA(stats.montants.totalRembourse)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avances récupérées</p>
                    <p className="text-xl font-bold">{formatFCFA(stats.montants.totalAvance)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Utilisateurs actifs</p>
                    <p className="text-xl font-bold">{stats.utilisateurs.actifs}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Évolution mensuelle
              </CardTitle>
              <CardDescription>Demandes et remboursements par mois</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyData.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                      <defs>
                        <linearGradient id="colorDemandes2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRembourse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="mois" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        formatter={(value: number) => formatFCFA(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="montant"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorDemandes2)"
                        name="Montant demandé"
                      />
                      <Area
                        type="monotone"
                        dataKey="rembourse"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorRembourse)"
                        name="Montant remboursé"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
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
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center">
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

        {/* Charts Row 2 */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Loan Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Types de prêt
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loanTypeData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={loanTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {loanTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repayment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Statut remboursements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {repaymentData.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={repaymentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {repaymentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total</span>
                    <span className="font-bold">{stats.transactions.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Réussies</span>
                    <Badge className="bg-green-500">{stats.transactions.success}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Échouées</span>
                    <Badge className="bg-red-500">{stats.transactions.echec}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">En attente</span>
                    <Badge className="bg-orange-500">{stats.transactions.enAttente}</Badge>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Montant total</span>
                      <span className="font-bold text-green-600">{formatFCFA(stats.transactions.totalMontant)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Transactions Chart */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Activité des transactions (30 derniers jours)
            </CardTitle>
            <CardDescription>Montant des transactions par jour</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyTransactions.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyTransactions}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => formatFCFA(value)}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR')}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="montant" fill="#22c55e" name="Montant" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Tables */}
        {stats && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Users Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Résumé utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Total inscrits</span>
                    <Badge variant="secondary" className="text-lg">{stats.utilisateurs.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span>Comptes actifs</span>
                    <Badge className="bg-green-500">{stats.utilisataires.actifs}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span>Comptes suspendus</span>
                    <Badge className="bg-red-500">{stats.utilisateurs.suspendus}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span>Avec au moins un prêt</span>
                    <Badge className="bg-blue-500">{stats.utilisateurs.avecPret}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loans Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Résumé des prêts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-yellow-600">{stats.demandesParStatut.enAttente}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.demandesParStatut.payeAvance}</p>
                    <p className="text-xs text-muted-foreground">Avance payée</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.demandesParStatut.validees}</p>
                    <p className="text-xs text-muted-foreground">Validées</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.demandesParStatut.decaissees}</p>
                    <p className="text-xs text-muted-foreground">Décaissées</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-emerald-600">{stats.demandesParStatut.remboursees}</p>
                    <p className="text-xs text-muted-foreground">Remboursées</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{stats.demandesParStatut.rejetees}</p>
                    <p className="text-xs text-muted-foreground">Rejetées</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
