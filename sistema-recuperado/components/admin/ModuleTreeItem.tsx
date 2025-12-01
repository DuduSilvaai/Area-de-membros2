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
    Folder,
    FolderOpen
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
    isLastChild?: boolean;
    parentPath?: boolean[];
}

export function ModuleTreeItem({
    module,
    depth,
    onEdit,
    onDelete,
    onAddChild,
    onSelectModule,
    selectedModuleId,
    isLastChild = false,
    parentPath = []
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

    const indentPx = depth * 28;
    const maxDepth = 4;

    // Color coding by depth
    const depthColors = [
        'text-blue-600 bg-blue-50',
        'text-purple-600 bg-purple-50',
        'text-green-600 bg-green-50',
        'text-orange-600 bg-orange-50',
        'text-pink-600 bg-pink-50'
    ];

    const colorClass = depthColors[depth % depthColors.length];
    const borderColorClass = [
        'border-blue-600',
        'border-purple-600',
        'border-green-600',
        'border-orange-600',
        'border-pink-600'
    ][depth % 5];

    return (
        <div ref={setNodeRef} style={style} className="relative">
            {/* Tree connector lines */}
            {depth > 0 && (
                <div className="absolute pointer-events-none">
                    {/* Vertical line from parent */}
                    {!isLastChild && (
                        <div
                            className="absolute w-0.5 bg-gray-300"
                            style={{
                                left: `${indentPx - 14}px`,
                                top: 0,
                                bottom: 0,
                            }}
                        />
                    )}

                    {/* Horizontal line to this module */}
                    <div
                        className="absolute h-0.5 bg-gray-300"
                        style={{
                            left: `${indentPx - 14}px`,
                            top: '20px',
                            width: '14px',
                        }}
                    />

                    {/* Vertical line for previous siblings */}
                    {parentPath.map((shouldDraw, idx) => (
                        shouldDraw && (
                            <div
                                key={idx}
                                className="absolute w-0.5 bg-gray-300"
                                style={{
                                    left: `${(idx + 1) * 28 - 14}px`,
                                    top: 0,
                                    bottom: 0,
                                }}
                            />
                        )
                    ))}
                </div>
            )}

            {/* Module Row */}
            <div
                className={`group relative flex items-center py-2.5 px-3 rounded-lg transition-all duration-200 ${isSelected
                        ? `bg-gradient-to-r from-blue-50 to-transparent border-l-4 ${borderColorClass} shadow-sm`
                        : 'hover:bg-gray-50 border-l-4 border-transparent hover:shadow-sm'
                    } ${isDragging ? 'shadow-xl ring-2 ring-blue-400 scale-105 bg-white z-50' : ''}`}
                style={{ marginLeft: `${indentPx}px` }}
            >
                {/* Depth Badge */}
                {depth > 0 && (
                    <div
                        className={`absolute -left-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${colorClass} ring-2 ring-white shadow-sm`}
                    >
                        {depth}
                    </div>
                )}

                {/* Drag Handle */}
                <button
                    className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-200 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                    {...attributes}
                    {...listeners}
                    title="Arrastar para reordenar"
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Expand/Collapse */}
                {hasChildren ? (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-1.5 hover:bg-gray-200 rounded-md ml-1 transition-all duration-200"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                    </button>
                ) : (
                    <div className="w-8" />
                )}

                {/* Module Icon */}
                <div className="ml-2 mr-3">
                    {hasChildren && isExpanded ? (
                        <FolderOpen className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                    ) : (
                        <Folder className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                    )}
                </div>

                {/* Module Title */}
                <button
                    onClick={() => onSelectModule(module.id)}
                    className="flex-1 text-left text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                >
                    {module.title}
                </button>

                {/* Content Count Badge */}
                <div className="mr-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Nível {depth}
                </div>

                {/* Action Buttons (on hover) */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    {depth < maxDepth && (
                        <button
                            onClick={() => onAddChild(module.id)}
                            className="p-1.5 hover:bg-blue-100 rounded-md text-blue-600 transition-all hover:scale-110"
                            title="Adicionar Submódulo"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(module.id, module.title)}
                        className="p-1.5 hover:bg-gray-200 rounded-md text-gray-600 transition-all hover:scale-110"
                        title="Editar Título"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete(module.id)}
                        className="p-1.5 hover:bg-red-100 rounded-md text-red-600 transition-all hover:scale-110"
                        title="Excluir"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Children (recursive) */}
            {hasChildren && isExpanded && (
                <div className="mt-0.5">
                    {module.children!.map((child, index) => (
                        <ModuleTreeItem
                            key={child.id}
                            module={child}
                            depth={depth + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onSelectModule={onSelectModule}
                            selectedModuleId={selectedModuleId}
                            isLastChild={index === module.children!.length - 1}
                            parentPath={[...parentPath, !isLastChild]}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
