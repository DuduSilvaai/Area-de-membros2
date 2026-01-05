'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, PlayCircle, CheckCircle, Lock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Lesson {
    id: string;
    title: string;
    duration_minutes?: number;
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
    currentLessonId: string;
    completedLessonIds: Set<string>;
    onMobileClose?: () => void;
}

const ModuleItem = ({
    module,
    portalId,
    currentLessonId,
    completedLessonIds,
    depth = 0
}: {
    module: Module,
    portalId: string,
    currentLessonId: string,
    completedLessonIds: Set<string>,
    depth?: number
}) => {
    const [isOpen, setIsOpen] = useState(depth === 0 || module.lessons.some(l => l.id === currentLessonId) || module.subModules.some(m => m.lessons.some(l => l.id === currentLessonId)));

    const hasActiveLesson = module.lessons.some(l => l.id === currentLessonId);

    // Calculate module completion
    const totalLessons = module.lessons.length; // + recursive count if needed, keeping simple for now
    const completedCount = module.lessons.filter(l => completedLessonIds.has(l.id)).length;
    const isModuleCompleted = totalLessons > 0 && totalLessons === completedCount;

    return (
        <div className="mb-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 text-left group",
                    isOpen ? "bg-white/5" : "hover:bg-white/5"
                )}
                style={{ paddingLeft: `${(depth * 12) + 12}px` }}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={cn(
                        "font-medium text-sm truncate",
                        hasActiveLesson ? "text-red-500" : "text-gray-200"
                    )}>
                        {module.title}
                    </span>
                </div>
                {isModuleCompleted && (
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 ml-2" />
                )}
            </button>

            {isOpen && (
                <div className="mt-1 space-y-1">
                    {/* Submodules */}
                    {module.subModules.map(sub => (
                        <ModuleItem
                            key={sub.id}
                            module={sub}
                            portalId={portalId}
                            currentLessonId={currentLessonId}
                            completedLessonIds={completedLessonIds}
                            depth={depth + 1}
                        />
                    ))}

                    {/* Lessons */}
                    {module.lessons.map(lesson => {
                        const isActive = lesson.id === currentLessonId;
                        const isCompleted = completedLessonIds.has(lesson.id);

                        return (
                            <Link
                                key={lesson.id}
                                href={`/members/${portalId}/lesson/${lesson.id}`}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-md text-sm transition-all duration-200 group relative border-l-2",
                                    isActive
                                        ? "bg-red-600/10 border-red-500 text-white"
                                        : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
                                )}
                                style={{ marginLeft: `${(depth * 12) + 20}px` }}
                            >
                                <div className="flex-shrink-0">
                                    {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : isActive ? (
                                        <PlayCircle className="w-4 h-4 text-red-500" />
                                    ) : (
                                        <div className="w-4 h-4 rounded-full border border-gray-600 group-hover:border-gray-400" />
                                    )}
                                </div>
                                <span className="truncate flex-1">{lesson.title}</span>
                                {lesson.duration_minutes && (
                                    <span className="text-xs text-gray-600 group-hover:text-gray-500">{lesson.duration_minutes}m</span>
                                )}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default function LessonSidebar({
    portalId,
    modules,
    currentLessonId,
    completedLessonIds,
    onMobileClose
}: LessonSidebarProps) {
    return (
        <div className="h-full flex flex-col bg-[#111114] w-full">
            <div className="p-4 border-b border-white/5">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Conteúdo do Curso</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {modules.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>Nenhum módulo disponível</p>
                    </div>
                ) : (
                    modules.map(module => (
                        <ModuleItem
                            key={module.id}
                            module={module}
                            portalId={portalId}
                            currentLessonId={currentLessonId}
                            completedLessonIds={completedLessonIds}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
