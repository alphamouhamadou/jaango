'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CreditCard,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatFCFA, formatDate } from '@/lib/helpers';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

interface Transaction {
  id: string;
  reference: string;
  type: 'AVANCE' | 'REMBOURSEMENT';
  montant: number;
  frais: number;
  provider: 'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY';
  statut: 'EN_ATTENTE' | 'SUCCESS' | 'ECHEC' | 'ANNULE';
  telephone: string;
  message: string | null;
  createdAt: string;
  demandePret?: {
    typePret: string;
    montant: number;
  };
}

const providerColors = {
  ORANGE_MONEY: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600', name: 'Orange Money' },
  WAVE: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600', name: 'Wave' },
  FREE_MONEY: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600', name: 'Free Money' },
};

const statusConfig = {
  SUCCESS: { bg: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Reussi' },
  EN_ATTENTE: { bg: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'En attente' },
  ECHEC: { bg: 'bg-red-100 text-red-800', icon: XCircle, label: 'Echec' },
  ANNULE: { bg: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Annule' },
};

export default function TransactionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      fetchTransactions();
    }
  }, [isAuthenticated]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/payment/process');
      const data = await response.json();
      
      if (response.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
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

  // Calculate stats
  const totalTransactions = transactions.length;
  const successTransactions = transactions.filter(t => t.statut === 'SUCCESS').length;
  const totalAmount = transactions
    .filter(t => t.statut === 'SUCCESS')
    .reduce((sum, t) => sum + t.montant, 0);

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mes paiements</h1>
              <p className="text-muted-foreground">
                Historique de vos transactions Mobile Money
              </p>
            </div>
            <Button variant="outline" onClick={fetchTransactions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total transactions</p>
                  <p className="text-2xl font-bold">{totalTransactions}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Transactions reussies</p>
                  <p className="text-2xl font-bold text-green-600">{successTransactions}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Montant total paye</p>
                  <p className="text-2xl font-bold">{formatFCFA(totalAmount)}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>Toutes vos transactions de paiement</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
                <p className="text-muted-foreground">
                  Vos transactions de paiement apparaitront ici
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] sm:h-[500px]">
                <div className="space-y-4 pr-4">
                  {transactions.map((transaction) => {
                    const providerInfo = providerColors[transaction.provider];
                    const statusInfo = statusConfig[transaction.statut];
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <Card key={transaction.id} className="card-hover">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-4">
                            {/* Provider Icon */}
                            <div className={`w-12 h-12 rounded-full ${providerInfo.bg} flex items-center justify-center`}>
                              <Smartphone className={`h-6 w-6 ${providerInfo.text}`} />
                            </div>
                            
                            {/* Transaction Details */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={providerInfo.bg}>
                                  {providerInfo.name}
                                </Badge>
                                <Badge variant="outline">
                                  {transaction.type === 'AVANCE' ? 'Avance' : 'Mensualite'}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Ref: {transaction.reference}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </p>
                              {transaction.message && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {transaction.message}
                                </p>
                              )}
                            </div>
                            
                            {/* Amount and Status */}
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                {formatFCFA(transaction.montant)}
                              </p>
                              {transaction.frais > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  +{formatFCFA(transaction.frais)} frais
                                </p>
                              )}
                              <Badge className={`${statusInfo.bg} mt-1`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
