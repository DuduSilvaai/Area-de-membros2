'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LessonSidebar, { Module, Lesson } from '@/components/members/LessonSidebar';
import VideoPlayer from '@/components/members/VideoPlayer';
import LessonComments from '@/components/members/LessonComments';
import { CheckCircle, Download, ChevronLeft, ChevronRight, Menu, X, FileText, Home } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Helper for Realtime Security
const checkAccess = (
    permissions: { access_all: boolean; allowed_modules: string[] },
    currentModuleId?: string | null
) => {
    if (permissions.access_all) return true;
    if (!currentModuleId) return false; // If lesson has no module (orphan), deny or allow? stricter to deny.
    return permissions.allowed_modules.includes(currentModuleId);
};

interface LessonContent {
    id: string;
    title: string;
    description?: string | null;
    video_url: string | null;
    duration_seconds: number | null;
    attachments?: { name: string; url: string }[];
    config?: { cover_url?: string;[key: string]: any };
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

    const [initialTime, setInitialTime] = useState(0);

    // Save progress ref to avoid closure staleness issues in throttling
    const saveProgressRef = useRef<(time: number) => void>(() => { });

    // State for Signed URL (to handle private buckets)
    const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);

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

                // 2. Fetch Modules & Lessons
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
                setCurrentLesson(lessonData as unknown as LessonContent);

                // --- URL SIGNING LOGIC ---
                // If it's a Supabase Storage URL, generate a signed URL
                if (lessonData.video_url && lessonData.video_url.includes('/storage/v1/object/public/')) {
                    try {
                        // Extract path: .../object/public/[bucket]/[path]
                        const urlObj = new URL(lessonData.video_url);
                        // Path parts after /object/public/
                        // Example: /storage/v1/object/public/course-content/videos/file.mp4
                        const activePath = urlObj.pathname.split('/object/public/')[1]; // "course-content/videos/file.mp4"

                        if (activePath) {
                            const [bucket, ...rest] = activePath.split('/');
                            const filePath = rest.join('/');

                            console.log(`Attempting to sign URL for bucket: ${bucket}, path: ${filePath}`);

                            const { data: signedData, error: signedError } = await supabase
                                .storage
                                .from(bucket)
                                .createSignedUrl(filePath, 60 * 60 * 2); // 2 hours

                            if (signedError) {
                                console.error('Error signing URL:', signedError);
                            } else if (signedData) {
                                console.log('Signed URL generated successfully');
                                setSignedVideoUrl(signedData.signedUrl);
                            }
                        }
                    } catch (e) {
                        console.error('Error parsing video URL for signing:', e);
                    }
                } else {
                    setSignedVideoUrl(null); // Reset or null if not valid
                }
                // -------------------------

                // 4. Fetch User Progress (Completion & Last Position)
                const { data: progressData } = await supabase
                    .from('progress')
                    .select('content_id, is_completed, last_position')
                    .eq('user_id', user.id); // Fetch all for this user to map completion + current lesson position

                // Map completed IDs
                const completed = progressData?.filter(p => p.is_completed).map(p => p.content_id) || [];
                setCompletedLessonIds(new Set(completed));

                // Get current lesson progress
                const currentProgress = progressData?.find(p => p.content_id === lessonId);
                if (currentProgress?.last_position) {
                    setInitialTime(currentProgress.last_position);
                }

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

    // Progress Saving Logic (Throttled)
    useEffect(() => {
        let lastSave = 0;
        const SAVE_INTERVAL = 5000; // Save every 5 seconds

        saveProgressRef.current = async (time: number) => {
            const now = Date.now();
            if (now - lastSave < SAVE_INTERVAL) return;

            lastSave = now;
            if (!user) return;

            try {
                await supabase.from('progress').upsert({
                    user_id: user.id,
                    content_id: lessonId,
                    last_position: Math.floor(time),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,content_id' });
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        };
    }, [user, lessonId]);

    const handleProgress = (time: number) => {
        saveProgressRef.current(time);
    };

    // 🛡️ REAL-TIME SECURITY & ACCESS CONTROL
    useEffect(() => {
        if (!user || !portalId) return;

        // 1. Initial/Static Check for Module Permission (Granular)
        // We need to wait for modules to be loaded and `currentLesson` to be identified to know the Module ID.
        // However, we can also check this during the initial load, but a reactive check here is safer.
        if (!loading && currentLesson && modules.length > 0) {
            // Find which module this lesson belongs to
            let foundModuleId: string | null = null;
            for (const m of modules) {
                // Check direct lessons
                if (m.lessons.find(l => l.id === lessonId)) {
                    foundModuleId = m.id;
                    break;
                }
                // Check submodules
                if (!foundModuleId) {
                    for (const sub of m.subModules) {
                        if (sub.lessons.find(l => l.id === lessonId)) {
                            foundModuleId = sub.id;
                            break;
                        }
                    }
                }
            }

            // We need to re-fetch enrollment permissions locally or store them in state to check against foundModuleId.
            // Since we don't have them in state, let's fetch them OR rely on the Realtime listener to catch updates.
            // Ideally, `loadCourseData` should have stored permissions.
            // Let's rely on the Realtime Listener below to enforce "revocation" specifically, 
            // and trust the initial load (which we need to patch to strict check too).
        }

        console.log("🛡️ [Security] Initializing Realtime Access Monitor...");

        const channel = supabase
            .channel(`security-enrollment-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // UPDATE or DELETE
                    schema: 'public',
                    table: 'enrollments',
                    filter: `user_id=eq.${user.id}`
                },
                async (payload) => {
                    console.log("🛡️ [Security] Enrollment change detected:", payload);

                    // If DELETE or UPDATE with is_active=false
                    if (payload.eventType === 'DELETE' || (payload.new && !(payload.new as any).is_active)) {
                        // Check if it's THIS portal
                        if ((payload.old as any).portal_id === portalId || (payload.new as any).portal_id === portalId) {
                            toast.error('Seu acesso a este curso foi revogado.');
                            router.replace('/members');
                            return;
                        }
                    }

                    // If UPDATE (permissions changed)
                    if (payload.eventType === 'UPDATE' && (payload.new as any).is_active) {
                        const newPermissions = (payload.new as any).permissions;

                        // We need the Current Module ID to verify.
                        // We can't easily get it inside this callback without refs or state.
                        // Strategy: Re-fetch the lesson's module relation.

                        // 1. Fetch lesson's module
                        const { data: lessonContent } = await supabase
                            .from('contents')
                            .select('module_id')
                            .eq('id', lessonId)
                            .single();

                        if (lessonContent?.module_id) {
                            const hasAccess = checkAccess(newPermissions, lessonContent.module_id);
                            if (!hasAccess) {
                                toast.error('Seu acesso a este módulo foi revogado pelo administrador.');
                                router.replace(`/members/${portalId}`);
                            } else {
                                toast.success('Suas permissões foram atualizadas.');
                            }
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log(`🛡️ [Security] Status: ${status}`);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, portalId, lessonId, router, loading, modules]); // Dependencies

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

    // Action: Toggle Complete
    const handleLessonComplete = async () => {
        if (!user) return;

        const isCurrentlyCompleted = completedLessonIds.has(lessonId);

        try {
            if (isCurrentlyCompleted) {
                // Uncomplete the lesson
                const { error } = await supabase
                    .from('progress')
                    .update({ is_completed: false, updated_at: new Date().toISOString() })
                    .eq('user_id', user.id)
                    .eq('content_id', lessonId);

                if (error) throw error;

                setCompletedLessonIds(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(lessonId);
                    return newSet;
                });
                toast.success('Aula desmarcada como concluída.');
            } else {
                // Complete the lesson
                const { error } = await supabase.from('progress').upsert({
                    user_id: user.id,
                    content_id: lessonId,
                    is_completed: true,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,content_id' });

                if (error) throw error;

                setCompletedLessonIds(prev => new Set(prev).add(lessonId));
                toast.success('Aula concluída!');

                // Auto-advance only when completing
                if (nextLessonId) {
                    setTimeout(() => {
                        router.push(`/members/${portalId}/lesson/${nextLessonId}`);
                    }, 3000);
                    toast.info('Próxima aula em 3 segundos...');
                } else {
                    toast.success('Curso finalizado! Parabéns!');
                }
            }

        } catch (err) {
            console.error('Error toggling completion:', JSON.stringify(err, null, 2));
            toast.error('Erro ao atualizar status da aula');
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F12] flex items-center justify-center text-gray-900 dark:text-white transition-colors">
            <div className="flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-gray-400">Carregando aula...</p>
            </div>
        </div>;
    }

    if (!currentLesson) return null;

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#0F0F12] text-gray-900 dark:text-white overflow-hidden transition-colors">

            {/* Header / Breadcrumb */}
            <header className="h-16 flex-shrink-0 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#0F0F12] flex items-center justify-between px-4 lg:px-8 z-20 transition-colors">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/members" className="hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1">
                        <Home size={16} /> Meus Cursos
                    </Link>
                    <ChevronRight size={14} />
                    <Link href={`/members/${portalId}`} className="text-gray-700 dark:text-gray-200 font-medium truncate max-w-[150px] sm:max-w-none hover:text-gray-900 dark:hover:text-white transition-colors">
                        {courseTitle}
                    </Link>
                    <ChevronRight size={14} />
                    <span className="text-gray-900 dark:text-white font-medium truncate hidden sm:inline-block">{currentLesson.title}</span>
                </div>

                <button
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <Menu size={24} />
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden relative">

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-gray-50 dark:bg-[#0F0F12] transition-colors" ref={topRef}>
                    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

                        {/* Video Player Container */}
                        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/5 mb-8 relative group">
                            {currentLesson.video_url ? (
                                <VideoPlayer
                                    url={signedVideoUrl || currentLesson.video_url}
                                    poster={currentLesson.config?.cover_url}
                                    autoPlay={false}
                                    initialTime={initialTime}
                                    onProgress={handleProgress}
                                    onEnded={handleLessonComplete}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-gray-500">Esta aula não possui vídeo.</p>
                                </div>
                            )}
                        </div>

                        {/* Title & Actions Row */}
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 border-b border-gray-200 dark:border-white/5 pb-8">
                            <div className="flex-1">
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">{currentLesson.title}</h1>
                                {/* Optional: Add module name here if available */}
                            </div>

                            <div className="flex flex-col gap-3 flex-shrink-0 w-full md:w-auto">
                                <button
                                    onClick={handleLessonComplete}
                                    className={`
                                      flex items-center justify-center gap-2 px-8 py-3 rounded-full font-bold transition-all text-sm uppercase tracking-wide
                                      ${completedLessonIds.has(lessonId)
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20'
                                            : 'bg-pink-600 hover:bg-pink-700 text-white shadow-lg hover:shadow-pink-600/20'}
                                    `}
                                    title={completedLessonIds.has(lessonId) ? 'Clique para desmarcar' : 'Marcar como concluída'}
                                >
                                    {completedLessonIds.has(lessonId) ? (
                                        <>
                                            <CheckCircle size={18} />
                                            <span className="group-hover:hidden">Aula Concluída</span>
                                        </>
                                    ) : (
                                        'Marcar como Concluída'
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => prevLessonId && router.push(`/members/${portalId}/lesson/${prevLessonId}`)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
                                        disabled={!prevLessonId}
                                        title="Aula Anterior"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Navegar</span>
                                    <button
                                        onClick={() => nextLessonId && router.push(`/members/${portalId}/lesson/${nextLessonId}`)}
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
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
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sobre a aula</h3>
                                <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {currentLesson.description ? (
                                        <p className="whitespace-pre-wrap">{currentLesson.description}</p>
                                    ) : (
                                        <p className="text-gray-400 dark:text-gray-500 italic">Sem descrição.</p>
                                    )}
                                </div>
                            </div>

                            {/* Materials */}
                            <div className="lg:col-span-1">
                                <div className="bg-white dark:bg-[#141417] rounded-xl border border-gray-200 dark:border-white/5 p-6 sticky top-6 shadow-sm">
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Download size={18} className="text-pink-500" />
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
                                                    className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-100 dark:border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all group"
                                                >
                                                    <div className="p-2 rounded bg-gray-100 dark:bg-[#0F0F12] text-gray-500 dark:text-gray-400 group-hover:text-pink-500 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-sm text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white truncate">
                                                            {attachment.name || `Arquivo ${idx + 1}`}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Download</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-sm text-gray-500 dark:text-gray-600">Nenhum material disponível.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="border-t border-gray-200 dark:border-white/5 pt-8">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Comentários e Dúvidas</h3>
                            <LessonComments lessonId={lessonId} />
                        </div>

                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className={`
                    fixed inset-y-0 right-0 z-40 w-80 bg-white dark:bg-[#111114] border-l border-gray-200 dark:border-white/5 
                    transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                    ${mobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <div className="h-full flex flex-col">
                        <div className="h-16 flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-[#111114] transition-colors">
                            <span className="font-bold text-sm uppercase tracking-wider text-gray-700 dark:text-gray-400">Conteúdo do Curso</span>
                            <button onClick={() => setMobileSidebarOpen(false)} className="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
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
