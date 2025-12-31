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
                "group flex items-center gap-2 pl-9 pr-2 py-1.5 rounded-md hover:bg-zinc-900/50 transition-colors text-sm",
                isDragging && "opacity-50 bg-zinc-800"
            )}
            onClick={() => onEdit(lesson)}
        >
            <div
                {...listeners}
                className="opacity-0 group-hover:opacity-100 cursor-grab text-zinc-600 hover:text-zinc-400 transition-opacity"
            >
                <GripVertical className="w-4 h-4" />
            </div>

            <div className={cn(
                "mr-2",
                isVideo ? "text-blue-400" : "text-amber-400"
            )}>
                {isVideo ? <PlayCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>

            <span className="flex-1 truncate text-zinc-400 group-hover:text-zinc-200 transition-colors cursor-pointer font-medium">
                {lesson.title}
            </span>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                {lesson.is_preview && (
                    <span className="text-[10px] uppercase bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-bold mr-2">
                        Grátis
                    </span>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-500 hover:text-white hover:bg-zinc-800"
                    onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}
                >
                    <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                    onClick={(e) => { e.stopPropagation(); onDelete(lesson.id); }}
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
