'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LessonSidebar, { Module, Lesson } from '@/components/members/LessonSidebar';
import VideoPlayer from '@/components/members/VideoPlayer';
import LessonComments from '@/components/members/LessonComments';
import { CheckCircle, Download, ChevronLeft, ChevronRight, Menu, X, FileText, Home } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LessonContent {
    id: string;
    title: string;
    description?: string | null;
    video_url: string | null;
    duration_seconds: number | null;
    attachments?: { name: string; url: string }[];
}

export default function LessonPage({ params }: { params: Promise<{ portalId: string; lessonId: string }> }) {
    const { portalId, lessonId } = React.use(params);
    const router = useRouter();
    const { user } = useAuth();
    const topRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<Module[]>([]);
    const [courseTitle, setCourseTitle] = useState('');
    const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);
    const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [nextLessonId, setNextLessonId] = useState<string | null>(null);
    const [prevLessonId, setPrevLessonId] = useState<string | null>(null);

    // Fetch all data
    useEffect(() => {
        const loadCourseData = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);

                // 1. Verify Enrollment & Permissions
                const { data: enrollment, error: enrollError } = await supabase
                    .from('enrollments')
                    .select('permissions, portals(name)')
                    .eq('portal_id', portalId)
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .single();

                if (enrollError || !enrollment) {
                    toast.error('Você não tem acesso a este curso.');
                    router.push('/members');
                    return;
                }

                if (enrollment.portals && !Array.isArray(enrollment.portals)) {
                    setCourseTitle(enrollment.portals.name);
                }

                // 2. Fetch Modules & Lessons (Flat fetch then restructure)
                const { data: rawModules, error: modulesError } = await supabase
                    .from('modules')
                    .select(`
            id,
            title,
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
                    .order('order_index');

                if (modulesError) throw modulesError;

                // 3. Fetch current lesson details
                const { data: lessonData, error: lessonError } = await supabase
                    .from('contents')
                    .select('*')
                    .eq('id', lessonId)
                    .single();

                if (lessonError) throw lessonError;
                setCurrentLesson(lessonData);

                // 4. Fetch User Progress
                const { data: progressData } = await supabase
                    .from('progress')
                    .select('content_id')
                    .eq('user_id', user.id)
                    .eq('is_completed', true);

                setCompletedLessonIds(new Set(progressData?.map(p => p.content_id) || []));

                // Reconstruct Tree
                const fullTree = buildModuleTree(rawModules);
                setModules(fullTree);

                // Determine Prev/Next
                const flatLessons = flattenLessons(fullTree);
                const currentIndex = flatLessons.findIndex(l => l.id === lessonId);

                if (currentIndex > 0) setPrevLessonId(flatLessons[currentIndex - 1].id);
                if (currentIndex < flatLessons.length - 1) setNextLessonId(flatLessons[currentIndex + 1].id);

            } catch (error: unknown) {
                console.error('Erro loading lesson:', error);
                toast.error('Erro ao carregar aula.');
            } finally {
                setLoading(false);
            }
        };

        if (user) loadCourseData();
    }, [user, portalId, lessonId, router]);

    // Scroll to top on lesson change
    useEffect(() => {
        if (!loading && currentLesson) {
            topRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [lessonId, loading, currentLesson]);


    // Helper: Build Tree
    interface FlatModule {
        id: string;
        title: string;
        parent_module_id: string | null;
        contents: {
            id: string;
            title: string;
            duration_seconds: number | null;
            order_index: number;
        }[];
    }

    const buildModuleTree = (flatModules: FlatModule[]): Module[] => {
        const moduleMap = new Map<string, Module>();
        const roots: Module[] = [];

        // Initialize all modules
        flatModules.forEach(m => {
            moduleMap.set(m.id, {
                id: m.id,
                title: m.title,
                lessons: (m.contents || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map(c => ({
                    id: c.id,
                    title: c.title,
                    duration_minutes: c.duration_seconds ? Math.round(c.duration_seconds / 60) : undefined
                })),
                subModules: []
            });
        });

        // Build hierarchy
        flatModules.forEach(m => {
            const module = moduleMap.get(m.id)!;
            if (m.parent_module_id && moduleMap.has(m.parent_module_id)) {
                moduleMap.get(m.parent_module_id)!.subModules.push(module);
            } else {
                roots.push(module);
            }
        });

        return roots;
    };

    // Helper: Flatten for Navigation
    const flattenLessons = (modules: Module[]): Lesson[] => {
        let result: Lesson[] = [];
        modules.forEach(m => {
            result.push(...flattenLessons(m.subModules));
            result.push(...m.lessons);
        });
        return result;
    };

    // Action: Mark Complete
    const handleLessonComplete = async () => {
        if (!user || completedLessonIds.has(lessonId)) return;

        try {
            const { error } = await supabase.from('progress').upsert({
                user_id: user.id,
                content_id: lessonId,
                is_completed: true,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            setCompletedLessonIds(prev => new Set(prev).add(lessonId));
            toast.success('Aula concluída!');

            // Auto-advance
            if (nextLessonId) {
                setTimeout(() => {
                    router.push(`/members/${portalId}/lesson/${nextLessonId}`);
                }, 3000);
                toast.info('Próxima aula em 3 segundos...');
            } else {
                toast.success('Curso finalizado! Parabéns!');
            }

        } catch (err) {
            console.error('Error marking complete:', err);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400">Carregando aula...</p>
            </div>
        </div>;
    }

    if (!currentLesson) return null;

    return (
        <div className="flex flex-col h-screen bg-[#0F0F12] text-white overflow-hidden">

            {/* Header / Breadcrumb */}
            <header className="h-16 flex-shrink-0 border-b border-white/5 bg-[#0F0F12] flex items-center justify-between px-4 lg:px-8 z-20">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Link href="/members" className="hover:text-white transition-colors flex items-center gap-1">
                        <Home size={16} /> Meus Cursos
                    </Link>
                    <ChevronRight size={14} />
                    <span className="text-gray-200 font-medium truncate max-w-[150px] sm:max-w-none">{courseTitle}</span>
                    <ChevronRight size={14} />
                    <span className="text-white font-medium truncate hidden sm:inline-block">{currentLesson.title}</span>
                </div>

                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-400 hover:text-white"
                >
                    <Menu size={24} />
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#0F0F12]" ref={topRef}>
                    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

                        {/* Video Player Container */}
                        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 mb-8 relative group">
                            {currentLesson.video_url ? (
                                <VideoPlayer
                                    url={currentLesson.video_url}
                                    autoPlay={false} // Requirement said manual start usually, but "Proxima aula" suggests auto. respecting previous default false.
                                    onEnded={handleLessonComplete}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-500">Esta aula não possui vídeo.</p>
                                </div>
                            )}
                        </div>

                        {/* Title & Actions Row */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-white/5 pb-8">
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">{currentLesson.title}</h1>
                                {/* Optional: Add module name here if available */}
                            </div>

                            <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
                                <button
                                    onClick={handleLessonComplete}
                                    disabled={completedLessonIds.has(lessonId)}
                                    className={`
                                      flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold transition-all text-sm uppercase tracking-wide
                                      ${completedLessonIds.has(lessonId)
                                            ? 'bg-green-500/10 text-green-500 cursor-default border border-green-500/20'
                                            : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/20'}
                                    `}
                                >
                                    {completedLessonIds.has(lessonId) ? (
                                        <>
                                            <CheckCircle size={18} />
                                            Aula Concluída
                                        </>
                                    ) : (
                                        'Marcar como Concluída'
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => prevLessonId && router.push(`/members/${portalId}/lesson/${prevLessonId}`)}
                                        className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                                        disabled={!prevLessonId}
                                        title="Aula Anterior"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Navegar</span>
                                    <button
                                        onClick={() => nextLessonId && router.push(`/members/${portalId}/lesson/${nextLessonId}`)}
                                        className="p-2 rounded-full hover:bg-white/5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                                        disabled={!nextLessonId}
                                        title="Próxima Aula"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Description & Materials Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            {/* Description */}
                            <div className="lg:col-span-2 space-y-6">
                                <h3 className="text-lg font-semibold text-white">Sobre a aula</h3>
                                <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
                                    {currentLesson.description ? (
                                        <p className="whitespace-pre-wrap">{currentLesson.description}</p>
                                    ) : (
                                        <p className="text-gray-500 italic">Sem descrição.</p>
                                    )}
                                </div>
                            </div>

                            {/* Materials */}
                            <div className="lg:col-span-1">
                                <div className="bg-[#141417] rounded-xl border border-white/5 p-6 sticky top-6">
                                    <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                        <Download size={18} className="text-red-500" />
                                        Materiais Complementares
                                    </h3>

                                    {currentLesson.attachments && currentLesson.attachments.length > 0 ? (
                                        <div className="space-y-3">
                                            {currentLesson.attachments.map((attachment, idx) => (
                                                <a
                                                    key={idx}
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/10 transition-all group"
                                                >
                                                    <div className="p-2 rounded bg-[#0F0F12] text-gray-400 group-hover:text-red-500 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-200 group-hover:text-white truncate">
                                                            {attachment.name || `Arquivo ${idx + 1}`}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Download</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-gray-600">Nenhum material disponível.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="border-t border-white/5 pt-8">
                            <h3 className="text-xl font-bold text-white mb-6">Comentários e Dúvidas</h3>
                            <LessonComments lessonId={lessonId} />
                        </div>

                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className={`
                    fixed inset-y-0 right-0 z-40 w-80 bg-[#111114] border-l border-white/5 
                    transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                    ${mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <div className="h-full flex flex-col">
                        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/5 bg-[#111114]">
                            <span className="font-bold text-sm uppercase tracking-wider text-gray-400">Conteúdo do Curso</span>
                            <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-2 text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <LessonSidebar
                                portalId={portalId}
                                modules={modules}
                                currentLessonId={lessonId}
                                completedLessonIds={completedLessonIds}
                            />
                        </div>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 z-30 lg:hidden backdrop-blur-sm"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}
