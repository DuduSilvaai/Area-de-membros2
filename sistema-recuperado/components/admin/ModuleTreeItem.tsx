// components/admin/ModuleTreeItem.tsx
'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    ChevronRight,
    ChevronDown,
    Plus,
    Edit2,
    Trash2,
    File
} from 'lucide-react';
import { ModuleWithChildren } from '@/types/enrollment';

interface ModuleTreeItemProps {
    module: ModuleWithChildren;
    depth: number;
    onEdit: (moduleId: string, currentTitle: string) => void;
    onDelete: (moduleId: string) => void;
    onAddChild: (parentId: string) => void;
    onSelectModule: (moduleId: string) => void;
    selectedModuleId?: string;
}

export function ModuleTreeItem({
    module,
    depth,
    onEdit,
    onDelete,
    onAddChild,
    onSelectModule,
    selectedModuleId
}: ModuleTreeItemProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = module.children && module.children.length > 0;
    const isSelected = selectedModuleId === module.id;

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: module.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const indentPx = depth * 24;
    const maxDepth = 4;

    return (
        <div ref={setNodeRef} style={style}>
            {/* Module Row */}
            <div
                className={`group relative flex items-center py-2 px-3 rounded-md transition-colors ${isSelected
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                    } ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
                style={{ marginLeft: `${indentPx}px` }}
            >
                {/* Drag Handle */}
                <button
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Expand/Collapse */}
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1 hover:bg-gray-200 rounded ml-1"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                    </button>
                ) : (
                    <div className="w-6" />
                )}

                {/* Module Icon */}
                <div className="ml-2 mr-3">
                    <File className="w-4 h-4 text-blue-600" />
                </div>

                {/* Module Title */}
                <button
                    onClick={() => onSelectModule(module.id)}
                    className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                    {module.title}
                </button>

                {/* Action Buttons (on hover) */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {depth < maxDepth && (
                        <button
                            onClick={() => onAddChild(module.id)}
                            className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                            title="Adicionar Submódulo"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(module.id, module.title)}
                        className="p-1.5 hover:bg-gray-200 rounded text-gray-600"
                        title="Editar Título"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(module.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-red-600"
                        title="Excluir"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Depth Indicator (optional visual helper) */}
                {depth > 0 && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"
                        style={{ left: `${indentPx - 12}px` }}
                    />
                )}
            </div>

            {/* Children (recursive) */}
            {hasChildren && isExpanded && (
                <div className="mt-0.5">
                    {module.children!.map((child) => (
                        <ModuleTreeItem
                            key={child.id}
                            module={child}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onSelectModule={onSelectModule}
                            selectedModuleId={selectedModuleId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
