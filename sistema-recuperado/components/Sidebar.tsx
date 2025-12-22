'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Globe
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meus Portais', href: '/portals', icon: Globe },
  { name: 'Times', href: '/', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'ViewAI', href: '/viewai', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-sidebar dark:bg-sidebar border-r border-border dark:border-border h-screen flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border dark:border-border">
        <h1 className="text-xl font-bold text-primary-main tracking-tight">MOZART</h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary-main text-text-on-primary'
                  : 'text-text-secondary hover:bg-background-canvas hover:text-text-primary dark:text-text-secondary dark:hover:bg-background-canvas dark:hover:text-text-primary'
                }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-text-on-primary' : 'text-text-secondary'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé do Menu */}
      <div className="p-4 border-t border-border dark:border-border">
        <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-status-error hover:bg-primary-subtle dark:hover:bg-primary-subtle rounded-md transition-colors">
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
