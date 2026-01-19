'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Loader2, RefreshCw } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabaseClient';
import CourseCard from '@/components/members/CourseCard';

const BRAND_LOGO = "https://cdn-icons-png.flaticon.com/512/2964/2964063.png";

interface Portal {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
  logo?: string;
  settings?: any;
}

export default function MobilePortalSelection() {
  const router = useRouter();
  const { theme } = useTheme();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);

  const fetchPortals = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('portals')
        .select('*');

      if (error) {
        console.error('Error fetching portals:', error);
      } else {
        setPortals(data || []);
        if (forceRefresh) {
          setLastRefresh(new Date());
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      if (forceRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPortals();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <Loader2 className="w-8 h-8 animate-spin text-mozart-pink" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-[#0a0a0a] selection:bg-mozart-pink selection:text-white">

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-black/50 dark:to-black z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center h-full px-6 py-8">

        {/* Header - More Compact */}
        <div
          className={`text-center mb-8 md:mb-12 shrink-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${hoveredPortal ? 'opacity-30 blur-sm scale-95' : 'opacity-100 blur-0 scale-100'}`}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.1)] dark:shadow-[0_0_30px_rgba(255,255,255,0.05)] transform hover:rotate-12 transition-transform duration-500">
            <img
              src={BRAND_LOGO}
              className={`w-8 h-8 object-contain transition-all duration-500 ${theme === 'dark' ? 'filter brightness-0 invert' : 'filter brightness-0 opacity-80'}`}
              alt="Logo"
            />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-4 tracking-tighter leading-tight">
            Selecione seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-mozart-pink to-purple-600 animate-gradient-x">Domínio</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-light w-full max-w-2xl mx-auto tracking-wide">
            Entre em um ambiente especializado projetado para <span className="text-gray-900 dark:text-white font-medium">trabalho profundo</span> e flow.
          </p>

          {/* Refresh Button */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchPortals(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Atualizando...' : 'Atualizar Portais'}
            </button>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              Última atualização: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* The Portals Grid - Switched from Custom Inline to CourseCard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl justify-items-center">
          {portals.map((portal) => {
            // Map Portal Data to Course Format
            const courseData = {
              id: portal.id,
              title: portal.name,
              thumbnail: portal.settings?.banner_url || portal.image_url,
              progress: 0, // Default to 0 as we don't have portal-level progress summary yet
              author: 'Mozart Academy',
              total_lessons: 0 // Placeholder
            };

            return (
              <div
                key={portal.id}
                className="w-full flex justify-center transform hover:-translate-y-2 transition-transform duration-300"
                onMouseEnter={() => setHoveredPortal(portal.id)}
                onMouseLeave={() => setHoveredPortal(null)}
              >
                <CourseCard course={courseData} />
              </div>
            );
          })}
        </div>

        {/* Footer - Stick to bottom of container but fade out */}
        <div className={`mt-8 md:mt-12 transition-opacity duration-500 ${hoveredPortal ? 'opacity-0' : 'opacity-40'}`}>
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-[0.3em] uppercase">
            <Command size={12} /> Powered by Mozart LMS
          </div>
        </div>

      </div>
    </div>
  );
}
