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
    <div 
      className="fixed left-0 top-0 h-screen flex flex-col border-r"
      style={{
        width: '260px',
        backgroundColor: '#F1F3F5',
        borderColor: '#E9ECEF',
      }}
    >
      {/* Logo */}
      <div 
        className="flex items-center px-6 border-b flex-shrink-0"
        style={{
          height: '64px',
          borderColor: '#E9ECEF',
        }}
      >
        <h1 
          className="text-xl font-bold tracking-tight"
          style={{ color: '#FF2D78' }}
        >
          MOZART
        </h1>
      </div>

      {/* Menu */}
      <nav 
        className="flex-1 overflow-y-auto py-6 px-3"
        style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}
      >
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: isActive ? '#FF2D78' : 'transparent',
                color: isActive ? '#FFFFFF' : '#636E72',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '4px',
              }}
            >
              <item.icon 
                style={{
                  width: '20px',
                  height: '20px',
                  color: isActive ? '#FFFFFF' : '#636E72',
                  flexShrink: 0,
                }}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Rodapé do Menu */}
      <div 
        className="p-4 border-t flex-shrink-0"
        style={{ borderColor: '#E9ECEF' }}
      >
        <button 
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium rounded-md transition-colors"
          style={{
            color: '#D63031',
            padding: '10px 12px',
            backgroundColor: 'transparent',
            gap: '12px',
          }}
        >
          <LogOut style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
