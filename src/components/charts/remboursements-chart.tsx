'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatFCFA } from '@/lib/helpers';

interface RemboursementsChartProps {
  demandes: any[];
}

export function RemboursementsChart({ demandes }: RemboursementsChartProps) {
  // Prepare data for the chart
  const monthlyData = (() => {
    const monthMap: Record<string, { mois: string; montant: number; count: number }> = {};
    
    demandes.forEach(d => {
      if (d.remboursements) {
        d.remboursements.forEach((r: any) => {
          if (r.statut === 'PAYE' && r.datePaiement) {
            const date = new Date(r.datePaiement);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
            
            if (!monthMap[key]) {
              monthMap[key] = { mois: monthName, montant: 0, count: 0 };
            }
            monthMap[key].montant += r.montant;
            monthMap[key].count += 1;
          }
        });
      }
    });
    
    return Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, data]) => data);
  })();

  // Prepare status distribution
  const statusData = [
    { name: 'En cours', value: demandes.filter(d => d.statut === 'DECAISSE').length, color: '#3b82f6' },
    { name: 'Rembourses', value: demandes.filter(d => d.statut === 'REMBOURSE').length, color: '#22c55e' },
    { name: 'En attente', value: demandes.filter(d => ['EN_ATTENTE', 'PAYE_AVANCE', 'VALIDEE'].includes(d.statut)).length, color: '#f59e0b' },
    { name: 'Rejetes', value: demandes.filter(d => d.statut === 'REJETEE').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const totalRembourse = demandes.flatMap(d => d.remboursements || [])
    .filter((r: any) => r.statut === 'PAYE')
    .reduce((sum: number, r: any) => sum + r.montant, 0);

  const totalAttendu = demandes
    .filter(d => d.statut === 'DECAISSE')
    .reduce((sum, d) => sum + d.montant, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolution des remboursements</CardTitle>
        <CardDescription>Montants rembourses par mois</CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Aucune donnee de remboursement
          </div>
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mois" className="text-xs" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000)}k`}
                  className="text-xs"
                />
                <Tooltip 
                  formatter={(value: number) => formatFCFA(value)}
                  labelStyle={{ color: '#000' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="montant"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorMontant)"
                  name="Montant"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsCardsProps {
  stats: {
    totalDemandes: number;
    totalMontant: number;
    totalRembourse: number;
    enCours: number;
    soldes: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total demandes',
      value: stats.totalDemandes,
      description: 'Demandes soumises',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Montant total',
      value: formatFCFA(stats.totalMontant),
      description: 'Capital demande',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Total rembourse',
      value: formatFCFA(stats.totalRembourse),
      description: 'Capital rembourse',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Prêts actifs',
      value: stats.enCours,
      description: 'En cours de remboursement',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-full ${card.bgColor} flex items-center justify-center`}>
                <span className={`text-xl font-bold ${card.color}`}>{i + 1}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ProgressChartProps {
  demande: any;
}

export function ProgressChart({ demande }: ProgressChartProps) {
  if (!demande.remboursements || demande.remboursements.length === 0) {
    return null;
  }

  const paid = demande.remboursements.filter((r: any) => r.statut === 'PAYE').length;
  const total = demande.remboursements.length;
  const percent = Math.round((paid / total) * 100);

  const data = [
    { name: 'Paye', value: paid, color: '#22c55e' },
    { name: 'Restant', value: total - paid, color: '#e5e7eb' },
  ];

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={35}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-2xl font-bold">{percent}%</p>
        <p className="text-sm text-muted-foreground">{paid}/{total} mensualites</p>
      </div>
    </div>
  );
}
