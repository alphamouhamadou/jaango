'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft, 
  Loader2, 
  Bell, 
  Check, 
  Trash2, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Wallet,
  Moon,
  Sun,
  Menu,
  X as CloseIcon,
  Shield,
  LogOut,
  User,
  Settings
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatDistanceToNow, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  lien: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('toutes');

  useEffect(() => {
    setMounted(true);
    
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
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      setNotifications(data.notifications || []);
      setNonLues(data.nonLues || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PUT' });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, lu: true } : n)
      );
      setNonLues(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setNonLues(0);
      toast({
        title: 'Succès',
        description: 'Toutes les notifications ont été marquées comme lues',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast({
        title: 'Supprimée',
        description: 'La notification a été supprimée',
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ECHEANCE':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'VALIDATION':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'REJET':
        return <X className="h-5 w-5 text-red-500" />;
      case 'DECAISSEMENT':
        return <Wallet className="h-5 w-5 text-blue-500" />;
      case 'REMBOURSEMENT':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'PAIEMENT':
        return <Wallet className="h-5 w-5 text-purple-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ECHEANCE':
        return { label: 'Échéance', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' };
      case 'VALIDATION':
        return { label: 'Validation', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' };
      case 'REJET':
        return { label: 'Rejet', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' };
      case 'DECAISSEMENT':
        return { label: 'Décaissement', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
      case 'REMBOURSEMENT':
        return { label: 'Remboursement', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' };
      case 'PAIEMENT':
        return { label: 'Paiement', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' };
      default:
        return { label: 'Système', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' };
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'toutes') return true;
    if (activeTab === 'non-lues') return !n.lu;
    return n.type === activeTab.toUpperCase();
  });

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
              {mobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t mt-4">
              <div className="flex flex-col gap-4">
                <span className="text-muted-foreground">
                  Bonjour, <span className="font-medium text-foreground">{user?.prenom}</span>
                </span>
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" asChild className="justify-start">
                  <Link href="/profil">
                    <User className="h-5 w-5 mr-2" /> Mon Profil
                  </Link>
                </Button>
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
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <Button variant="ghost" asChild className="mb-2">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour au tableau de bord
                </Link>
              </Button>
              <h1 className="text-3xl font-bold">Centre de Notifications</h1>
              <p className="text-muted-foreground">
                Retrouvez toutes vos notifications et alertes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/parametres/notifications">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </Link>
              </Button>
              {nonLues > 0 && (
                <Button onClick={markAllAsRead} variant="outline">
                  <Check className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{notifications.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">{nonLues}</p>
                  <p className="text-sm text-muted-foreground">Non lues</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {notifications.filter(n => n.lu).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Lues</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {notifications.filter(n => n.type === 'ECHEANCE').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Échéances</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="toutes">
                Toutes
                <Badge variant="secondary" className="ml-2">
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="non-lues">
                Non lues
                {nonLues > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">{nonLues}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="echeance">Échéances</TabsTrigger>
              <TabsTrigger value="paiement">Paiements</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <Card>
                <CardContent className="pt-6">
                  {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">Aucune notification</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] sm:h-[500px]">
                      <div className="space-y-3 pr-4">
                        {filteredNotifications.map((notification) => {
                          const typeInfo = getTypeLabel(notification.type);
                          
                          return (
                            <Card
                              key={notification.id}
                              className={`transition-all ${
                                !notification.lu 
                                  ? 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10' 
                                  : ''
                              }`}
                            >
                              <CardContent className="pt-4">
                                <div className="flex items-start gap-4">
                                  <div className="mt-1">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{notification.titre}</h3>
                                        <Badge className={typeInfo.color}>
                                          {typeInfo.label}
                                        </Badge>
                                      </div>
                                      {!notification.lu && (
                                        <Badge className="bg-green-500 text-white shrink-0">
                                          Nouveau
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-3">
                                      {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(notification.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                        {' • '}
                                        {formatDistanceToNow(new Date(notification.createdAt), {
                                          addSuffix: true,
                                          locale: fr,
                                        })}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {notification.lien && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            asChild
                                            onClick={() => markAsRead(notification.id)}
                                          >
                                            <Link href={notification.lien}>
                                              Voir détails
                                            </Link>
                                          </Button>
                                        )}
                                        {!notification.lu && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                          >
                                            <Check className="h-4 w-4 mr-1" />
                                            Marquer lu
                                          </Button>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteNotification(notification.id)}
                                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
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
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
