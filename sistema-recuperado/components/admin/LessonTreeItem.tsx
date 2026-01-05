'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Content } from '@/types/enrollment';
import { FileText, GripVertical, PlayCircle, Trash2, Edit2, CheckCircle, Video, Link as LinkIcon, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface LessonTreeItemProps {
    lesson: Content;
    onEdit: (lesson: Content) => void;
    onDelete: (lessonId: string) => void;
}

export function LessonTreeItem({ lesson, onEdit, onDelete }: LessonTreeItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: lesson.id, data: { type: 'Lesson', lesson } });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const isVideo = lesson.content_type === 'video' || !!lesson.video_url;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "group flex items-center gap-2 pl-9 pr-2 py-2 rounded-md transition-colors text-sm border-b border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-100 dark:hover:border-zinc-800",
                isDragging && "opacity-50 bg-gray-100 dark:bg-zinc-800"
            )}
            onClick={() => onEdit(lesson)}
        >
            <div
                {...listeners}
                className="opacity-0 group-hover:opacity-100 cursor-grab text-zinc-500 hover:text-zinc-600 transition-opacity flex-shrink-0"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className={cn(
                "mr-2 flex-shrink-0",
                lesson.content_type === 'video' || !!lesson.video_url ? "text-blue-500" : "text-amber-500"
            )}>
                {lesson.content_type === 'video' || !!lesson.video_url ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>

            <span className="flex-1 truncate text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors cursor-pointer font-medium">
                {lesson.title}
            </span>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                {lesson.is_preview && (
                    <span className="text-[10px] uppercase bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 px-1.5 py-0.5 rounded font-bold mr-2">
                        Grátis
                    </span>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-[#FF2D78] hover:bg-transparent"
                    onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-zinc-500 dark:text-zinc-400 hover:text-[#FF2D78] hover:bg-transparent"
                    onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}
