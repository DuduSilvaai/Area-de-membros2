'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Globe,
  Sun,
  Moon,
  MessageCircle
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meus Portais', href: '/portals', icon: Globe },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Chat & Mentoria', href: '/chat', icon: MessageCircle },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <div className="fixed left-3 top-3 h-[calc(100vh-24px)] w-[260px] flex flex-col bg-[var(--bg-sidebar)] backdrop-blur-md border-r border-[var(--bg-sidebar-border)] rounded-xl shadow-xl transition-all duration-300 z-50">

      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[var(--bg-sidebar-border)]">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-[var(--primary-main)] to-[var(--primary-hover)] tracking-tighter uppercase m-0">
          MOZART
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-2">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-br from-[var(--primary-main)] to-[var(--primary-hover)] text-[var(--text-on-primary)] shadow-[0_8px_24px_rgba(255,45,120,0.25)] font-semibold'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)]'
                }
              `}
            >
              <item.icon
                size={20}
                className={`shrink-0 ${isActive ? 'text-[var(--text-on-primary)]' : 'currentColor'}`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-3 border-y border-[var(--bg-sidebar-border)]">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-sm font-medium text-[var(--text-secondary)] bg-transparent hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--text-primary)] rounded-2xl transition-all duration-200"
          title={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <Moon size={20} className="shrink-0" />
          ) : (
            <Sun size={20} className="shrink-0" />
          )}
          <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
        </button>
      </div>

      {/* Footer / Logout */}
      <div className="p-3 shrink-0">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-sm font-medium text-[var(--status-error)] bg-transparent hover:bg-red-500/10 rounded-2xl transition-all duration-200"
        >
          <LogOut size={20} className="shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
