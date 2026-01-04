'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ModuleWithContents, Content } from '@/types/enrollment';
import { Folder, FolderOpen, MoreVertical, Plus, Trash2, Edit2, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LessonTreeItem } from './LessonTreeItem';

interface ModuleTreeItemProps {
    module: ModuleWithContents;
    onEdit: (module: ModuleWithContents) => void;
    onDelete: (moduleId: string) => void;
    onAddLesson: (moduleId: string) => void;
    onEditLesson: (lesson: Content) => void;
    onDeleteLesson: (lessonId: string) => void;
}

export function ModuleTreeItem({
    module,
    onEdit,
    onDelete,
    onAddLesson,
    onEditLesson,
    onDeleteLesson
}: ModuleTreeItemProps) {
    const [isOpen, setIsOpen] = useState(false); // Default closed or open? Maybe closed to look clean.

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: module.id, data: { type: 'Module', module } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-2">
            {/* Module Header Row */}
            <div
                className={cn(
                    "group flex items-center gap-2 px-2 py-2 rounded-lg transition-colors cursor-pointer select-none border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800",
                    // Light mode: bg-white on hover or when open (if desired), or just transparent -> hover gray-100
                    // Dark mode: bg-zinc-900 on hover
                    "hover:bg-white dark:hover:bg-zinc-900",
                    isDragging && "opacity-50 bg-gray-100 dark:bg-zinc-800",
                    isOpen && "bg-gray-50 dark:bg-zinc-900/30"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="opacity-0 group-hover:opacity-100 cursor-grab text-zinc-600 hover:text-zinc-400 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-4 h-4" />
                </div>

                {/* Collapse Icon */}
                <div className="text-zinc-500">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>

                {/* Folder Icon */}
                <div className={cn("text-pink-500/80 transition-colors", isOpen ? "text-pink-500" : "")}>
                    {isOpen ? <FolderOpen className="w-5 h-5" /> : <Folder className="w-5 h-5" />}
                </div>

                {/* Title */}
                <span className="flex-1 font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors text-sm">
                    {module.title}
                </span>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-[#FF2D78] hover:bg-transparent"
                        title="Adicionar Aula"
                        onClick={(e) => { e.stopPropagation(); onAddLesson(module.id); }}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-[#FF2D78] hover:bg-transparent"
                        title="Editar Módulo"
                        onClick={(e) => { e.stopPropagation(); onEdit(module); }}
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-[#FF2D78] hover:bg-transparent"
                        title="Excluir Módulo"
                        onClick={(e) => { e.stopPropagation(); onDelete(module.id); }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Lessons List (Children) */}
            {isOpen && module.contents && module.contents.length > 0 && (
                <div className="mt-1 relative">
                    {/* Vertical guideline */}
                    <div className="absolute left-[27px] top-0 bottom-2 w-px bg-zinc-800" />

                    <SortableContext
                        items={module.contents.map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-0.5">
                            {module.contents.map(lesson => (
                                <LessonTreeItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    onEdit={onEditLesson}
                                    onDelete={onDeleteLesson}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </div>
            )}

            {/* Empty State when expanded */}
            {isOpen && (!module.contents || module.contents.length === 0) && (
                <div className="pl-9 py-2 text-xs text-zinc-600 italic">
                    Nenhuma aula neste módulo.
                </div>
            )}
        </div>
    );
}
