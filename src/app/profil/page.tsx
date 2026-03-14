'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { 
  ArrowLeft, 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Lock,
  Save,
  Moon,
  Sun,
  Menu,
  X,
  Shield,
  LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { formatDate } from '@/lib/helpers';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Bell } from 'lucide-react';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

export default function ProfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { user, setUser, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    adresse: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          setFormData({
            prenom: data.user.prenom || '',
            nom: data.user.nom || '',
            telephone: data.user.telephone || '',
            adresse: data.user.adresse || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      } catch {
        useAuthStore.getState().setUser(null);
        router.push('/connexion');
      }
    };
    
    checkAuth();
  }, [router, setUser]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de se déconnecter',
      });
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (formData.prenom.length < 2) {
      newErrors.prenom = 'Le prénom doit contenir au moins 2 caractères';
    }
    if (formData.nom.length < 2) {
      newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
    }
    if (!/^(\+221|0)?[0-9]{9}$/.test(formData.telephone)) {
      newErrors.telephone = 'Numéro de téléphone invalide';
    }
    if (formData.adresse.length < 5) {
      newErrors.adresse = 'L\'adresse doit contenir au moins 5 caractères';
    }
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Le mot de passe actuel est requis';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Le nouveau mot de passe doit contenir au moins 6 caractères';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/profil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: formData.prenom,
          nom: formData.nom,
          telephone: formData.telephone,
          adresse: formData.adresse,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }
      
      setUser(data.user);
      setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      
      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été enregistrées avec succès',
      });
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
              <div className="flex flex-col gap-4">
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin
                    </Link>
                  </Button>
                )}
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
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au tableau de bord
            </Link>
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div>
                  <CardTitle className="text-2xl">Mon Profil</CardTitle>
                  <CardDescription>
                    Gérez vos informations personnelles
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prenom">Prénom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="prenom"
                          className="pl-10"
                          value={formData.prenom}
                          onChange={(e) => updateFormData('prenom', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.prenom && <p className="text-sm text-destructive">{errors.prenom}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nom">Nom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="nom"
                          className="pl-10"
                          value={formData.nom}
                          onChange={(e) => updateFormData('nom', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.nom && <p className="text-sm text-destructive">{errors.nom}</p>}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telephone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telephone"
                        className="pl-10"
                        value={formData.telephone}
                        onChange={(e) => updateFormData('telephone', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.telephone && <p className="text-sm text-destructive">{errors.telephone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="adresse"
                        className="pl-10"
                        value={formData.adresse}
                        onChange={(e) => updateFormData('adresse', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.adresse && <p className="text-sm text-destructive">{errors.adresse}</p>}
                  </div>
                </div>

                <Separator />

                {/* Read-only Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informations non modifiables</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Numéro CNI</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10 bg-muted"
                          value={user?.numeroCNI || ''}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Date de naissance</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10 bg-muted"
                          value={user?.dateNaissance ? formatDate(user.dateNaissance) : ''}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline">{user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}</Badge>
                    <Badge variant={user?.statut === 'ACTIF' ? 'default' : 'destructive'}>
                      {user?.statut === 'ACTIF' ? 'Actif' : 'Suspendu'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Password Change */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Changer le mot de passe</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Laissez vide si vous ne souhaitez pas changer votre mot de passe
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="currentPassword"
                          type="password"
                          className="pl-10"
                          placeholder="Entrez votre mot de passe actuel"
                          value={formData.currentPassword}
                          onChange={(e) => updateFormData('currentPassword', e.target.value)}
                          disabled={isLoading}
                        />
                      </div>
                      {errors.currentPassword && <p className="text-sm text-destructive">{errors.currentPassword}</p>}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type="password"
                            className="pl-10"
                            placeholder="Minimum 6 caractères"
                            value={formData.newPassword}
                            onChange={(e) => updateFormData('newPassword', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.newPassword && <p className="text-sm text-destructive">{errors.newPassword}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmer</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            className="pl-10"
                            placeholder="Retapez le mot de passe"
                            value={formData.confirmPassword}
                            onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                            disabled={isLoading}
                          />
                        </div>
                        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">Annuler</Link>
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
