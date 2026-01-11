'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { Play, Info, Clock, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import StudentNavbar from '@/components/members/StudentNavbar';

// Types
interface EnrollmentPermissions {
    access_all: boolean;
    allowed_modules: string[];
}

interface Content {
    id: string;
    title: string;
    duration_minutes: number | null;
    duration_seconds: number | null;
    order_index: number;
    video_url?: string | null;
}

interface Module {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    parent_module_id: string | null;
    contents: Content[];
    image_url?: string | null;
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
    moduleTitle: string;
    progress: number;
}

export default function PortalLobbyPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const portalId = params?.portalId as string;

    const [portal, setPortal] = useState<Portal | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastViewed, setLastViewed] = useState<LastViewed | null>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    useEffect(() => {
        const loadData = async () => {
            if (!portalId || !user?.id) return;

            try {
                setLoading(true);

                // 1. Fetch Portal
                const { data: portalData, error: portalError } = await supabase
                    .from('portals')
                    .select('*')
                    .eq('id', portalId)
                    .single();

                if (portalError) throw portalError;
                setPortal(portalData);

                // 1.5 Fetch Enrollment Permissions to filter content
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('permissions')
                    .eq('user_id', user.id)
                    .eq('portal_id', portalId)
                    .eq('is_active', true)
                    .maybeSingle();

                // Default to no access if no enrollment found (or handle as open if your logic dictates)
                // Assuming strict access:
                const rawPermissions = enrollmentData?.permissions as unknown as EnrollmentPermissions | null;
                const permissions: EnrollmentPermissions = rawPermissions || { access_all: false, allowed_modules: [] };

                // 2. Fetch Modules & Contents
                const { data: modulesData, error: modulesError } = await supabase
                    .from('modules')
                    .select(`
                        id,
                        title,
                        description,
                        order_index,
                        image_url,
                        contents (
                            id,
                            title,
                            duration_seconds,
                            order_index,
                            video_url
                        )
                    `)
                    .eq('portal_id', portalId)
                    .eq('is_active', true)
                    .order('order_index', { ascending: true });

                if (modulesError) throw modulesError;

                // Security Filter: Filter modules based on permissions
                const filteredModulesRaw = (modulesData || []).filter((m: Module) => {
                    if (permissions.access_all) return true;
                    // Check if module ID is in allowed_modules array
                    return permissions.allowed_modules?.includes(m.id);
                });

                // Process modules to verify content ordering
                const processedModules = filteredModulesRaw.map((m: Module) => ({
                    ...m,
                    contents: (m.contents || []).sort((a: Content, b: Content) => a.order_index - b.order_index)
                }));
                // Sort modules by order_index
                processedModules.sort((a: Module, b: Module) => a.order_index - b.order_index);

                setModules(processedModules);

                // 3. Fetch User Progress (to determine "Continue Watching")
                const { data: progressData } = await supabase
                    .from('progress')
                    .select('content_id, is_completed, last_position, updated_at')
                    .eq('user_id', user.id)
                    .order('updated_at', { ascending: false });

                const completedSet = new Set<string>();
                if (progressData) {
                    progressData.forEach((p: { content_id: string; is_completed: boolean }) => {
                        if (p.is_completed) completedSet.add(p.content_id);
                    });
                }
                setCompletedLessons(completedSet);

                // Determine Last Viewed Lesson
                let targetLesson: LastViewed | null = null;

                if (progressData && progressData.length > 0) {
                    // Find the latest touched lesson that exists in our modules
                    for (const_prog of progressData) {
                        // Type assertion for loop
                        const prog = const_prog as { content_id: string; is_completed: boolean };
                        for (const mod of processedModules) {
                            const lesson = mod.contents.find((c: Content) => c.id === prog.content_id);
                            if (lesson) {
                                targetLesson = {
                                    lessonId: lesson.id,
                                    lessonTitle: lesson.title,
                                    moduleTitle: mod.title,
                                    progress: prog.is_completed ? 100 : 0
                                };
                                break;
                            }
                        }
                        if (targetLesson) break;
                    }
                }

                // Fallback: First lesson of first module
                if (!targetLesson && processedModules.length > 0 && processedModules[0].contents.length > 0) {
                    const first = processedModules[0].contents[0];
                    targetLesson = {
                        lessonId: first.id,
                        lessonTitle: first.title,
                        moduleTitle: processedModules[0].title,
                        progress: 0
                    };
                }

                setLastViewed(targetLesson);

            } catch (error) {
                console.error("Error loading portal:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [portalId, user?.id]);

    const handleContinue = () => {
        if (lastViewed) {
            router.push(`/members/${portalId}/lesson/${lastViewed.lessonId}`);
        } else {
            toast.info("Nenhuma aula disponível para continuar.");
        }
    };

    const calculateModuleProgress = (module: Module) => {
        const total = module.contents.length;
        if (total === 0) return 0;
        const completed = module.contents.filter(c => completedLessons.has(c.id)).length;
        return Math.round((completed / total) * 100);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0F12] transition-colors duration-500">
                <div className="h-[70vh] bg-zinc-900 animate-pulse"></div>
                <div className="p-12 space-y-8 -mt-20 relative z-10">
                    <Skeleton className="h-8 w-64 bg-zinc-800" />
                    <div className="flex gap-6 overflow-hidden">
                        {[1, 2, 3].map(i => (
                            <Skeleton key={i} className="w-[350px] h-[200px] rounded-xl bg-zinc-800" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!portal) return null;

    return (
        <div className="min-h-screen bg-[#0F0F12] text-white selection:bg-[#FF0080]/30 pb-20 font-sans">
            <StudentNavbar />

            {/* HERO SECTION - Full Width */}
            <div className="relative w-full h-[65vh] md:h-[75vh] flex items-end overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-105 ease-linear"
                    style={{ backgroundImage: `url(${portal.image_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'})` }}
                ></div>

                {/* Gradients for Cinematic Look */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] via-[#0F0F12]/60 to-transparent"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F12] via-[#0F0F12]/50 to-transparent opacity-90"></div>

                {/* Hero Content */}
                <div className="relative z-10 w-full max-w-[1600px] mx-auto px-6 md:px-12 pb-16 md:pb-24">
                    <div className="max-w-3xl animate-fade-in-up">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="inline-block py-1.5 px-4 rounded-full bg-[#FF0080]/10 border border-[#FF0080]/20 text-[#FF0080] text-xs font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(255,0,128,0.1)]">
                                Portal Exclusivo
                            </span>
                            {/* Optional: Add 'New' badge or other meta */}
                        </div>

                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight drop-shadow-lg">
                            {portal.name}
                        </h1>

                        <p className="text-gray-300 text-lg md:text-xl mb-10 line-clamp-3 font-light tracking-wide max-w-2xl leading-relaxed">
                            {portal.description || "Bem-vindo ao portal. Explore os módulos abaixo para começar sua jornada de aprendizado."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <button
                                onClick={handleContinue}
                                className="group flex items-center justify-center gap-3 bg-[#FF0080] hover:bg-[#d6006c] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_10px_40px_-10px_rgba(255,0,128,0.5)] border border-white/10"
                            >
                                <Play fill="currentColor" size={20} className="group-hover:text-white transition-colors" />
                                {lastViewed?.progress && lastViewed.progress > 0 ? "Continuar Assistindo" : "Começar Agora"}
                            </button>
                            <button
                                className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white px-8 py-4 rounded-xl font-medium text-lg transition-all border border-white/10 hover:border-white/20"
                                onClick={() => {
                                    const element = document.getElementById('modules-section');
                                    element?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                <Info size={20} />
                                Mais Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT - Overlapping Design */}
            <main className="max-w-[1600px] mx-auto px-4 md:px-12 -mt-16 relative z-20 space-y-16">

                {/* Section: Modules (Trilhas) using Horizontal Scroll */}
                <section id="modules-section">
                    <div className="flex items-end justify-between mb-8 pl-2 border-l-4 border-[#FF0080]">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-serif font-bold text-white drop-shadow-md">
                                Módulos de Aprendizado
                            </h2>
                            <p className="text-gray-400 text-sm mt-2 font-light tracking-wide">
                                Explore o conteúdo organizado para sua evolução.
                            </p>
                        </div>
                    </div>

                    {/* Horizontal Scroll Container */}
                    <div className="flex gap-6 overflow-x-auto pb-12 pt-2 scrollbar-hide snap-x">
                        {modules.map((module) => {
                            const progress = calculateModuleProgress(module);
                            const lessonCount = module.contents.length;

                            return (
                                <div
                                    key={module.id}
                                    className="group relative flex-shrink-0 w-[300px] md:w-[380px] snap-start cursor-pointer transition-all duration-300 hover:-translate-y-2"
                                    onClick={() => {
                                        if (module.contents.length > 0) {
                                            router.push(`/members/${portalId}/lesson/${module.contents[0].id}`)
                                        } else {
                                            toast.info("Este módulo ainda não tem aulas.");
                                        }
                                    }}
                                >
                                    {/* Card Image / Default Gradient */}
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-lg group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] group-hover:border-[#FF0080]/30 transition-all">
                                        <div
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                                            style={{
                                                backgroundImage: module.image_url
                                                    ? `url(${module.image_url})`
                                                    : `url(${portal.image_url || ''})` // Fallback to portal cover or default gradient below
                                            }}
                                        >
                                            {!module.image_url && !portal.image_url && (
                                                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black"></div>
                                            )}
                                        </div>

                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>

                                        {/* Play Icon Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-90 group-hover:scale-100">
                                            <div className="w-16 h-16 rounded-full bg-[#FF0080]/90 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/20">
                                                <Play fill="white" className="text-white ml-1" size={32} />
                                            </div>
                                        </div>

                                        {/* Progress Bar at Bottom */}
                                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10">
                                            <div
                                                className="h-full bg-[#FF0080] shadow-[0_0_10px_#FF0080]"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Card Meta */}
                                    <div className="mt-5 px-2">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white px-2 py-1 rounded border border-white/5 backdrop-blur-md">
                                                Módulo {module.order_index}
                                            </span>
                                            <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                <Clock size={12} /> {lessonCount} Aulas
                                            </span>
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-[#FF0080] transition-colors line-clamp-1">
                                            {module.title}
                                        </h3>

                                        <p className="text-sm text-gray-400 line-clamp-2 font-light leading-relaxed">
                                            {module.description || "Descrição não disponível."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Spacer for right padding scroll */}
                        <div className="w-8 shrink-0"></div>
                    </div>
                </section>

            </main>
        </div>
    );
}
