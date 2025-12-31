'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { HeroBanner } from '@/components/members/HeroBanner';
import { ContinueWatching } from '@/components/members/ContinueWatching';
import { OverallProgressBar } from '@/components/members/OverallProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlayCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Types
interface Content {
    id: string;
    title: string;
    duration_minutes: number | null;
    duration_seconds: number | null;
    order_index: number;
}

interface Module {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    parent_module_id: string | null;
    contents: Content[];
    submodules: Module[];
    image_url?: string | null; // Optional if we add module images later
}

interface Portal {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
}

interface LastViewed {
    lessonId: string;
    lessonTitle: string;
    lessonThumbnail?: string | null;
    moduleTitle: string;
    progress: number;
    updatedAt: string;
}

export default function PortalLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const portalId = params?.portalId as string;

    const [portal, setPortal] = useState<Portal | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [lastViewed, setLastViewed] = useState<LastViewed | null>(null);
    const [totalLessons, setTotalLessons] = useState(0);

    useEffect(() => {
        const loadData = async () => {
            if (!portalId || !user?.id) return;

            try {
                setLoading(true);

                // 1. Fetch Portal Info
                const { data: portalData, error: portalError } = await supabase
                    .from('portals')
                    .select('*')
                    .eq('id', portalId)
                    .single();

                if (portalError) throw portalError;
                setPortal(portalData);

                // 2. Fetch Modules & Contents
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select(`
            id,
            title,
            description,
            order_index,
            parent_module_id,
            contents (
              id,
              title,
              duration_seconds,
              order_index
            )
          `)
                    .eq('portal_id', portalId)
                    .eq('is_active', true)
                    .order('order_index', { ascending: true });

                if (modulesError) throw modulesError;

                // 3. Fetch User Progress
                const { data: progressData } = await supabase
                    .from('progress')
                    .select('content_id, updated_at, is_completed, last_position')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                const completedSet = new Set<string>();
                let totalLessonCount = 0;
                let lastViewedLesson: LastViewed | null = null;

                // Process Progress
                if (progressData) {
                    progressData.forEach(p => {
                        if (p.is_completed) completedSet.add(p.content_id);
                    });
                }
                setCompletedLessons(completedSet);

                // Process Modules & Find Last Viewed
                const processedModules: Module[] = (modulesData || []).map((mod: any) => {
                    totalLessonCount += (mod.contents?.length || 0);
                    return {
                        ...mod,
                        contents: (mod.contents || []).sort((a: any, b: any) => a.order_index - b.order_index),
                        submodules: [] // Flat for now unless we need recursion for display
                    };
                });

                // Determine "Continue Watching" based on most recent progress
                if (progressData && progressData.length > 0) {
                    const lastActivity = progressData[0];
                    // Find lesson details
                    for (const mod of processedModules) {
                        const lesson = mod.contents.find((c: any) => c.id === lastActivity.content_id);
                        if (lesson) {
                            lastViewedLesson = {
                                lessonId: lesson.id,
                                lessonTitle: lesson.title,
                                moduleTitle: mod.title,
                                progress: lastActivity.is_completed ? 100 : (lastActivity.last_position ? 50 : 0), // Estimate if no duration
                                updatedAt: lastActivity.updated_at
                            };
                            break;
                        }
                    }
                }

                // If no history, suggest first lesson of first module
                if (!lastViewedLesson && processedModules.length > 0 && processedModules[0].contents.length > 0) {
                    const firstLesson = processedModules[0].contents[0];
                    lastViewedLesson = {
                        lessonId: firstLesson.id,
                        lessonTitle: firstLesson.title,
                        moduleTitle: processedModules[0].title,
                        progress: 0,
                        updatedAt: new Date().toISOString()
                    }
                }

                setModules(processedModules);
                setTotalLessons(totalLessonCount);
                setLastViewed(lastViewedLesson);

            } catch (error) {
                console.error('Error loading lobby:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [portalId, user?.id]);

    const overallProgress = totalLessons > 0
        ? (completedLessons.size / totalLessons) * 100
        : 0;

    const calculateModuleProgress = (module: Module) => {
        const modTotal = module.contents.length;
        if (modTotal === 0) return 0;
        const modCompleted = module.contents.filter(c => completedLessons.has(c.id)).length;
        return Math.round((modCompleted / modTotal) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0F12] p-8 space-y-8">
                <Skeleton className="w-full h-[400px] rounded-2xl bg-zinc-800" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <Skeleton className="h-8 w-48 bg-zinc-800" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-zinc-800" />)}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-64 rounded-xl bg-zinc-800" />
                    </div>
                </div>
            </div>
        )
    }

    if (!portal) return null;

    return (
        <div className="min-h-screen bg-[#0F0F12] text-white selection:bg-pink-500/30">
            {/* Header / Nav could go here if separate */}

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">

                {/* Hero Section */}
                <section>
                    <HeroBanner
                        title={portal.name}
                        description={portal.description}
                        imageUrl={portal.image_url}
                        onStartConfig={lastViewed ? {
                            label: overallProgress > 0 ? "Continuar Curso" : "Iniciar Curso",
                            onClick: () => router.push(`/members/${portalId}/lesson/${lastViewed?.lessonId}`)
                        } : undefined}
                    />
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Modules Grid */}
                    <div className="lg:col-span-8 flex flex-col gap-10">
                        {/* Modules Grid */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <PlayCircle className="text-pink-500" />
                                Módulos do Curso
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {modules.map((module) => {
                                    const progress = calculateModuleProgress(module);
                                    return (
                                        <motion.div
                                            key={module.id}
                                            whileHover={{ y: -4 }}
                                            className="group bg-[#1A1A1E] border border-white/5 rounded-xl p-5 hover:border-pink-500/30 transition-all cursor-pointer shadow-card hover:shadow-floating"
                                            onClick={() => {
                                                if (module.contents.length > 0) {
                                                    router.push(`/members/${portalId}/lesson/${module.contents[0].id}`)
                                                }
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                                                    <PlayCircle className="w-5 h-5 text-pink-500 group-hover:text-white" />
                                                </div>
                                                <span className="text-xs font-mono text-zinc-500">
                                                    {module.contents.length} AULAS
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-lg mb-2 group-hover:text-pink-400 transition-colors line-clamp-1">
                                                {module.title}
                                            </h3>
                                            <p className="text-sm text-zinc-400 line-clamp-2 mb-4 h-10">
                                                {module.description || "Sem descrição disponível."}
                                            </p>

                                            <div className="relative h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-pink-500 transition-all duration-500"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-2 text-xs text-zinc-500">
                                                <span>{progress}% Concluído</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar Widgets */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Overall Progress */}
                        <div className="bg-[#1A1A1E] border border-white/5 rounded-2xl p-6 shadow-card">
                            <OverallProgressBar progress={overallProgress} />

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-white mb-1">{completedLessons.size}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Aulas Vistas</div>
                                </div>
                                <div className="bg-zinc-900/50 rounded-lg p-3 text-center">
                                    <div className="text-2xl font-bold text-zinc-400 mb-1">{totalLessons}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Total Aulas</div>
                                </div>
                            </div>
                        </div>

                        {/* Continue Watching */}
                        {lastViewed && (
                            <div className="h-64">
                                <ContinueWatching
                                    lessonId={lastViewed.lessonId}
                                    portalId={portalId}
                                    title={lastViewed.lessonTitle}
                                    progressPercentage={lastViewed.progress}
                                    timeLeft="2 min"
                                />
                            </div>
                        )}

                        {/* Support or Extra Info */}
                        <div className="bg-[#1A1A1E] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-pink-500" />
                                Histórico Recente
                            </h3>
                            <div className="space-y-3">
                                <p className="text-sm text-zinc-400 text-center py-4 italic">
                                    Seu histórico de atividades aparecerá aqui.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
