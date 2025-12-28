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
  Moon
} from 'lucide-react';

const MENU_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Meus Portais', href: '/portals', icon: Globe },
  { name: 'Times', href: '/', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: BarChart3 },
  { name: 'Configurações', href: '/settings', icon: Settings },
  { name: 'Usuários', href: '/users', icon: Users },

];

export default function Sidebar() {
  const pathname = usePathname();
  // Using explicit connection to Context
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  return (
    <div
      style={{
        position: 'fixed',
        left: '12px',
        top: '12px',
        height: 'calc(100vh - 24px)',
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-sidebar)',
        backdropFilter: 'var(--sidebar-glass)',
        WebkitBackdropFilter: 'var(--sidebar-glass)',
        borderRight: '1px solid var(--bg-sidebar-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--sidebar-shadow)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '24px',
          paddingRight: '24px',
          borderBottom: '1px solid var(--bg-sidebar-border)',
        }}
      >
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-hover) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          MOZART
        </h1>
      </div>

      {/* Menu */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingTop: '20px',
          paddingBottom: '20px',
          paddingLeft: '12px',
          paddingRight: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                transition: 'all 0.2s ease',
                background: isActive
                  ? 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-hover) 100%)'
                  : 'transparent',
                color: isActive ? 'var(--text-on-primary)' : 'var(--text-secondary)',
                boxShadow: isActive
                  ? '0 8px 24px rgba(255, 45, 120, 0.25)'
                  : 'none',
                // border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              <item.icon
                style={{
                  width: '20px',
                  height: '20px',
                  color: isActive ? 'var(--text-on-primary)' : 'currentColor',
                  flexShrink: 0,
                }}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid var(--bg-sidebar-border)',
          borderBottom: '1px solid var(--bg-sidebar-border)',
        }}
      >
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            width: '100%',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--sidebar-item-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title={`Alternar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          {theme === 'light' ? (
            <Moon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          ) : (
            <Sun style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          )}
          <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
        </button>
      </div>

      {/* Rodapé do Menu */}
      <div
        style={{
          padding: '12px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={signOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            width: '100%',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--status-error)',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            // We can use a slight opacity of error color for hover
            e.currentTarget.style.backgroundColor = 'rgba(214, 48, 49, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <LogOut style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
}
