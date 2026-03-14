'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { 
  ArrowLeft, 
  Loader2, 
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  LogOut,
  User,
  Bell
} from 'lucide-react';
import { useTheme } from 'next-themes';

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
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
              <Button variant="ghost" size="icon" asChild>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
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
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
                <Button variant="ghost" asChild className="justify-start">
                  <Link href="/notifications">
                    <Bell className="h-5 w-5 mr-2" /> Notifications
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
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-2">
              <Link href="/notifications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux notifications
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Paramètres des notifications</h1>
            <p className="text-muted-foreground">
              Gérez vos préférences de notification
            </p>
          </div>

          {/* Notification Preferences */}
          <NotificationPreferences />
        </div>
      </main>
      
      <MobileBottomNav />
    </div>
  );
}
