'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  LogOut,
  Globe,
  Sun,
  Moon,
  MessageCircle,
  MessageSquareText,
  Star,
  Loader2
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meus Portais', href: '/portals', icon: Globe },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Chat & Mentoria', href: '/chat', icon: MessageCircle },
  { name: 'Comentários', href: '/comments', icon: MessageSquareText },
  { name: 'Avaliações', href: '/evaluations', icon: Star },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  // Local state for immediate loading feedback without blocking navigation
  const [clickedHref, setClickedHref] = React.useState<string | null>(null);

  const handleNavigation = (href: string) => {
    if (pathname === href) return;
    setClickedHref(href);
    router.push(href);
  };

  // Reset loading state when navigation completes (pathname changes)
  React.useEffect(() => {
    setClickedHref(null);
  }, [pathname]);

  return (
    <div className="fixed left-3 top-3 h-[calc(100vh-24px)] w-[260px] flex flex-col bg-white dark:bg-gray-800 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 rounded-xl shadow-xl transition-all duration-300 z-50">

      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1
          className="text-3xl text-transparent bg-clip-text bg-gradient-to-br from-pink-600 to-pink-700 dark:from-pink-400 dark:to-pink-600 m-0 pb-1"
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          Love for Sweet
        </h1>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-5 px-3 flex flex-col gap-2">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const isLoading = clickedHref === item.href;

          return (
            <button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
              disabled={isLoading}
              className={`
                flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 w-full text-left
                ${isActive
                  ? 'bg-gradient-to-br from-pink-600 to-pink-700 text-white shadow-lg font-semibold'
                  : isLoading
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              {isLoading ? (
                <Loader2 size={20} className="shrink-0 animate-spin" />
              ) : (
                <item.icon
                  size={20}
                  className={`shrink-0 ${isActive ? 'text-white' : ''}`}
                />
              )}
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="p-3 border-y border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-sm font-medium text-gray-600 dark:text-gray-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white rounded-2xl transition-all duration-200"
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
          className="flex items-center gap-3 px-3.5 py-2.5 w-full text-sm font-medium text-red-600 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-200"
        >
          <LogOut size={20} className="shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}

