'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Plus, FileText, User } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/dashboard', icon: Home, label: 'Accueil' },
    { href: '/historique', icon: History, label: 'Historique' },
    { href: '/demande', icon: Plus, label: 'Nouveau', isMain: true },
    { href: '/transactions', icon: FileText, label: 'Transactions' },
    { href: '/profil', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-50 safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          if (item.isMain) {
            return (
              <Link 
                key={item.href}
                href={item.href} 
                className="flex flex-col items-center gap-1 relative"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center -mt-6 shadow-lg border-4 border-background">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <span className="text-xs text-green-600 font-medium -mt-1">{item.label}</span>
              </Link>
            );
          }
          
          return (
            <Link 
              key={item.href}
              href={item.href} 
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                isActive 
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
