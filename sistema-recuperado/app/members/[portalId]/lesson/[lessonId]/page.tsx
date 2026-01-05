'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LessonSidebar, { Module, Lesson } from '@/components/members/LessonSidebar';
import VideoPlayer from '@/components/members/VideoPlayer';
import { CheckCircle, Download, ChevronLeft, ChevronRight, Menu, X, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface LessonContent {
    id: string;
    title: string;
    description?: string | null;
    video_url: string | null;
    duration_seconds: number | null;
    attachments?: { name: string; url: string }[];
}

export default function LessonPage({ params }: { params: { portalId: string; lessonId: string } }) {
    const { portalId, lessonId } = params;
    const router = useRouter();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<Module[]>([]);
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
                    .select('permissions')
                    .eq('portal_id', portalId)
                    .eq('user_id', user.id)
                    .eq('is_active', true)
                    .single();

                if (enrollError || !enrollment) {
                    toast.error('Você não tem acesso a este curso.');
                    router.push('/members');
                    return;
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

            } catch (error: any) {
                console.error('Erro loading lesson:', error);
                toast.error('Erro ao carregar aula.');
            } finally {
                setLoading(false);
            }
        };

        if (user) loadCourseData();
    }, [user, portalId, lessonId, router]);


    // Helper: Build Tree
    const buildModuleTree = (flatModules: any[]): Module[] => {
        const moduleMap = new Map<string, Module>();
        const roots: Module[] = [];

        // Initialize all modules
        flatModules.forEach(m => {
            moduleMap.set(m.id, {
                id: m.id,
                title: m.title,
                lessons: (m.contents || []).sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)).map((c: any) => ({
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
            }

        } catch (err) {
            console.error('Error marking complete:', err);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">Carregando aula...</div>;
    }

    if (!currentLesson) return null;

    return (
        <div className="flex bg-[#141414] min-h-screen text-white overflow-hidden">

            {/* Mobile Sidebar Toggle Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-40 lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#141414] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 border-r border-white/5
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
                    <span className="font-bold text-lg text-white">Conteúdo</span>
                    <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-2 text-gray-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="h-[calc(100vh-64px)] overflow-hidden">
                    <LessonSidebar
                        portalId={portalId}
                        modules={modules}
                        currentLessonId={lessonId}
                        completedLessonIds={completedLessonIds}
                    />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen relative">

                {/* Top Bar (Mobile) */}
                <div className="lg:hidden h-16 flex items-center px-4 border-b border-white/5 sticky top-0 bg-[#141414] z-30">
                    <button onClick={() => setMobileSidebarOpen(true)} className="p-2 -ml-2 text-gray-400">
                        <Menu size={24} />
                    </button>
                    <span className="ml-4 font-semibold truncate">{currentLesson.title}</span>
                </div>

                <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                    {/* Video Section */}
                    <div className="mb-8">
                        {currentLesson.video_url ? (
                            <VideoPlayer
                                url={currentLesson.video_url}
                                autoPlay={false}
                                onEnded={handleLessonComplete}
                            />
                        ) : (
                            <div className="aspect-video bg-[#1f1f1f] rounded-xl flex items-center justify-center border border-white/10">
                                <p className="text-gray-500">Esta aula não possui vídeo.</p>
                            </div>
                        )}
                    </div>

                    {/* Navigation & Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-8 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => prevLessonId && router.push(`/members/${portalId}/lesson/${prevLessonId}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                disabled={!prevLessonId}
                            >
                                <ChevronLeft size={16} /> Anterior
                            </button>
                            <button
                                onClick={() => nextLessonId && router.push(`/members/${portalId}/lesson/${nextLessonId}`)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                disabled={!nextLessonId}
                            >
                                Próxima <ChevronRight size={16} />
                            </button>
                        </div>

                        <button
                            onClick={handleLessonComplete}
                            disabled={completedLessonIds.has(lessonId)}
                            className={`
                  flex items-center gap-2 px-6 py-2 rounded-full font-semibold transition-all
                  ${completedLessonIds.has(lessonId)
                                    ? 'bg-green-500/20 text-green-500 cursor-default'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-600/30'}
                `}
                        >
                            {completedLessonIds.has(lessonId) ? (
                                <>
                                    <CheckCircle size={18} />
                                    Concluída
                                </>
                            ) : (
                                'Marcar como Concluída'
                            )}
                        </button>
                    </div>

                    {/* Lesson Info */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{currentLesson.title}</h1>
                            <div className="prose prose-invert max-w-none text-gray-300">
                                <p className="whitespace-pre-wrap">{currentLesson.description}</p>
                            </div>
                        </div>

                        {/* Attachments */}
                        {currentLesson.attachments && currentLesson.attachments.length > 0 && (
                            <div className="mt-8 pt-8 border-t border-white/5">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Download size={20} className="text-red-500" />
                                    Materiais de Apoio
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentLesson.attachments.map((attachment, idx) => (
                                        <a
                                            key={idx}
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-4 rounded-lg bg-[#1f1f1f] hover:bg-[#252525] border border-white/5 hover:border-white/10 transition-all group"
                                        >
                                            <div className="p-2 rounded bg-white/5 group-hover:bg-red-500/10 transition-colors">
                                                <FileText size={20} className="text-gray-400 group-hover:text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-gray-200 group-hover:text-white truncate">
                                                    {attachment.name || `Arquivo ${idx + 1}`}
                                                </p>
                                                <p className="text-xs text-gray-500">Clique para baixar</p>
                                            </div>
                                            <Download size={16} className="text-gray-500 group-hover:text-white" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
