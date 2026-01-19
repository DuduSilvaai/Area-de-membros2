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
  LogOut,
  Globe,
  Sun,
  Moon,
  MessageCircle,
  MessageSquareText
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meus Portais', href: '/portals', icon: Globe },
  { name: 'Usuários', href: '/users', icon: Users },
  { name: 'Chat & Mentoria', href: '/chat', icon: MessageCircle },
  { name: 'Comentários', href: '/comments', icon: MessageSquareText },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <div className="fixed left-3 top-3 h-[calc(100vh-24px)] w-[260px] flex flex-col bg-white dark:bg-gray-800 backdrop-blur-md border-r border-gray-200 dark:border-gray-700 rounded-xl shadow-xl transition-all duration-300 z-50">

      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-600 to-pink-700 tracking-widest uppercase m-0">
          LOVE FOR SWEET
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
                  ? 'bg-gradient-to-br from-pink-600 to-pink-700 text-white shadow-lg font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <item.icon
                size={20}
                className={`shrink-0 ${isActive ? 'text-white' : 'currentColor'}`}
              />
              <span>{item.name}</span>
            </Link>
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
