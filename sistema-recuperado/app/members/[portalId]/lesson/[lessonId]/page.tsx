'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/members/VideoPlayer';
import LessonSidebar from '@/components/members/LessonSidebar';
import LessonComments from '@/components/members/LessonComments';
import { ComplementaryMaterialsTab } from '@/components/members/ComplementaryMaterialsTab';
import { Confetti } from '@/components/ui/Confetti';
import { Skeleton } from '@/components/ui/Skeleton';
import { MobileDrawer } from '@/components/members/MobileDrawer';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    ArrowLeft,
    FileText,
    MessageSquare,
    Download,
    Loader2,
    Menu,
    X,
    BookOpen,
    PlayCircle,
    ChevronDown,
    Headphones,
    MonitorPlay,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface Content {
    id: string;
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external';
    video_url: string | null;
    content_url: string | null;
    description: string | null;
    duration_minutes: number | null;
    order_index: number;
    module_id: string;
}

interface Module {
    id: string;
    title: string;
    description: string | null;
    order_index: number;
    parent_module_id: string | null;
    contents: Content[];
    submodules: Module[];
}

interface Portal {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
}

type TabType = 'description' | 'files' | 'comments' | 'support';

export default function LessonPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const portalId = params?.portalId as string;
    const lessonId = params?.lessonId as string;

    const [portal, setPortal] = useState<Portal | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Content | null>(null);
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    // const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set()); // Moved to sidebar component
    const [markingComplete, setMarkingComplete] = useState(false);
    const [lastPosition, setLastPosition] = useState<number>(0);
    const [accessDenied, setAccessDenied] = useState(false);
    const [allowedModuleIds, setAllowedModuleIds] = useState<Set<string> | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            if (!portalId || !lessonId || !user?.id) return;

            try {
                setLoading(true);

                // Check Enrollment
                const { data: enrollmentData, error: enrollmentError } = await supabase
                    .from('enrollments')
                    .select('permissions')
                    .eq('user_id', user.id)
                    .eq('portal_id', portalId)
                    .eq('is_active', true)
                    .single();

                if (enrollmentError || !enrollmentData) {
                    setAccessDenied(true);
                    setLoading(false);
                    return;
                }

                const permissions = enrollmentData.permissions as { access_all?: boolean; allowed_modules?: string[] };
                if (permissions.access_all) {
                    setAllowedModuleIds(null);
                } else {
                    setAllowedModuleIds(new Set(permissions.allowed_modules || []));
                }

                // Fetch Portal
                const { data: portalData } = await supabase
                    .from('portals')
                    .select('*')
                    .eq('id', portalId)
                    .single();
                setPortal(portalData);

                // Fetch Modules
                const { data: modulesData } = await supabase
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
                            content_type,
                            video_url,
                            content_url,
                            duration_seconds,
                            order_index,
                            module_id,
                            description
                        )
                    `)
                    .eq('portal_id', portalId)
                    .eq('is_active', true)
                    .order('order_index', { ascending: true });

                // Process Modules Tree
                const moduleMap = new Map<string, Module>();
                const rootModules: Module[] = [];

                (modulesData || []).forEach((mod: any) => {
                    const mappedContents: Content[] = (mod.contents || []).map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        content_type: c.content_type,
                        video_url: c.video_url,
                        content_url: c.content_url,
                        description: c.description,
                        duration_minutes: c.duration_seconds ? Math.round(c.duration_seconds / 60) : null,
                        order_index: c.order_index,
                        module_id: c.module_id
                    })).sort((a: Content, b: Content) => a.order_index - b.order_index);

                    const module: Module = {
                        ...mod,
                        contents: mappedContents,
                        submodules: []
                    };
                    moduleMap.set(mod.id, module);
                });

                moduleMap.forEach((module) => {
                    if (module.parent_module_id) {
                        const parent = moduleMap.get(module.parent_module_id);
                        if (parent) parent.submodules.push(module);
                    } else {
                        rootModules.push(module);
                    }
                });

                const sortModules = (mods: Module[]) => {
                    mods.sort((a, b) => a.order_index - b.order_index);
                    mods.forEach(m => {
                        if (m.submodules.length) sortModules(m.submodules);
                    });
                };
                sortModules(rootModules);
                setModules(rootModules);

                // Find Current Lesson
                let foundLesson: Content | null = null;
                let foundModuleId: string | null = null;

                const findLesson = (mods: Module[]) => {
                    for (const mod of mods) {
                        for (const content of mod.contents) {
                            if (content.id === lessonId) {
                                foundLesson = content;
                                foundModuleId = mod.id;
                                return true;
                            }
                        }
                        if (findLesson(mod.submodules)) return true;
                    }
                    return false;
                };

                findLesson(rootModules);
                setCurrentLesson(foundLesson);
                setCurrentModuleId(foundModuleId);

                // Fetch Progress
                const { data: progressData } = await supabase
                    .from('progress')
                    .select('content_id, is_completed, last_position')
                    .eq('user_id', user.id);

                if (progressData) {
                    setCompletedLessons(new Set(progressData.filter(p => p.is_completed).map(p => p.content_id)));
                    const currentProgress = progressData.find(p => p.content_id === lessonId);
                    if (currentProgress?.last_position) setLastPosition(currentProgress.last_position);
                }

            } catch (error) {
                console.error("Error loading lesson:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [portalId, lessonId, user?.id]);

    const getAllLessons = useCallback((): { lesson: Content; moduleId: string }[] => {
        const lessons: { lesson: Content; moduleId: string }[] = [];
        const collectLessons = (mods: Module[]) => {
            mods.forEach(mod => {
                mod.contents.forEach(content => lessons.push({ lesson: content, moduleId: mod.id }));
                if (mod.submodules.length > 0) collectLessons(mod.submodules);
            });
        };
        collectLessons(modules);
        return lessons;
    }, [modules]);

    const navigateLesson = (direction: 'next' | 'prev') => {
        const allLessons = getAllLessons();
        const currentIndex = allLessons.findIndex(l => l.lesson.id === lessonId);

        if (direction === 'next' && currentIndex < allLessons.length - 1) {
            router.push(`/members/${portalId}/lesson/${allLessons[currentIndex + 1].lesson.id}`);
        } else if (direction === 'prev' && currentIndex > 0) {
            router.push(`/members/${portalId}/lesson/${allLessons[currentIndex - 1].lesson.id}`);
        }
    };

    const toggleLessonCompletion = async () => {
        if (!currentLesson || !user?.id || markingComplete) return;

        setMarkingComplete(true);
        const isCurrentlyCompleted = completedLessons.has(currentLesson.id);
        const newCompletedState = !isCurrentlyCompleted;

        // Optimistic UI
        setCompletedLessons(prev => {
            const newSet = new Set(prev);
            if (newCompletedState) newSet.add(currentLesson.id);
            else newSet.delete(currentLesson.id);
            return newSet;
        });

        // Trigger Confetti if completing
        if (newCompletedState) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
        }

        try {
            const { error } = await supabase
                .from('progress')
                .upsert({
                    user_id: user.id,
                    content_id: currentLesson.id,
                    is_completed: newCompletedState,
                    completed_at: newCompletedState ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,content_id' });

            if (error) throw error;
        } catch (error) {
            console.error('Error saving progress:', error);
            // Revert
            setCompletedLessons(prev => {
                const newSet = new Set(prev);
                if (newCompletedState) {
                    newSet.delete(currentLesson.id);
                } else {
                    newSet.add(currentLesson.id);
                }
                return newSet;
            });
            setShowConfetti(false);
        } finally {
            setMarkingComplete(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-[#0F0F12]">
                <div className="flex-1 p-8 space-y-6">
                    <Skeleton className="w-full aspect-video rounded-2xl bg-zinc-800" />
                    <div className="max-w-4xl mx-auto space-y-4">
                        <Skeleton className="h-10 w-3/4 bg-zinc-800" />
                        <Skeleton className="h-6 w-1/4 bg-zinc-800" />
                        <Skeleton className="h-32 w-full bg-zinc-800" />
                    </div>
                </div>
                <div className="hidden lg:block w-96 p-4 border-l border-white/5 space-y-4">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg bg-zinc-800" />)}
                </div>
            </div>
        );
    }

    if (accessDenied) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F12] text-white">
                <Lock className="w-16 h-16 text-pink-500 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
                <p className="text-zinc-400 mb-6">Você não tem permissão para acessar esta aula.</p>
                <Link href={`/members/${portalId}`} className="text-pink-500 hover:text-pink-400">
                    Voltar para o Início
                </Link>
            </div>
        );
    }

    if (!portal || !currentLesson) return null;

    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex(l => l.lesson.id === lessonId);
    const hasNext = currentIndex < allLessons.length - 1;

    return (
        <div className="min-h-screen flex flex-col bg-[#0F0F12] text-white overflow-hidden selection:bg-pink-500/30">
            {/* Header */}
            <header className="flex-shrink-0 h-16 bg-[#1A1A1E] border-b border-white/5 flex items-center justify-between px-4 z-20 shadow-md">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/members/${portalId}`}
                        className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Link>
                    <div className="w-px h-6 bg-white/10 hidden sm:block" />
                    <span className="font-medium truncate max-w-[200px] text-zinc-200">
                        {portal.name}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden p-2 rounded-lg bg-white/5 text-zinc-400"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Main Content (Theater Mode) */}
                <main className="flex-1 flex flex-col overflow-y-auto bg-[#0F0F12]">
                    <div className="w-full bg-black shadow-2xl relative group">
                        <div className="max-w-[1600px] mx-auto aspect-video">
                            <VideoPlayer
                                videoUrl={currentLesson.video_url}
                                title={currentLesson.title}
                                lessonId={currentLesson.id}
                                userId={user?.id}
                                initialPosition={lastPosition}
                                hasNextLesson={hasNext}
                                onNextLesson={() => navigateLesson('next')}
                                onComplete={() => {
                                    // VideoPlayer completed trigger
                                    if (!completedLessons.has(currentLesson.id)) {
                                        toggleLessonCompletion();
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 bg-[#0F0F12]">
                        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
                            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between mb-8">
                                <div className="space-y-4 flex-1">
                                    <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                                        {currentLesson.title}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                                        {currentLesson.duration_minutes && (
                                            <span className="flex items-center gap-1.5">
                                                <MonitorPlay className="w-4 h-4" />
                                                {currentLesson.duration_minutes} min
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1.5">
                                            <CheckCircle2 className={`w-4 h-4 ${completedLessons.has(currentLesson.id) ? 'text-green-500' : 'text-zinc-600'}`} />
                                            {completedLessons.has(currentLesson.id) ? 'Concluído' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={toggleLessonCompletion}
                                    className={`
                                        relative overflow-hidden
                                        flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg
                                        ${completedLessons.has(currentLesson.id)
                                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
                                            : 'bg-pink-600 hover:bg-pink-700 text-white shadow-pink-500/20'}
                                    `}
                                >
                                    <AnimatePresence>
                                        {showConfetti && <Confetti />}
                                    </AnimatePresence>

                                    {completedLessons.has(currentLesson.id) ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Aula Concluída
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-5 h-5" />
                                            Concluir Aula
                                        </>
                                    )}
                                </motion.button>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-white/5 mb-8">
                                <div className="flex gap-6 overflow-x-auto pb-px">
                                    {[
                                        { id: 'description' as TabType, label: 'Descrição' },
                                        { id: 'files' as TabType, label: 'Materiais' },
                                        { id: 'comments' as TabType, label: 'Comentários' },
                                        { id: 'support' as TabType, label: 'Suporte' },
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`
                                                pb-4 text-sm font-medium transition-colors relative whitespace-nowrap
                                                ${activeTab === tab.id ? 'text-pink-500' : 'text-zinc-400 hover:text-zinc-200'}
                                            `}
                                        >
                                            {tab.label}
                                            {activeTab === tab.id && (
                                                <motion.div
                                                    layoutId="activeTab"
                                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-500"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="min-h-[200px] mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {activeTab === 'description' && (
                                    <div className="prose prose-invert max-w-none prose-p:text-zinc-400 prose-headings:text-white prose-a:text-pink-500">
                                        <p>{currentLesson.description || "Nenhuma descrição disponível para esta aula."}</p>
                                    </div>
                                )}

                                {activeTab === 'files' && (
                                    <ComplementaryMaterialsTab files={[]} />
                                )}

                                {activeTab === 'comments' && (
                                    <LessonComments lessonId={currentLesson.id} />
                                )}

                                {activeTab === 'support' && (
                                    <div className="bg-zinc-900/50 rounded-xl p-8 text-center border border-white/5">
                                        <Headphones className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                                        <h3 className="text-lg font-medium text-white mb-2">Precisa de ajuda?</h3>
                                        <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                                            Se você tiver alguma dúvida sobre esta aula, nossa equipe de suporte está pronta para ajudar.
                                        </p>
                                        <button className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-colors">
                                            Abrir Chamado
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                <LessonSidebar
                    modules={modules}
                    currentLessonId={currentLesson.id}
                    currentModuleId={currentModuleId}
                    completedLessons={completedLessons}
                    onSelectLesson={(lesson, moduleId) => {
                        router.push(`/members/${portalId}/lesson/${lesson.id}`);
                    }}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    portalName={portal.name}
                    allowedModuleIds={allowedModuleIds}
                />
            </div>
        </div>
    );
}
