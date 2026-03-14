'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft, 
  Loader2, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  Shield, 
  LogOut,
  Search,
  Filter,
  FileText,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Download
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatFCFA, formatDate, formatDateShort, getStatutDemandeLabel, getStatutDemandeColor, getTypePretLabel } from '@/lib/helpers';
import { RemboursementsChart } from '@/components/charts/remboursements-chart';
import { StatsCards } from '@/components/charts/stats-cards';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

interface Transaction {
  id: string;
  type: string;
  description: string;
  montant: number;
  statut: string;
  date: string;
  demandeId: string;
}

interface Stats {
  totalDemandes: number;
  totalMontant: number;
  totalRembourse: number;
  enCours: number;
  soldes: number;
}

export default function HistoriquePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [demandes, setDemandes] = useState<any[]>([]);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.user) {
          useAuthStore.getState().setUser(null);
          router.push('/connexion');
        } else {
          setUser(data.user);
        }
      } catch {
        useAuthStore.getState().setUser(null);
        router.push('/connexion');
      }
    };
    
    checkAuth();
  }, [router, setUser]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [transactionsRes, demandesRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/demandes')
      ]);
      
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
        setStats(data.stats);
      }
      
      if (demandesRes.ok) {
        const data = await demandesRes.json();
        setDemandes(data.demandes || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de se deconnecter',
      });
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'DEMANDE':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'AVANCE':
        return <ArrowDownRight className="h-4 w-4 text-orange-500" />;
      case 'DECAISSEMENT':
        return <Wallet className="h-4 w-4 text-green-500" />;
      case 'REMBOURSEMENT':
        return <ArrowUpRight className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'DEMANDE': 'Demande',
      'AVANCE': 'Avance',
      'DECAISSEMENT': 'Decaissement',
      'REMBOURSEMENT': 'Remboursement',
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'DEMANDE':
        return 'bg-blue-100 text-blue-800';
      case 'AVANCE':
        return 'bg-orange-100 text-orange-800';
      case 'DECAISSEMENT':
        return 'bg-green-100 text-green-800';
      case 'REMBOURSEMENT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-xl">J</span>
              </div>
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
                Deconnexion
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
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" onClick={handleLogout} className="justify-start">
                  <LogOut className="h-4 w-4 mr-2" />
                  Deconnexion
                </Button>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Historique des transactions</h1>
          <p className="text-muted-foreground">
            Consultez l'historique complet de vos operations
          </p>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RemboursementsChart demandes={demandes} />
          
          <Card>
            <CardHeader>
              <CardTitle>Repartition par type</CardTitle>
              <CardDescription>Types de transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['DEMANDE', 'AVANCE', 'DECAISSEMENT', 'REMBOURSEMENT'].map(type => {
                  const count = transactions.filter(t => t.type === type).length;
                  const total = transactions.length;
                  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={type} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      {getTypeIcon(type)}
                      <div className="flex-1">
                        <p className="font-medium">{getTypeLabel(type)}</p>
                        <p className="text-sm text-muted-foreground">{count} ({percent}%)</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une transaction..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="DEMANDE">Demandes</SelectItem>
                  <SelectItem value="AVANCE">Avances</SelectItem>
                  <SelectItem value="DECAISSEMENT">Decaissements</SelectItem>
                  <SelectItem value="REMBOURSEMENT">Remboursements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>{filteredTransactions.length} transaction(s) trouvee(s)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune transaction trouvee</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] sm:h-[500px]">
                <div className="space-y-3 pr-4">
                  {filteredTransactions.map((transaction) => (
                    <Link
                      key={transaction.id}
                      href={`/pret/${transaction.demandeId}`}
                      className="block"
                    >
                      <Card className="card-hover cursor-pointer">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.montant > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                              {getTypeIcon(transaction.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getTypeBadgeColor(transaction.type)}>
                                  {getTypeLabel(transaction.type)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{transaction.id}</span>
                              </div>
                              <p className="text-sm">{transaction.description}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {formatDate(transaction.date)}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${transaction.montant > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.montant > 0 ? '+' : ''}{formatFCFA(transaction.montant)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </main>
      <MobileBottomNav />
    </div>
  );
}
