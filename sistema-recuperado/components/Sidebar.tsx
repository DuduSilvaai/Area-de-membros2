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
  { name: 'ViewAI', href: '/viewai', icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  const handleThemeToggle = () => {
    const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };

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
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.8)',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.05)',
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
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <h1 
          style={{
            fontSize: '22px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FF2D78 0%, #E61E6A 100%)',
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
                  ? 'linear-gradient(135deg, #FF2D78 0%, #E61E6A 100%)'
                  : 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                boxShadow: isActive 
                  ? '0 8px 24px rgba(255, 45, 120, 0.25)'
                  : 'none',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : 'none',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <item.icon 
                style={{
                  width: '20px',
                  height: '20px',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
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
          borderTop: '1px solid rgba(255, 255, 255, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
        }}
      >
        <button 
          onClick={handleThemeToggle}
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
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Alternar tema"
        >
          <Sun style={{ width: '20px', height: '20px', flexShrink: 0 }} />
          <span>Tema</span>
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
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            width: '100%',
            fontSize: '14px',
            fontWeight: '500',
            color: '#D63031',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
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
