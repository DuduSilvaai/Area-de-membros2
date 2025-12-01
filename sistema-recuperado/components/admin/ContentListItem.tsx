'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    Edit2,
    Trash2,
    FileText,
    Video,
    FileQuestion,
    Link as LinkIcon,
    FileCode,
    File as FileIcon
} from 'lucide-react';
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
    };

    const getIconAndColor = () => {
        switch (content.content_type) {
            case 'video':
                return {
                    icon: <Video className="w-4 h-4" />,
                    color: 'text-blue-600 bg-blue-50',
                    borderColor: 'border-blue-200'
                };
            case 'quiz':
                return {
                    icon: <FileQuestion className="w-4 h-4" />,
                    color: 'text-purple-600 bg-purple-50',
                    borderColor: 'border-purple-200'
                };
            case 'text':
                return {
                    icon: <FileText className="w-4 h-4" />,
                    color: 'text-gray-600 bg-gray-50',
                    borderColor: 'border-gray-200'
                };
            case 'pdf':
                return {
                    icon: <FileIcon className="w-4 h-4" />,
                    color: 'text-red-600 bg-red-50',
                    borderColor: 'border-red-200'
                };
            case 'file':
                return {
                    icon: <FileCode className="w-4 h-4" />,
                    color: 'text-green-600 bg-green-50',
                    borderColor: 'border-green-200'
                };
            default:
                return {
                    icon: <LinkIcon className="w-4 h-4" />,
                    color: 'text-orange-600 bg-orange-50',
                    borderColor: 'border-orange-200'
                };
        }
    };

    const { icon, color, borderColor } = getIconAndColor();

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center justify-between p-3.5 bg-white border-2 rounded-lg transition-all duration-200 ${isDragging
                    ? 'shadow-2xl ring-4 ring-blue-400 scale-105 opacity-50 z-50 bg-blue-50'
                    : `${borderColor} hover:border-blue-400 hover:shadow-md`
                }`}
        >
            {/* Drag indicator line (shown on hover) */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-lg transition-all duration-200 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />

            <div className="flex items-center flex-1 min-w-0">
                {/* Drag Handle */}
                <button
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 rounded-md mr-3 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 flex-shrink-0"
                    {...attributes}
                    {...listeners}
                    title="Arrastar para reordenar"
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Icon with background */}
                <div className={`flex items-center justify-center w-9 h-9 rounded-lg mr-3 ${color} transition-all duration-200 flex-shrink-0`}>
                    {icon}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900 block truncate">
                        {content.title}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                        {content.content_type}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-3 flex-shrink-0">
                <button
                    onClick={() => onEdit(content.id, content.title)}
                    className="p-2 hover:bg-blue-50 rounded-md text-gray-600 hover:text-blue-600 transition-all hover:scale-110"
                    title="Editar Título"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onDelete(content.id)}
                    className="p-2 hover:bg-red-50 rounded-md text-gray-600 hover:text-red-600 transition-all hover:scale-110"
                    title="Excluir"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Drop zone indicator (shown when dragging another item) */}
            {!isDragging && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 opacity-0 transition-opacity duration-200" />
            )}
        </div>
    );
}
