'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import VideoPlayer from '@/components/members/VideoPlayer';
import LessonSidebar from '@/components/members/LessonSidebar';
import {
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    ArrowLeft,
    FileText,
    MessageSquare,
    Download,
    Loader2
} from 'lucide-react';
import Link from 'next/link';

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
    is_completed?: boolean;
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

type TabType = 'description' | 'files' | 'comments';

export default function ClassroomPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const portalId = params?.portalId as string;

    const [portal, setPortal] = useState<Portal | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [currentLesson, setCurrentLesson] = useState<Content | null>(null);
    const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('description');
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Load portal data and modules
    useEffect(() => {
        const loadData = async () => {
            if (!portalId) return;

            try {
                setLoading(true);
                console.log('Iniciando carregamento para portal:', portalId);

                // Fetch portal info
                const { data: portalData, error: portalError } = await supabase
                    .from('portals')
                    .select('*')
                    .eq('id', portalId)
                    .single();

                if (portalError) {
                    console.error('Erro ao buscar portal:', portalError);
                    throw new Error(`Erro no portal: ${portalError.message || JSON.stringify(portalError)}`);
                }
                setPortal(portalData);

                // Fetch modules with contents
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
              content_type,
              video_url,
              duration_seconds,
              order_index
            )
          `)
                    .eq('portal_id', portalId)
                    .eq('is_active', true)
                    .order('order_index', { ascending: true });

                if (modulesError) {
                    console.error('Erro ao buscar módulos:', modulesError);
                    throw new Error(`Erro nos módulos: ${modulesError.message || JSON.stringify(modulesError)}`);
                }

                // Build hierarchy (root modules with submodules)
                const rootModules: Module[] = [];
                const moduleMap = new Map<string, Module>();

                // First pass: create all modules
                (modulesData || []).forEach((mod: any) => {
                    const mappedContents: Content[] = (mod.contents || []).map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        content_type: c.content_type,
                        video_url: c.video_url,
                        content_url: null, // Not in DB
                        description: null, // Not in DB
                        duration_minutes: c.duration_seconds ? Math.round(c.duration_seconds / 60) : null,
                        order_index: c.order_index
                    })).sort((a: Content, b: Content) => a.order_index - b.order_index);

                    const module: Module = {
                        ...mod,
                        contents: mappedContents,
                        submodules: []
                    };
                    moduleMap.set(mod.id, module);
                });

                // Second pass: build hierarchy
                moduleMap.forEach((module) => {
                    if (module.parent_module_id) {
                        const parent = moduleMap.get(module.parent_module_id);
                        if (parent) {
                            parent.submodules.push(module);
                        }
                    } else {
                        rootModules.push(module);
                    }
                });

                // Sort root modules and submodules
                rootModules.sort((a, b) => a.order_index - b.order_index);
                rootModules.forEach(mod => {
                    mod.submodules.sort((a, b) => a.order_index - b.order_index);
                });

                setModules(rootModules);

                // Setup initial lesson only if not already set
                if (!currentLesson && rootModules.length > 0) {
                    const firstModule = rootModules[0];
                    if (firstModule.contents.length > 0) {
                        setCurrentLesson(firstModule.contents[0]);
                        setCurrentModuleId(firstModule.id);
                    } else if (firstModule.submodules.length > 0 && firstModule.submodules[0].contents.length > 0) {
                        setCurrentLesson(firstModule.submodules[0].contents[0]);
                        setCurrentModuleId(firstModule.submodules[0].id);
                    }
                }

            } catch (error: any) {
                console.error('Erro crítico ao carregar dados:', error);
                console.error('Detalhes do erro:', {
                    message: error?.message,
                    details: error?.details,
                    hint: error?.hint,
                    full: JSON.stringify(error)
                });
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [portalId]);

    // Get all lessons in order for navigation
    const getAllLessons = useCallback((): { lesson: Content; moduleId: string }[] => {
        const lessons: { lesson: Content; moduleId: string }[] = [];

        const collectLessons = (mods: Module[]) => {
            mods.forEach(mod => {
                mod.contents.forEach(content => {
                    lessons.push({ lesson: content, moduleId: mod.id });
                });
                if (mod.submodules.length > 0) {
                    collectLessons(mod.submodules);
                }
            });
        };

        collectLessons(modules);
        return lessons;
    }, [modules]);

    // Navigate to next/previous lesson
    const navigateLesson = (direction: 'next' | 'prev') => {
        const allLessons = getAllLessons();
        const currentIndex = allLessons.findIndex(l => l.lesson.id === currentLesson?.id);

        if (direction === 'next' && currentIndex < allLessons.length - 1) {
            const next = allLessons[currentIndex + 1];
            setCurrentLesson(next.lesson);
            setCurrentModuleId(next.moduleId);
        } else if (direction === 'prev' && currentIndex > 0) {
            const prev = allLessons[currentIndex - 1];
            setCurrentLesson(prev.lesson);
            setCurrentModuleId(prev.moduleId);
        }
    };

    // Mark lesson as completed
    const markAsCompleted = () => {
        if (currentLesson) {
            setCompletedLessons(prev => new Set([...prev, currentLesson.id]));
            // TODO: Save to database
        }
    };

    // Select a lesson
    const selectLesson = (lesson: Content, moduleId: string) => {
        setCurrentLesson(lesson);
        setCurrentModuleId(moduleId);
    };

    // Calculate progress
    const calculateProgress = (): number => {
        const allLessons = getAllLessons();
        if (allLessons.length === 0) return 0;
        return Math.round((completedLessons.size / allLessons.length) * 100);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-default)' }}>
                <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--primary-main)' }} />
            </div>
        );
    }

    // No portal found
    if (!portal) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-default)', color: 'var(--text-primary)' }}>
                <h1 className="text-2xl font-bold mb-4">Portal não encontrado</h1>
                <Link href="/members" style={{ color: 'var(--primary-main)' }}>
                    Voltar para a lista de cursos
                </Link>
            </div>
        );
    }

    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex(l => l.lesson.id === currentLesson?.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allLessons.length - 1;

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{
                backgroundColor: '#0F0F12',
                color: '#FFFFFF',
                // Force Dark Mode Variables
                '--primary-main': '#FF4D94',
                '--primary-hover': '#FF70AB',
                '--primary-subtle': 'rgba(255, 77, 148, 0.15)',
                '--bg-default': '#0F0F12',
                '--bg-canvas': '#0A0A0D',
                '--bg-surface': '#1A1A1E',
                '--bg-sidebar': 'rgba(18, 18, 22, 0.7)',
                '--bg-sidebar-border': 'rgba(255, 255, 255, 0.08)',
                '--text-primary': '#FFFFFF',
                '--text-secondary': '#A0A0AB',
                '--text-disabled': '#4D4D54',
                '--text-on-primary': '#FFFFFF',
                '--status-success': '#2ECC71',
                '--status-warning': '#F1C40F',
                '--status-error': '#E74C3C',
                '--status-info': '#3498DB',
                '--border-color': '#2D2D35',
                '--border-subtle': 'rgba(255, 255, 255, 0.06)',
                '--shadow-soft': '0 4px 12px rgba(0, 0, 0, 0.3)',
                '--shadow-medium': '0 10px 25px rgba(0, 0, 0, 0.4)',
                '--shadow-card': '0 0 1px rgba(255, 255, 255, 0.1)',
                '--shadow-floating': '0 20px 40px rgba(0, 0, 0, 0.6)',
            } as React.CSSProperties}
        >
            {/* Header */}
            <header
                className="sticky top-0 z-50 flex items-center justify-between px-4 h-16"
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-soft)'
                }}
            >
                <div className="flex items-center gap-4">
                    <Link
                        href="/members"
                        className="flex items-center gap-2 transition-colors"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="hidden sm:inline">Voltar</span>
                    </Link>
                    <div className="hidden sm:block h-6 w-px" style={{ backgroundColor: 'var(--border-color)' }} />
                    <h1 className="text-sm sm:text-base font-medium truncate max-w-[200px] sm:max-w-none" style={{ color: 'var(--text-primary)' }}>
                        {portal.name}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Progress indicator */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-32 h-2 rounded-full" style={{ backgroundColor: 'var(--bg-canvas)' }}>
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${calculateProgress()}%`,
                                    backgroundColor: 'var(--primary-main)'
                                }}
                            />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {calculateProgress()}%
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Video Area */}
                <main className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:mr-96' : ''}`}>
                    {/* Video Player */}
                    <div className="w-full" style={{ backgroundColor: '#000' }}>
                        <VideoPlayer
                            videoUrl={currentLesson?.video_url || null}
                            title={currentLesson?.title || 'Selecione uma aula'}
                        />
                    </div>

                    {/* Lesson Info & Controls */}
                    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--bg-canvas)' }}>
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
                            {/* Lesson Title & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                                        {currentLesson?.title || 'Nenhuma aula selecionada'}
                                    </h2>
                                    {currentLesson?.duration_minutes && (
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            Duração: {currentLesson.duration_minutes} min
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Mark as Complete Button */}
                                    <button
                                        onClick={markAsCompleted}
                                        disabled={currentLesson ? completedLessons.has(currentLesson.id) : true}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all"
                                        style={{
                                            backgroundColor: currentLesson && completedLessons.has(currentLesson.id)
                                                ? 'var(--status-success)'
                                                : 'var(--primary-main)',
                                            color: 'var(--text-on-primary)',
                                            opacity: currentLesson && completedLessons.has(currentLesson.id) ? 0.7 : 1
                                        }}
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        {currentLesson && completedLessons.has(currentLesson.id) ? 'Concluída' : 'Marcar como vista'}
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex items-center justify-between gap-4 mb-6 pb-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <button
                                    onClick={() => navigateLesson('prev')}
                                    disabled={!hasPrev}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
                                    style={{
                                        backgroundColor: 'var(--bg-surface)',
                                        color: hasPrev ? 'var(--text-primary)' : 'var(--text-disabled)',
                                        border: '1px solid var(--border-color)',
                                        opacity: hasPrev ? 1 : 0.5,
                                        cursor: hasPrev ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Aula Anterior
                                </button>

                                <button
                                    onClick={() => navigateLesson('next')}
                                    disabled={!hasNext}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all"
                                    style={{
                                        backgroundColor: hasNext ? 'var(--primary-main)' : 'var(--bg-surface)',
                                        color: hasNext ? 'var(--text-on-primary)' : 'var(--text-disabled)',
                                        border: hasNext ? 'none' : '1px solid var(--border-color)',
                                        opacity: hasNext ? 1 : 0.5,
                                        cursor: hasNext ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    Próxima Aula
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="mb-6">
                                <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-surface)' }}>
                                    {[
                                        { id: 'description' as TabType, label: 'Descrição', icon: FileText },
                                        { id: 'files' as TabType, label: 'Arquivos', icon: Download },
                                        { id: 'comments' as TabType, label: 'Comentários', icon: MessageSquare },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-all"
                                            style={{
                                                backgroundColor: activeTab === tab.id ? 'var(--primary-main)' : 'transparent',
                                                color: activeTab === tab.id ? 'var(--text-on-primary)' : 'var(--text-secondary)'
                                            }}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            <span className="hidden sm:inline">{tab.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div
                                className="rounded-xl p-6"
                                style={{
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                {activeTab === 'description' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                            Sobre esta aula
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>
                                            {currentLesson?.description || 'Esta aula não possui descrição.'}
                                        </p>
                                    </div>
                                )}

                                {activeTab === 'files' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                            Material de Apoio
                                        </h3>
                                        <div className="flex flex-col items-center justify-center py-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                                            <Download className="w-12 h-12 mb-4 opacity-50" />
                                            <p>Nenhum arquivo disponível para esta aula.</p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'comments' && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                                            Comentários
                                        </h3>
                                        <p style={{ color: 'var(--text-secondary)' }}>
                                            A seção de comentários estará disponível em breve.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>

                {/* Sidebar */}
                <LessonSidebar
                    modules={modules}
                    currentLessonId={currentLesson?.id || null}
                    currentModuleId={currentModuleId}
                    completedLessons={completedLessons}
                    onSelectLesson={selectLesson}
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    portalName={portal.name}
                />
            </div>
        </div>
    );
}
