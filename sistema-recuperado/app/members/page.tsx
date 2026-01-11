'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Loader2 } from 'lucide-react';
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
  settings?: Record<string, unknown>;
}

export default function MobilePortalSelection() {
  const router = useRouter();
  const { theme } = useTheme();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPortals() {
      try {
        const { data, error } = await supabase
          .from('portals')
          .select('*');

        if (error) {
          console.error('Error fetching portals:', error);
        } else {
          setPortals(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    }

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
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a] selection:bg-mozart-pink selection:text-white">

      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white dark:via-black/50 dark:to-black z-0 pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col items-center justify-center min-h-screen px-6 py-12">

        {/* Header */}
        <div className="text-center mb-16 w-full max-w-4xl">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-8 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl transform hover:rotate-12 transition-transform duration-500">
            <img
              src={BRAND_LOGO}
              className={`w-10 h-10 object-contain transition-all duration-500 ${theme === 'dark' ? 'filter brightness-0 invert' : 'filter brightness-0 opacity-80'}`}
              alt="Logo"
            />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-gray-900 dark:text-white mb-6 tracking-tighter leading-tight">
            Selecione seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF0080] to-purple-600 animate-gradient-x">Domínio</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 font-light w-full max-w-2xl mx-auto tracking-wide">
            Entre em um ambiente especializado projetado para <span className="text-gray-900 dark:text-white font-medium">trabalho profundo</span> e flow.
          </p>
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
              <div key={portal.id} className="w-full flex justify-center transform hover:-translate-y-2 transition-transform duration-300">
                <CourseCard course={courseData} />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-20 opacity-40">
          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-bold tracking-[0.3em] uppercase">
            <Command size={12} /> Desenvolvido por Mozart LMS
          </div>
        </div>

      </div>
    </div>
  );
}
