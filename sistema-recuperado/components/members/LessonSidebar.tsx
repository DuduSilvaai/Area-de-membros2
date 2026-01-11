'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, CheckCircle2, Play, Lock, Clock, AlertCircle } from 'lucide-react';
import { LessonStatus } from '@/types/members';

// Export types for backward compatibility with lesson page
export interface Lesson {
    id: string;
    title: string;
    duration_minutes?: number;
    duration?: string;
    status?: LessonStatus;
}

export interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
    subModules: Module[];
}

interface LessonSidebarProps {
    portalId: string;
    modules: Module[];
    currentLessonId?: string;
    progress?: number;
    // Legacy prop support
    completedLessonIds?: Set<string>;
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({
    portalId,
    modules,
    currentLessonId,
    progress = 0,
    completedLessonIds
}) => {
    // Initialize with all modules open
    const [openModules, setOpenModules] = useState<Record<string, boolean>>(
        modules.reduce((acc, mod) => ({ ...acc, [mod.id]: true }), {})
    );

    const [lockedWarningId, setLockedWarningId] = useState<string | null>(null);

    const toggleModule = (moduleId: string) => {
        setOpenModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    // Derive status from completedLessonIds if provided (legacy support)
    const getLessonStatus = (lesson: Lesson): LessonStatus => {
        if (lesson.status) return lesson.status;
        if (completedLessonIds?.has(lesson.id)) return LessonStatus.COMPLETED;
        if (lesson.id === currentLessonId) return LessonStatus.IN_PROGRESS;
        return LessonStatus.AVAILABLE;
    };

    const handleLessonClick = (lesson: Lesson, e: React.MouseEvent) => {
        const status = getLessonStatus(lesson);
        if (status === LessonStatus.LOCKED) {
            e.preventDefault();
            setLockedWarningId(lesson.id);
            setTimeout(() => setLockedWarningId(null), 3000);
        }
    };

    // Calculate progress if not provided
    const calculateProgress = (): number => {
        if (progress > 0) return progress;
        if (!completedLessonIds) return 0;

        let totalLessons = 0;
        let completedCount = 0;

        const countLessons = (mods: Module[]) => {
            mods.forEach(mod => {
                mod.lessons.forEach(lesson => {
                    totalLessons++;
                    if (completedLessonIds.has(lesson.id)) completedCount++;
                });
                if (mod.subModules) countLessons(mod.subModules);
            });
        };

        countLessons(modules);
        return totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    };

    const displayProgress = calculateProgress();

    // Recursive module renderer
    const renderModule = (module: Module, depth: number = 0) => (
        <div key={module.id} className="border-b border-gray-100 dark:border-white/5">
            <button
                onClick={() => toggleModule(module.id)}
                className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors text-left group"
                style={{ paddingLeft: `${16 + depth * 12}px` }}
            >
                <span className="font-medium text-gray-800 dark:text-gray-200 text-sm line-clamp-1 group-hover:text-mozart-pink transition-colors">
                    {module.title}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-transform duration-200 ${openModules[module.id] ? 'rotate-180' : ''}`}
                />
            </button>

            {openModules[module.id] && (
                <div className="bg-white dark:bg-black/20 py-2">
                    {/* Render submodules first */}
                    {module.subModules?.map(subMod => renderModule(subMod, depth + 1))}

                    {/* Render lessons */}
                    {module.lessons.map((lesson) => {
                        const status = getLessonStatus(lesson);
                        const isActive = lesson.id === currentLessonId;
                        const isLocked = status === LessonStatus.LOCKED;
                        const isCompleted = status === LessonStatus.COMPLETED;
                        const showWarning = lockedWarningId === lesson.id;

                        return (
                            <div key={lesson.id}>
                                <Link
                                    href={isLocked ? '#' : `/members/${portalId}/lesson/${lesson.id}`}
                                    onClick={(e) => handleLessonClick(lesson, e)}
                                    className={`
                    relative flex flex-col border-l-[3px] transition-all duration-300
                    ${isActive
                                            ? 'bg-mozart-pink/5 border-mozart-pink'
                                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]'}
                    ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                    ${isLocked && !showWarning ? 'opacity-60' : 'opacity-100'}
                  `}
                                >
                                    <div className="flex items-start gap-3 p-3 pl-6 w-full">
                                        <div className="mt-0.5 min-w-[16px]">
                                            {isActive ? (
                                                <Play size={16} className="text-mozart-pink animate-pulse" fill="currentColor" />
                                            ) : isCompleted ? (
                                                <CheckCircle2 size={16} className="text-mozart-pink" />
                                            ) : isLocked ? (
                                                <Lock size={16} className={`text-gray-400 ${showWarning ? 'text-red-500 animate-bounce' : ''}`} />
                                            ) : (
                                                <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 group-hover:border-mozart-pink transition-colors"></div>
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <p className={`text-sm font-medium leading-snug ${isActive ? 'text-mozart-pink' : 'text-gray-700 dark:text-gray-400'} ${isLocked && !isActive ? 'text-gray-500 dark:text-gray-600' : ''}`}>
                                                {lesson.title}
                                            </p>
                                            {(lesson.duration || lesson.duration_minutes) && (
                                                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 dark:text-gray-600 font-medium">
                                                    <Clock size={11} />
                                                    <span>{lesson.duration || `${lesson.duration_minutes} min`}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>

                                {/* Locked Feedback Message */}
                                {showWarning && (
                                    <div className="mx-6 mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-md animate-in fade-in slide-in-from-top-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                                            <AlertCircle size={12} />
                                            <span>Aula bloqueada</span>
                                        </div>
                                        <p className="text-[10px] text-red-500/80 dark:text-red-400/70 mt-0.5 pl-5">
                                            Complete as aulas anteriores para desbloquear.
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#121212] transition-colors duration-500">
            <div className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[#18181b]">
                <h3 className="text-gray-900 dark:text-white font-serif font-bold text-lg tracking-tight">Conteúdo do Curso</h3>
                <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-mozart-pink h-full shadow-[0_0_10px_#FF0080]" style={{ width: `${displayProgress}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{displayProgress}% Concluído</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {modules.map((module) => renderModule(module))}
            </div>
        </div>
    );
};

export default LessonSidebar;
