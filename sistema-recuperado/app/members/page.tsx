'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import EventCard from '@/components/members/EventCard';
import { Play, Clock, Info, ChevronRight, Lock } from 'lucide-react';

interface Portal {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  progress: number;
  last_accessed?: string;
  total_lessons?: number;
}

export default function MemberDashboard() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCourse, setLastCourse] = useState<Portal | null>(null);
  const { user } = useAuth();
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);

  // Background premium (Netflix style)
  const heroImage = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2070&auto=format&fit=crop'; // Abstract dark premium background

  useEffect(() => {
    const loadPortals = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch user enrollments (permissions will be used later for module filtering)
        const { data: enrollmentData, error: enrollmentError } = await supabase
          .from('enrollments')
          .select(`
            portal_id,
            permissions,
            portals!inner (
              id,
              name,
              description,
              image_url,
              created_at
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (enrollmentError) throw enrollmentError;

        if (!enrollmentData || enrollmentData.length === 0) {
          setPortals([]);
          setLastCourse(null);
          setLoading(false);
          return;
        }

        // Get IDs for progress calculation
        const portalIds = enrollmentData.map((e: any) => e.portal_id);

        // Fetch total modules/contents counts per portal
        // Note: For a real large-scale app, this should be a view or RPC, but here client-side agg is fine for < 50 courses
        const { data: modulesData } = await supabase
          .from('modules')
          .select(`
            id,
            portal_id,
            contents (id)
          `)
          .in('portal_id', portalIds)
          .eq('is_active', true);

        // Fetch user's completed items
        const { data: progressData } = await supabase
          .from('progress')
          .select('content_id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        const completedContentIds = new Set((progressData || []).map(p => p.content_id));

        // Aggregate stats
        const portalStats = new Map<string, { total: number; completed: number }>();

        (modulesData || []).forEach((mod: any) => {
          const pid = mod.portal_id;
          if (!portalStats.has(pid)) portalStats.set(pid, { total: 0, completed: 0 });

          const stats = portalStats.get(pid)!;
          const contentCount = mod.contents?.length || 0;
          stats.total += contentCount;

          (mod.contents || []).forEach((c: any) => {
            if (completedContentIds.has(c.id)) stats.completed++;
          });
        });

        const formattedPortals = enrollmentData.map((enrollment: any) => {
          const portal = enrollment.portals as any;
          const stats = portalStats.get(portal.id) || { total: 0, completed: 0 };
          const progress = stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0;

          return {
            id: portal.id,
            name: portal.name,
            description: portal.description,
            image_url: portal.image_url,
            progress,
            total_lessons: stats.total,
            created_at: portal.created_at
          };
        });

        setPortals(formattedPortals);

        // Simple logic for "Continue Watching": select the first one with progress > 0 and < 100, 
        // or just the first available if none match.
        const inProgress = formattedPortals.find(p => p.progress > 0 && p.progress < 100);
        setLastCourse(inProgress || formattedPortals[0] || null);

      } catch (error) {
        console.error('Erro ao buscar portais:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadPortals();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#141414]">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white selection:bg-red-900 selection:text-white pb-20">

      {/* Hero / Highlight Section */}
      <div className="relative w-full h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
          <span className="text-red-500 font-bold tracking-widest text-sm mb-4 uppercase">
            Área do Aluno
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-tight max-w-3xl">
            Bem-vindo de volta,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              {user?.email?.split('@')[0]}
            </span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mb-8 line-clamp-3">
            Continue sua jornada de aprendizado. Você tem {portals.length} curso(s) disponíveis para assistir agora mesmo.
          </p>

          <div className="flex flex-wrap gap-4">
            {lastCourse && (
              <Link
                href={`/members/${lastCourse.id}`}
                className="flex items-center space-x-3 bg-white text-black px-8 py-3 rounded hover:bg-gray-200 transition-colors font-semibold text-lg"
              >
                <Play className="w-6 h-6 fill-current" />
                <span>
                  {lastCourse.progress > 0 ? 'Continuar Assistindo' : 'Começar Agora'}
                </span>
              </Link>
            )}

            <button className="flex items-center space-x-3 bg-gray-600/60 backdrop-blur-sm text-white px-8 py-3 rounded hover:bg-gray-600/80 transition-colors font-semibold text-lg">
              <Info className="w-6 h-6" />
              <span>Mais Informações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">

        {/* Optional Events/Banners Row */}
        {/* <div className="mb-12">
           <EventCard />
        </div> */}

        <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-red-600">
          Meus Cursos
        </h2>

        {portals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-[#1f1f1f] rounded-lg border border-white/5">
            <div className="bg-white/5 p-6 rounded-full mb-6">
              <Lock className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Sem cursos disponíveis</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              Você ainda não possui matrículas ativas. Entre em contato com seu administrador para liberar seu acesso.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {portals.map((portal) => (
              <Link
                key={portal.id}
                href={`/members/${portal.id}`}
                className="group relative flex flex-col transition-all duration-300 ease-in-out hover:z-10 hover:scale-105"
                onMouseEnter={() => setHoveredPortal(portal.id)}
                onMouseLeave={() => setHoveredPortal(null)}
              >
                {/* Image Card */}
                <div className="relative aspect-video rounded-md overflow-hidden bg-[#242424] shadow-lg group-hover:shadow-2xl ring-1 ring-white/5 group-hover:ring-white/20">
                  {portal.image_url ? (
                    <img
                      src={portal.image_url}
                      alt={portal.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:saturate-150"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <Play className="w-12 h-12 text-white/20" />
                    </div>
                  )}

                  {/* Progress Bar (Always visible at bottom) */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700/50">
                    <div
                      className="h-full bg-red-600"
                      style={{ width: `${portal.progress}%` }}
                    />
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                      <Play className="w-6 h-6 text-white fill-current" />
                    </div>
                  </div>
                </div>

                {/* Info (Appears below) */}
                <div className="mt-3 px-1">
                  <h3 className="text-base font-semibold text-gray-100 group-hover:text-white line-clamp-1">
                    {portal.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                    <span className="text-green-500 font-medium">{portal.progress}% Concluído</span>
                    <span>•</span>
                    <span>{portal.total_lessons} Aulas</span>
                  </div>
                  {portal.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2 h-8 hidden group-hover:block transition-all">
                      {portal.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
