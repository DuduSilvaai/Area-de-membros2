'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import CinematicHeader from '@/components/cinematic/CinematicHeader';
import CinematicPortalCard from '@/components/cinematic/PortalCard';
import BackgroundEffects from '@/components/cinematic/BackgroundEffects';

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
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [hoveredPortalId, setHoveredPortalId] = useState<string | null>(null);

  const fetchPortals = async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data, error } = await supabase
        .from('portals')
        .select('id, name, image_url, description, settings');

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
      <div className="h-screen w-full flex items-center justify-center bg-brand-dark">
        <Loader2 className="w-8 h-8 animate-spin text-brand-pink" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative bg-gray-50 dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-brand-pink/30 selection:text-brand-pink overflow-hidden">

      <BackgroundEffects />

      <main className="relative z-10 w-full h-full flex flex-col justify-start items-center overflow-hidden pt-2 md:pt-4">
        <CinematicHeader />

        {/* Refresh Button - Integrated nicely below header */}
        <div className="flex flex-col items-center justify-center gap-1 mb-2 -mt-4 animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          <button
            onClick={() => fetchPortals(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 backdrop-blur-md border border-gray-200 dark:border-white/10 hover:border-brand-pink/30 rounded-full text-[9px] font-medium text-gray-600 dark:text-gray-400 hover:text-brand-pink dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-brand-pink' : 'group-hover:text-brand-pink transition-colors'}`} />
            {refreshing ? 'Atualizando bases...' : 'Atualizar Portais'}
          </button>

          <div className="text-[10px] text-gray-600 font-mono tracking-wider">
            Última sincronização: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>

        {/* Horizontal Scroll Layout */}
        <div className="w-full h-full overflow-x-auto overflow-y-hidden pb-4 px-4 sm:px-8 custom-scrollbar scrollbar-none">
          <div className="flex flex-nowrap gap-8 md:gap-12 min-w-min mx-auto justify-center items-start pt-2 h-full">
            {portals.map((portal, index) => {
              const isHovered = hoveredPortalId === portal.id;
              const isAnyHovered = hoveredPortalId !== null;

              return (
                <div
                  key={portal.id}
                  className={`w-[280px] md:w-[320px] flex-shrink-0 animate-slide-up transition-all duration-500 ease-out
                  ${isHovered ? 'scale-[1.01] -translate-y-1 z-20 brightness-110 drop-shadow-[0_0_35px_rgba(255,45,120,0.6)]' : ''}
                  ${isAnyHovered && !isHovered ? 'scale-95 grayscale opacity-40 blur-[1px]' : 'hover:-translate-y-1'}
                `}
                  style={{ animationDelay: `${index * 150}ms` }}
                  onMouseEnter={() => setHoveredPortalId(portal.id)}
                  onMouseLeave={() => setHoveredPortalId(null)}
                >
                  <Link href={`/members/${portal.id}`}>
                    <CinematicPortalCard
                      title={portal.name}
                      subtitle={portal.description || "Mozart Academy"}
                      imageUrl={portal.settings?.banner_url || portal.image_url}
                      progress={0} // Default as per requirements
                      isLocked={false}
                    />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
