'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  settings?: Record<string, unknown> | null;
}

export default function MobilePortalSelection() {
  const router = useRouter();
  const { theme } = useTheme();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  const fetchPortals = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('Current user in members page:', user?.id, user?.email);
      
      if (!user) {
        console.log('No user found, redirecting to login');
        router.push('/login');
        return;
      }

      // Add timestamp to force fresh data and bypass any caching
      const timestamp = new Date().getTime();
      console.log('Fetching fresh data at:', timestamp);

      // Use a more aggressive cache-busting approach
      const { data: userEnrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select('portal_id, permissions, enrolled_at')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false }); // Order by most recently enrolled

      console.log('User enrollments:', userEnrollments, 'Error:', enrollError);

      if (enrollError) {
        console.error('Error fetching enrollments:', enrollError);
        setPortals([]);
        return;
      }

      if (!userEnrollments || userEnrollments.length === 0) {
        console.log('No active enrollments found');
        setPortals([]);
        setLastRefresh(new Date());
        return;
      }

      // Get portal IDs from enrollments
      const portalIds = userEnrollments.map(e => e.portal_id);
      console.log('Portal IDs from enrollments:', portalIds);

      // Fetch portals by IDs with fresh data
      const { data: portalData, error: portalError } = await supabase
        .from('portals')
        .select('*')
        .in('id', portalIds)
        .eq('is_active', true)
        .order('name');

      console.log('Fetched portals:', portalData, 'Error:', portalError);

      if (portalError) {
        console.error('Error fetching portals:', portalError);
        setPortals([]);
      } else {
        // Fix the settings type issue
        const fixedPortals = (portalData || []).map(portal => ({
          ...portal,
          settings: portal.settings as Record<string, unknown> | null
        }));
        setPortals(fixedPortals);
      }
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    // Set up realtime subscriptions FIRST, then fetch initial data
    // This prevents race conditions where admin changes happen before subscription is ready
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Setting up realtime subscription for user:', user.id);

      // Subscribe to enrollment changes for this user
      const enrollmentSubscription = supabase
        .channel('enrollment-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'enrollments',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Enrollment change detected:', payload);
            
            // Show notification
            const eventType = payload.eventType;
            setRealtimeNotification(`Acesso ${eventType === 'DELETE' ? 'removido' : 'atualizado'} em tempo real!`);
            
            // Clear notification after 3 seconds
            setTimeout(() => setRealtimeNotification(null), 3000);
            
            // Refresh portals when enrollment changes
            fetchPortals();
          }
        )
        .subscribe((status) => {
          console.log('Enrollment subscription status:', status);
          setRealtimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'connecting');
        });

      // Also subscribe to portal changes (in case portal is deactivated)
      const portalSubscription = supabase
        .channel('portal-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'portals'
          },
          (payload) => {
            console.log('Portal change detected:', payload);
            
            // Show notification for portal changes
            setRealtimeNotification('Portal atualizado em tempo real!');
            setTimeout(() => setRealtimeNotification(null), 3000);
            
            // Refresh portals when any portal changes
            fetchPortals();
          }
        )
        .subscribe((status) => {
          console.log('Portal subscription status:', status);
        });

      // Cleanup subscriptions on unmount
      return () => {
        console.log('Cleaning up realtime subscriptions');
        supabase.removeChannel(enrollmentSubscription);
        supabase.removeChannel(portalSubscription);
      };
    };

    // Set up subscriptions first
    const cleanup = setupRealtimeSubscription();

    // Then fetch initial data after a small delay to ensure subscriptions are ready
    setTimeout(() => {
      fetchPortals();
    }, 100);

    // Set up an interval to refresh data every 15 seconds as backup (reduced from 30)
    const interval = setInterval(() => {
      console.log('Auto-refreshing portal data...');
      fetchPortals();
    }, 15000); // 15 seconds

    // Cleanup interval and subscriptions on unmount
    return () => {
      clearInterval(interval);
      cleanup?.then(cleanupFn => cleanupFn?.());
    };
  }, [fetchPortals]);

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

      {/* Realtime Notification */}
      {realtimeNotification && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
            {realtimeNotification}
          </div>
        </div>
      )}

      {/* Realtime Status Indicator */}
      <div className="fixed top-4 left-4 z-40">
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
          realtimeStatus === 'connected' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
            : realtimeStatus === 'connecting'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            realtimeStatus === 'connected' ? 'bg-green-500' : 
            realtimeStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
            'bg-red-500'
          }`}></div>
          {realtimeStatus === 'connected' ? 'Tempo Real Ativo' : 
           realtimeStatus === 'connecting' ? 'Conectando...' : 
           'Desconectado'}
        </div>
      </div>

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
          <p className="text-lg text-gray-500 dark:text-gray-400 font-light w-full max-w-2xl mx-auto tracking-wide mb-6">
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
        {portals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl justify-items-center">
            {portals.map((portal) => {
              // Map Portal Data to Course Format
              const courseData = {
                id: portal.id,
                title: portal.name,
                thumbnail: (portal.settings?.banner_url as string) || portal.image_url,
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
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <Command className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Nenhum Portal Disponível
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Você ainda não tem acesso a nenhum portal. Entre em contato com o administrador para solicitar acesso.
            </p>
          </div>
        )}

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
