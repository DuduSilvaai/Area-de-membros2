'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, FileText, Video, FileQuestion, Link as LinkIcon } from 'lucide-react';
import { Content } from '@/types/enrollment';

interface ContentListItemProps {
    content: Content;
    onEdit: (contentId: string, currentTitle: string) => void;
    onDelete: (contentId: string) => void;
}

export function ContentListItem({ content, onEdit, onDelete }: ContentListItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: content.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const getIcon = () => {
        switch (content.content_type) {
            case 'video': return <Video className="w-4 h-4 text-blue-500" />;
            case 'quiz': return <FileQuestion className="w-4 h-4 text-purple-500" />;
            case 'text': return <FileText className="w-4 h-4 text-gray-500" />;
            default: return <LinkIcon className="w-4 h-4 text-gray-400" />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md mb-2 hover:border-blue-300 transition-colors ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
        >
            <div className="flex items-center flex-1">
                <button
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </button>

                <div className="mr-3">
                    {getIcon()}
                </div>

                <span className="text-sm font-medium text-gray-700">{content.title}</span>
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onEdit(content.id, content.title)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    title="Editar Título"
                >
                    <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => onDelete(content.id)}
                    className="p-1.5 hover:bg-red-50 rounded text-red-600"
                    title="Excluir"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
