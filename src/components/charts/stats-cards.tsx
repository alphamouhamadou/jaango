'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatFCFA } from '@/lib/helpers';
import { TrendingUp, Wallet, CheckCircle2, Clock } from 'lucide-react';

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
      value: stats.totalDemandes.toString(),
      description: 'Demandes soumises',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Montant total',
      value: formatFCFA(stats.totalMontant),
      description: 'Capital emprunte',
      icon: <Wallet className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Total rembourse',
      value: formatFCFA(stats.totalRembourse),
      description: 'Capital rembourse',
      icon: <CheckCircle2 className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Prets actifs',
      value: stats.enCours.toString(),
      description: 'En cours',
      icon: <Clock className="h-6 w-6" />,
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
              <div className={`w-12 h-12 rounded-full ${card.bgColor} flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
