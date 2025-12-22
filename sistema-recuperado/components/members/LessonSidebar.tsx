'use client';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    PlayCircle,
    CheckCircle2,
    Lock,
    X,
    Menu,
    BookOpen
} from 'lucide-react';

interface Content {
    id: string;
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external';
    video_url: string | null;
    content_url: string | null;
    description: string | null;
    duration_minutes: number | null;
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
}

interface LessonSidebarProps {
    modules: Module[];
    currentLessonId: string | null;
    currentModuleId: string | null;
    completedLessons: Set<string>;
    onSelectLesson: (lesson: Content, moduleId: string) => void;
    isOpen: boolean;
    onToggle: () => void;
    portalName: string;
}

export default function LessonSidebar({
    modules,
    currentLessonId,
    currentModuleId,
    completedLessons,
    onSelectLesson,
    isOpen,
    onToggle,
    portalName
}: LessonSidebarProps) {
    const [expandedModules, setExpandedModules] = useState<Set<string>>(
        new Set(currentModuleId ? [currentModuleId] : [])
    );

    // Toggle module expansion
    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => {
            const newSet = new Set(prev);
            if (newSet.has(moduleId)) {
                newSet.delete(moduleId);
            } else {
                newSet.add(moduleId);
            }
            return newSet;
        });
    };

    // Calculate module progress
    const getModuleProgress = (module: Module): { completed: number; total: number } => {
        let completed = 0;
        let total = module.contents.length;

        module.contents.forEach(content => {
            if (completedLessons.has(content.id)) completed++;
        });

        module.submodules.forEach(submod => {
            const subProgress = getModuleProgress(submod);
            completed += subProgress.completed;
            total += subProgress.total;
        });

        return { completed, total };
    };

    // Render a single lesson item
    const renderLesson = (lesson: Content, moduleId: string, index: number) => {
        const isActive = lesson.id === currentLessonId;
        const isCompleted = completedLessons.has(lesson.id);

        return (
            <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson, moduleId)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all hover:opacity-80"
                style={{
                    backgroundColor: isActive ? 'var(--primary-subtle)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary-main)' : '3px solid transparent'
                }}
            >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                        <CheckCircle2
                            className="w-5 h-5"
                            style={{ color: 'var(--status-success)' }}
                        />
                    ) : isActive ? (
                        <PlayCircle
                            className="w-5 h-5"
                            style={{ color: 'var(--primary-main)' }}
                        />
                    ) : (
                        <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium"
                            style={{
                                backgroundColor: 'var(--bg-canvas)',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            {index + 1}
                        </div>
                    )}
                </div>

                {/* Lesson Info */}
                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-medium truncate"
                        style={{
                            color: isActive ? 'var(--primary-main)' : 'var(--text-primary)'
                        }}
                    >
                        {lesson.title}
                    </p>
                    {lesson.duration_minutes && (
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: 'var(--text-disabled)' }}
                        >
                            {lesson.duration_minutes} min
                        </p>
                    )}
                </div>
            </button>
        );
    };

    // Render a module (accordion)
    const renderModule = (module: Module, depth: number = 0) => {
        const isExpanded = expandedModules.has(module.id);
        const progress = getModuleProgress(module);
        const hasContent = module.contents.length > 0 || module.submodules.length > 0;

        return (
            <div key={module.id}>
                {/* Module Header */}
                <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:opacity-80"
                    style={{
                        backgroundColor: depth === 0 ? 'var(--bg-canvas)' : 'transparent',
                        paddingLeft: depth === 0 ? '16px' : `${16 + depth * 16}px`
                    }}
                >
                    {/* Expand Icon */}
                    <div className="flex-shrink-0">
                        {hasContent ? (
                            isExpanded ? (
                                <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                            ) : (
                                <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                            )
                        ) : (
                            <div className="w-4" />
                        )}
                    </div>

                    {/* Module Icon */}
                    <div
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: 'var(--primary-subtle)' }}
                    >
                        <BookOpen className="w-4 h-4" style={{ color: 'var(--primary-main)' }} />
                    </div>

                    {/* Module Info */}
                    <div className="flex-1 min-w-0 text-left">
                        <p
                            className="text-sm font-semibold truncate"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            {module.title}
                        </p>
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: 'var(--text-disabled)' }}
                        >
                            {progress.completed}/{progress.total} aulas
                        </p>
                    </div>

                    {/* Progress */}
                    {progress.total > 0 && (
                        <div className="flex-shrink-0">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                                style={{
                                    backgroundColor: progress.completed === progress.total
                                        ? 'var(--status-success)'
                                        : 'var(--bg-surface)',
                                    color: progress.completed === progress.total
                                        ? 'var(--text-on-primary)'
                                        : 'var(--text-secondary)'
                                }}
                            >
                                {Math.round((progress.completed / progress.total) * 100)}%
                            </div>
                        </div>
                    )}
                </button>

                {/* Module Contents */}
                {isExpanded && hasContent && (
                    <div style={{ backgroundColor: 'var(--bg-surface)' }}>
                        {/* Lessons */}
                        {module.contents.map((lesson, index) => renderLesson(lesson, module.id, index))}

                        {/* Submodules */}
                        {module.submodules.map(submod => renderModule(submod, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={onToggle}
                className="lg:hidden fixed bottom-4 right-4 z-50 p-4 rounded-full shadow-lg"
                style={{
                    backgroundColor: 'var(--primary-main)',
                    color: 'var(--text-on-primary)'
                }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Sidebar Overlay (mobile) */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-16 right-0 bottom-0 z-40 w-96 max-w-[85vw]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0
          flex flex-col
        `}
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderLeft: '1px solid var(--border-color)'
                }}
            >
                {/* Sidebar Header */}
                <div
                    className="flex items-center justify-between px-4 py-4 flex-shrink-0"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                    <div>
                        <h2
                            className="text-sm font-bold"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            Conteúdo do Curso
                        </h2>
                        <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {modules.length} módulos
                        </p>
                    </div>

                    <button
                        onClick={onToggle}
                        className="lg:hidden p-2 rounded-lg hover:opacity-80"
                        style={{ backgroundColor: 'var(--bg-canvas)' }}
                    >
                        <X className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                    </button>
                </div>

                {/* Modules List */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {modules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                            <BookOpen className="w-12 h-12 mb-4" style={{ color: 'var(--text-disabled)' }} />
                            <p
                                className="text-center text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                Nenhum módulo disponível ainda.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                            {modules.map(module => renderModule(module))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
