'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import EventCard from '@/components/members/EventCard';

interface Portal {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  progress: number;
  last_accessed?: string;
}

export default function MemberDashboard() {
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastCourse, setLastCourse] = useState<Portal | null>(null);
  const { user } = useAuth();

  // Placeholder para a imagem do herói
  const heroImage = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80';

  useEffect(() => {
    const loadPortals = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);

        // Fetch only portals where user has active enrollment
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

        // Get all content IDs for these portals to calculate progress
        const portalIds = enrollmentData.map((e: any) => e.portal_id);

        // Fetch modules and contents for these portals
        const { data: modulesData } = await supabase
          .from('modules')
          .select(`
            id,
            portal_id,
            contents (id)
          `)
          .in('portal_id', portalIds)
          .eq('is_active', true);

        // Fetch user's completed progress
        const { data: progressData } = await supabase
          .from('progress')
          .select('content_id')
          .eq('user_id', user.id)
          .eq('is_completed', true);

        const completedContentIds = new Set((progressData || []).map(p => p.content_id));

        // Build content count per portal
        const portalContentMap = new Map<string, { total: number; completed: number }>();
        (modulesData || []).forEach((mod: any) => {
          const portalId = mod.portal_id;
          if (!portalContentMap.has(portalId)) {
            portalContentMap.set(portalId, { total: 0, completed: 0 });
          }
          const portalStats = portalContentMap.get(portalId)!;
          (mod.contents || []).forEach((content: any) => {
            portalStats.total++;
            if (completedContentIds.has(content.id)) {
              portalStats.completed++;
            }
          });
        });

        // Format portals with real progress
        const formattedPortals = enrollmentData.map((enrollment: any) => {
          const portal = enrollment.portals as any;
          const stats = portalContentMap.get(portal.id) || { total: 0, completed: 0 };
          const progress = stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0;

          return {
            id: portal.id,
            name: portal.name,
            description: portal.description,
            image_url: portal.image_url,
            progress,
            created_at: portal.created_at
          };
        });

        setPortals(formattedPortals);

        // Define o primeiro curso como último acessado (se houver)
        if (formattedPortals.length > 0) {
          setLastCourse(formattedPortals[0]);
        }
      } catch (error) {
        console.error('Erro ao buscar portais:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadPortals();
    }
  }, [user]);

  // Componente de loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero Section */}
      <div
        className="relative h-96 flex items-center justify-center bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-center text-white max-w-4xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bem-vindo(a) de volta, {user?.email?.split('@')[0]}!
          </h1>
          <p className="text-xl mb-8">Continue aprendendo e aprimorando suas habilidades</p>

          {lastCourse && (
            <Link
              href={`/members/${lastCourse.id}`}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-8 transition-colors"
            >
              Continuar {lastCourse.name}
            </Link>
          )}
        </div>
      </div>

      {/* Cursos em Destaque */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <EventCard />
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Meus Cursos</h2>

          {portals.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 px-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum curso disponível</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Você ainda não possui acesso a nenhum curso. Se você acabou de se matricular, aguarde a liberação ou entre em contato com o suporte.
              </p>
              <a
                href="https://wa.me/5511999999999" // Replace with actual support link
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Falar com o Suporte
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {portals.map((portal) => (
                <div
                  key={portal.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
                >
                  <Link href={`/members/${portal.id}`} className="block">
                    <div className="h-40 bg-gray-200 relative">
                      {portal.image_url ? (
                        <img
                          src={portal.image_url}
                          alt={portal.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <span className="text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                        <span className="text-xs text-white font-medium">
                          {portal.progress}% concluído
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{ width: `${portal.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link href={`/members/${portal.id}`} className="hover:text-indigo-600 transition-colors">
                        {portal.name}
                      </Link>
                    </h3>

                    {portal.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                        {portal.description}
                      </p>
                    )}

                    <div className="mt-auto">
                      <Link
                        href={`/members/${portal.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors inline-flex items-center"
                      >
                        {portal.progress > 0 ? 'Continuar Assistindo' : 'Acessar Curso'}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
