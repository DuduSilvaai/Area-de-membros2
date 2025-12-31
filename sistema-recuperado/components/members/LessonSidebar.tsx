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
import { motion, AnimatePresence } from 'framer-motion';
import { MobileDrawer } from './MobileDrawer';

interface Content {
    id: string;
    title: string;
    content_type: 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external';
    video_url: string | null;
    content_url: string | null;
    description: string | null;
    duration_minutes: number | null;
    order_index: number;
    module_id?: string;
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
    allowedModuleIds?: Set<string> | null;
}

export default function LessonSidebar({
    modules,
    currentLessonId,
    currentModuleId,
    completedLessons,
    onSelectLesson,
    isOpen,
    onToggle,
    portalName,
    allowedModuleIds
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

    const isModuleLocked = (moduleId: string) => {
        if (!allowedModuleIds) return false; // Access all
        return !allowedModuleIds.has(moduleId);
    };

    // Render a single lesson item
    const renderLesson = (lesson: Content, moduleId: string, index: number, isLocked: boolean) => {
        const isActive = lesson.id === currentLessonId;
        const isCompleted = completedLessons.has(lesson.id);

        return (
            <motion.button
                key={lesson.id}
                initial={false}
                animate={{ backgroundColor: isActive ? 'var(--primary-subtle)' : 'transparent' }}
                whileHover={{ x: 4 }}
                onClick={() => !isLocked && onSelectLesson(lesson, moduleId)}
                disabled={isLocked}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:opacity-80'}`}
                style={{
                    borderLeft: isActive ? '3px solid var(--primary-main)' : '3px solid transparent'
                }}
            >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {isLocked ? (
                        <Lock className="w-5 h-5 text-gray-500" />
                    ) : isCompleted ? (
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
                            color: isActive ? 'var(--primary-main)' : isLocked ? 'var(--text-disabled)' : 'var(--text-primary)'
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
            </motion.button>
        );
    };

    // Render a module (accordion)
    const renderModule = (module: Module, depth: number = 0) => {
        const isExpanded = expandedModules.has(module.id);
        const progress = getModuleProgress(module);
        const hasContent = module.contents.length > 0 || module.submodules.length > 0;
        const isLocked = isModuleLocked(module.id);

        return (
            <div key={module.id}>
                {/* Module Header */}
                <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-all hover:bg-white/5"
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
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center relative"
                        style={{ backgroundColor: isLocked ? 'var(--bg-surface)' : 'var(--primary-subtle)' }}
                    >
                        {isLocked ? (
                            <Lock className="w-4 h-4 text-gray-500" />
                        ) : (
                            <BookOpen className="w-4 h-4" style={{ color: 'var(--primary-main)' }} />
                        )}
                    </div>

                    {/* Module Info */}
                    <div className="flex-1 min-w-0 text-left">
                        <p
                            className="text-sm font-semibold truncate"
                            style={{ color: isLocked ? 'var(--text-disabled)' : 'var(--text-primary)' }}
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
                    {!isLocked && progress.total > 0 && (
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
                <AnimatePresence>
                    {isExpanded && hasContent && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                            style={{ backgroundColor: 'var(--bg-surface)' }}
                        >
                            {/* Lessons */}
                            {module.contents.map((lesson, index) => renderLesson(lesson, module.id, index, isLocked))}

                            {/* Submodules */}
                            {module.submodules.map(submod => renderModule(submod, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-[#1A1A1E] border-l border-white/5">
            <div
                className="flex items-center justify-between px-4 py-4 flex-shrink-0 border-b border-white/5"
            >
                <div>
                    <h2
                        className="text-sm font-bold text-white"
                    >
                        Conteúdo do Curso
                    </h2>
                    <p
                        className="text-xs mt-1 text-zinc-400"
                    >
                        {modules.length} módulos
                    </p>
                </div>
                {/* Close for mobile handled by Drawer wrapper, but we can add one just in case if needed inside Drawer content */}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                {modules.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
                        <BookOpen className="w-12 h-12 mb-4 text-zinc-600" />
                        <p className="text-center text-sm text-zinc-500">
                            Nenhum módulo disponível ainda.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {modules.map(module => renderModule(module))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-96 border-l border-white/5 flex-shrink-0 h-[calc(100vh-64px)] overflow-hidden sticky top-16">
                <SidebarContent />
            </aside>

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={isOpen}
                onClose={onToggle}
                side="right"
                className="bg-[#1A1A1E] border-l border-white/5 sm:w-80"
            >
                <SidebarContent />
            </MobileDrawer>
        </>
    );
}
