'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store';
import { PaymentModal } from '@/components/payment/payment-modal';
import { 
  ArrowLeft, 
  Loader2, 
  Wallet, 
  Calendar, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Users,
  CreditCard,
  TrendingUp,
  FileDown,
  FileText,
  Download,
  Smartphone
} from 'lucide-react';
import { formatFCFA, formatDate, formatDateShort, getStatutDemandeLabel, getStatutDemandeColor, getStatutRembLabel, getStatutRembColor, getTypePretLabel } from '@/lib/helpers';
import { ProgressChart } from '@/components/charts/remboursements-chart';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';

interface Membre {
  id: string;
  prenom: string;
  nom: string;
  dateNaissance: string;
  numeroCNI: string;
  telephone: string;
  adresse: string;
}

interface Remboursement {
  id: string;
  montant: number;
  dateEcheance: string;
  datePaiement: string | null;
  statut: string;
}

interface Demande {
  id: string;
  typePret: string;
  montant: number;
  avance: number;
  statut: string;
  createdAt: string;
  dateDecaissement: string | null;
  user: {
    telephone: string;
  };
  membres: Membre[];
  remboursements: Remboursement[];
}

export default function PretDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { isAuthenticated, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [demande, setDemande] = useState<Demande | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState<string | null>(null);
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'AVANCE' | 'REMBOURSEMENT'>('AVANCE');
  const [selectedRemboursement, setSelectedRemboursement] = useState<Remboursement | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // Check auth
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (!data.user) {
          setUser(null);
          router.push('/connexion');
        } else {
          setUser(data.user);
        }
      } catch {
        setUser(null);
        router.push('/connexion');
      }
    };
    
    checkAuth();
  }, [router, setUser]);

  useEffect(() => {
    if (isAuthenticated && params.id) {
      fetchDemande();
    }
  }, [isAuthenticated, params.id]);

  const fetchDemande = async () => {
    try {
      const response = await fetch(`/api/demandes/${params.id}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Demande non trouvee');
      }
      
      setDemande(data.demande);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
      router.push('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const openPaymentModal = (type: 'AVANCE' | 'REMBOURSEMENT', remboursement?: Remboursement) => {
    setPaymentType(type);
    setSelectedRemboursement(remboursement || null);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    fetchDemande();
    toast({
      title: 'Paiement effectue',
      description: 'Votre paiement a ete enregistre avec succes',
    });
  };

  const downloadPDF = async (type: 'contract' | 'advance' | 'receipt', remboursementIndex?: number) => {
    const loadingKey = remboursementIndex !== undefined ? `${type}-${remboursementIndex}` : type;
    setPdfLoading(loadingKey);
    
    try {
      let url = `/api/pdf/${params.id}?type=${type}`;
      if (remboursementIndex !== undefined) {
        url += `&remboursement=${remboursementIndex}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la generation du PDF');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `jaango-${type}-${params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'PDF telecharge',
        description: 'Le document a ete telecharge avec succes',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors du telechargement',
      });
    } finally {
      setPdfLoading(null);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated || !demande) {
    return null;
  }

  const rembourse = demande.remboursements.filter(r => r.statut === 'PAYE').length;
  const total = demande.remboursements.length;
  const progress = total > 0 ? (rembourse / total) * 100 : 0;
  const montantRembourse = demande.remboursements
    .filter(r => r.statut === 'PAYE')
    .reduce((sum, r) => sum + r.montant, 0);
  const montantRestant = demande.montant - montantRembourse;

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
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{getTypePretLabel(demande.typePret)}</h1>
              <p className="text-muted-foreground">
                Demande du {formatDateShort(demande.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatutDemandeColor(demande.statut)} text-base px-4 py-2`}>
                {getStatutDemandeLabel(demande.statut)}
              </Badge>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {/* Pay Advance Button */}
            {demande.statut === 'EN_ATTENTE' && (
              <Button 
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => openPaymentModal('AVANCE')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Payer l'avance ({formatFCFA(demande.avance)})
              </Button>
            )}
            
            {/* PDF Downloads */}
            {demande.statut !== 'EN_ATTENTE' && demande.statut !== 'REJETEE' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => downloadPDF('advance')}
                  disabled={pdfLoading === 'advance'}
                >
                  {pdfLoading === 'advance' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  Recu d'avance
                </Button>
                
                {(demande.statut === 'VALIDEE' || demande.statut === 'DECAISSE' || demande.statut === 'REMBOURSE') && (
                  <Button 
                    variant="outline" 
                    onClick={() => downloadPDF('contract')}
                    disabled={pdfLoading === 'contract'}
                  >
                    {pdfLoading === 'contract' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2" />
                    )}
                    Contrat de pret
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="text-2xl font-bold">{formatFCFA(demande.montant)}</p>
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
                  <p className="text-sm text-muted-foreground">Montant rembourse</p>
                  <p className="text-2xl font-bold">{formatFCFA(montantRembourse)}</p>
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
                  <p className="text-sm text-muted-foreground">Reste a payer</p>
                  <p className="text-2xl font-bold">{formatFCFA(montantRestant)}</p>
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
                  <p className="text-sm text-muted-foreground">Progression</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{rembourse}/{total}</p>
                    {total > 0 && <ProgressChart demande={demande} />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {demande.statut === 'DECAISSE' && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression des remboursements</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Repayments List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendrier des remboursements
              </CardTitle>
              <CardDescription>
                {demande.remboursements.length > 0 
                  ? `${total} mensualites de ${formatFCFA(100000)}`
                  : 'Les echeances apparaitront apres le decaissement'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demande.remboursements.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {demande.statut === 'EN_ATTENTE' && 'En attente du paiement de l\'avance'}
                    {demande.statut === 'PAYE_AVANCE' && 'Votre demande est en cours de validation'}
                    {demande.statut === 'VALIDEE' && 'Votre pret sera bientot decaisse'}
                    {demande.statut === 'REJETEE' && 'Cette demande a ete rejetee'}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="space-y-3 pr-4">
                    {demande.remboursements.map((remboursement, index) => {
                      const isOverdue = new Date(remboursement.dateEcheance) < new Date() && remboursement.statut === 'EN_ATTENTE';
                      
                      return (
                        <Card 
                          key={remboursement.id} 
                          className={`${isOverdue ? 'border-destructive' : ''}`}
                        >
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  remboursement.statut === 'PAYE' 
                                    ? 'bg-green-100 dark:bg-green-900/30' 
                                    : isOverdue 
                                      ? 'bg-red-100 dark:bg-red-900/30'
                                      : 'bg-yellow-100 dark:bg-yellow-900/30'
                                }`}>
                                  {remboursement.statut === 'PAYE' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : isOverdue ? (
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                  ) : (
                                    <Clock className="h-5 w-5 text-yellow-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    Mensualite {index + 1}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Echeance: {formatDate(remboursement.dateEcheance)}
                                  </p>
                                  {remboursement.datePaiement && (
                                    <p className="text-sm text-green-600">
                                      Paye le {formatDate(remboursement.datePaiement)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg">
                                  {formatFCFA(remboursement.montant)}
                                </p>
                                <Badge className={isOverdue ? 'bg-red-100 text-red-800' : getStatutRembColor(remboursement.statut)}>
                                  {isOverdue ? 'En retard' : getStatutRembLabel(remboursement.statut)}
                                </Badge>
                                {remboursement.statut === 'PAYE' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="mt-2 w-full"
                                    onClick={() => downloadPDF('receipt', index)}
                                    disabled={pdfLoading === `receipt-${index}`}
                                  >
                                    {pdfLoading === `receipt-${index}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Download className="h-4 w-4 mr-1" />
                                    )}
                                    Recu
                                  </Button>
                                )}
                                {remboursement.statut === 'EN_ATTENTE' && (
                                  <Button 
                                    size="sm" 
                                    className="mt-2 w-full bg-green-600 hover:bg-green-700"
                                    onClick={() => openPaymentModal('REMBOURSEMENT', remboursement)}
                                  >
                                    <Smartphone className="h-4 w-4 mr-1" />
                                    Payer
                                  </Button>
                                )}
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

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Membres garants
              </CardTitle>
              <CardDescription>{demande.membres.length} membres</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {demande.membres.map((membre, index) => (
                    <div 
                      key={membre.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="font-semibold text-green-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {membre.prenom} {membre.nom}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {membre.telephone}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Loan Details */}
        <Card className="mt-6 mb-20 md:mb-0">
          <CardHeader>
            <CardTitle>Details du pret</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type de pret</span>
                  <span className="font-semibold">{getTypePretLabel(demande.typePret)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant demande</span>
                  <span className="font-semibold">{formatFCFA(demande.montant)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avance payee (10%)</span>
                  <span className="font-semibold text-orange-500">{formatFCFA(demande.avance)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de la demande</span>
                  <span className="font-semibold">{formatDate(demande.createdAt)}</span>
                </div>
                {demande.dateDecaissement && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date de decaissement</span>
                    <span className="font-semibold">{formatDate(demande.dateDecaissement)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge className={getStatutDemandeColor(demande.statut)}>
                    {getStatutDemandeLabel(demande.statut)}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        type={paymentType}
        demandeId={demande.id}
        remboursementId={selectedRemboursement?.id}
        amount={paymentType === 'AVANCE' ? demande.avance : (selectedRemboursement?.montant || 0)}
        description={paymentType === 'AVANCE' 
          ? `Paiement de l'avance (10%) pour votre ${getTypePretLabel(demande.typePret)}`
          : `Paiement de la mensualite`
        }
        defaultPhone={demande.user?.telephone || ''}
        onSuccess={handlePaymentSuccess}
      />
      <MobileBottomNav />
    </div>
  );
}
