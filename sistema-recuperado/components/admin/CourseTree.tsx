'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Loader2, Plus, X, Video, FileText, ChevronRight, MoreVertical, GripVertical, Trash2, Edit2, Play, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleTreeItem } from './ModuleTreeItem';
import { ContentListItem } from './ContentListItem';
import { VideoUploader } from './VideoUploader';
import { ModuleWithChildren, Content } from '@/types/enrollment';
import {
    createModule,
    deleteModule,
    updateModuleTitle,
    reorderModules,
    reorderContents,
    deleteContent,
    updateContentTitle,
    createContent,
} from '@/app/(admin)/contents/actions';

interface CourseTreeProps {
    portalId: string;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

export function CourseTree({ portalId }: CourseTreeProps) {
    const [modules, setModules] = useState<ModuleWithChildren[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [contents, setContents] = useState<Content[]>([]);

    // Editor Drawer State
    const [editingContent, setEditingContent] = useState<Content | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Load States
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingContents, setIsLoadingContents] = useState(false);

    const supabase = createClient();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // --- Fetching Logic (Same as before) ---
    const buildModuleTree = (flatModules: any[]): ModuleWithChildren[] => {
        const moduleMap = new Map<string, ModuleWithChildren>();
        const rootModules: ModuleWithChildren[] = [];

        flatModules.forEach(module => {
            moduleMap.set(module.id, { ...module, children: [] });
        });

        flatModules.forEach(module => {
            const node = moduleMap.get(module.id)!;
            if (module.parent_module_id) {
                const parent = moduleMap.get(module.parent_module_id);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(node);
                } else {
                    rootModules.push(node);
                }
            } else {
                rootModules.push(node);
            }
        });

        const sortChildren = (modules: ModuleWithChildren[]) => {
            modules.sort((a, b) => a.order_index - b.order_index);
            modules.forEach(m => {
                if (m.children && m.children.length > 0) {
                    sortChildren(m.children);
                }
            });
        };
        sortChildren(rootModules);

        return rootModules;
    };

    const fetchModules = async () => {
        try {
            console.log('Fetching modules for portalId:', portalId);
            const { data, error } = await supabase
                .from('modules')
                .select('*')
                .eq('portal_id', portalId)
                // .eq('is_active', true) // Temporarily commented out until DB is confirmed
                .order('order_index', { ascending: true });

            if (error) throw error;
            setModules(buildModuleTree(data || []));
        } catch (error: any) {
            console.error('Error fetching modules (RAW):', JSON.stringify(error, null, 2));
            toast.error(`Erro ao carregar módulos: ${error.message || JSON.stringify(error) || 'Erro desconhecido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchContents = async (moduleId: string) => {
        try {
            setIsLoadingContents(true);
            const { data, error } = await supabase
                .from('contents')
                .select('*')
                .eq('module_id', moduleId)
                // .eq('is_active', true)
                .order('order_index', { ascending: true });

            if (error) throw error;
            setContents((data as unknown as Content[]) || []);
        } catch (error) {
            toast.error('Erro ao carregar conteúdos');
        } finally {
            setIsLoadingContents(false);
        }
    };

    useEffect(() => {
        fetchModules();
    }, [portalId]);

    useEffect(() => {
        if (selectedModuleId) {
            fetchContents(selectedModuleId);
        } else {
            setContents([]);
        }
    }, [selectedModuleId]);

    // --- Flattening for DnD ---
    const flattenModules = (tree: ModuleWithChildren[]): ModuleWithChildren[] => {
        const result: ModuleWithChildren[] = [];
        const flatten = (nodes: ModuleWithChildren[]) => {
            nodes.forEach(node => {
                result.push(node);
                if (node.children?.length) flatten(node.children);
            });
        };
        flatten(tree);
        return result;
    };

    const flatModules = useMemo(() => flattenModules(modules), [modules]);

    // --- Handlers (Same as before) ---
    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        // Check if it's a Module or Content
        const isModule = flatModules.some(m => m.id === active.id);

        if (isModule) {
            // Basic Reorder Logic
            const oldIndex = flatModules.findIndex(m => m.id === active.id);
            const newIndex = flatModules.findIndex(m => m.id === over.id);

            const updates = arrayMove(flatModules, oldIndex, newIndex).map((m, i) => ({
                id: m.id,
                order_index: i
            }));

            setModules(buildModuleTree(arrayMove(flatModules, oldIndex, newIndex)));
            await reorderModules(updates);
            fetchModules();
        } else {
            // Content Reordering
            const oldIndex = contents.findIndex(c => c.id === active.id);
            const newIndex = contents.findIndex(c => c.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newContents = arrayMove(contents, oldIndex, newIndex);
                setContents(newContents);
                await reorderContents(newContents.map((c, i) => ({ id: c.id, order_index: i })));
            }
        }
    };

    const handleCreateModule = async (parentId: string | null = null) => {
        const title = prompt('Nome do novo módulo:');
        if (!title) return;

        const result = await createModule({
            title,
            description: '',
            portal_id: portalId,
            parent_module_id: parentId,
            order_index: 999
        });

        if (result.error) toast.error(result.error);
        else {
            toast.success('Módulo criado!');
            fetchModules();
        }
    };

    const handleReferenceContent = async (content: Content) => {
        setEditingContent(content);
        setIsDrawerOpen(true);
    };

    const handleAddNewContent = async () => {
        if (!selectedModuleId) return;

        const result = await createContent({
            title: 'Nova Aula Sem Título',
            module_id: selectedModuleId,
            content_type: 'video',
            order_index: contents.length
        });

        if (result.data) {
            const newContent = result.data as unknown as Content;
            setEditingContent(newContent);
            fetchContents(selectedModuleId);
            setIsDrawerOpen(true);
        } else {
            await fetchContents(selectedModuleId);
        }
    };

    const saveContentDetails = async (updates: Partial<Content>) => {
        if (!editingContent) return;

        const { error } = await supabase
            .from('contents')
            .update(updates)
            .eq('id', editingContent.id);

        if (error) {
            toast.error('Erro ao salvar aula');
        } else {
            toast.success('Aula atualizada!');
            setEditingContent({ ...editingContent, ...updates });
            fetchContents(selectedModuleId!);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-[700px] gap-6">
            {/* Left: Module Tree */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">Estrutura do Curso</h3>
                    <button
                        onClick={() => handleCreateModule(null)}
                        className="p-2 bg-[#FF2D78] hover:bg-[#d61c5e] text-white rounded-lg transition shadow-sm hover:shadow-md"
                        title="Novo Módulo Raiz"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={flatModules.map(m => m.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3 pb-20">
                                {modules.map(module => (
                                    <ModuleTreeItem
                                        key={module.id}
                                        module={module}
                                        depth={0}
                                        onEdit={async (id, title) => { await updateModuleTitle(id, title); fetchModules(); }}
                                        onDelete={async (id) => { await deleteModule(id); fetchModules(); }}
                                        onAddChild={(id) => handleCreateModule(id)}
                                        onSelectModule={setSelectedModuleId}
                                        selectedModuleId={selectedModuleId || undefined}
                                    />
                                ))}
                                {modules.length === 0 && !isLoading && (
                                    <div className="text-center py-10 px-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum módulo criado ainda.</p>
                                    </div>
                                )}
                            </div>
                        </SortableContext>
                        <DragOverlay>
                            {activeId ? (
                                <div className="bg-white dark:bg-gray-800 p-4 shadow-xl rounded-xl border border-[#FF2D78]/50 opacity-90 text-sm font-medium">Movendo módulo...</div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            {/* Right: Contents of Selected Module */}
            <div className="w-full lg:w-2/3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
                {selectedModuleId ? (
                    <>
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/20">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-[#FF2D78]"></span>
                                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm uppercase tracking-wide">
                                    Aulas do Módulo
                                </h3>
                            </div>
                            <button
                                onClick={handleAddNewContent}
                                className="flex items-center gap-2 px-4 py-2 bg-[#FF2D78]/10 text-[#FF2D78] hover:bg-[#FF2D78]/20 rounded-lg text-xs font-bold uppercase tracking-wider transition"
                            >
                                <Plus className="w-4 h-4" /> Nova Aula
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30 dark:bg-gray-900/50">
                            {contents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 m-2">
                                    <div className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-sm mb-4">
                                        <Video className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="font-medium text-sm">Este módulo ainda não tem aulas</p>
                                    <p className="text-xs mt-1 text-gray-400">Clique em "Nova Aula" para começar</p>
                                </div>
                            ) : (
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={contents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-3 pb-20">
                                            {contents.map(content => (
                                                <div key={content.id} onClick={() => handleReferenceContent(content)} className="cursor-pointer group">
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-[#FF2D78]/30 transition-all flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="text-gray-300 group-hover:text-[#FF2D78] transition-colors cursor-grab">
                                                                <GripVertical className="w-5 h-5" />
                                                            </div>
                                                            <div className={`p-2 rounded-lg ${content.content_type === 'video' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                                                                {content.content_type === 'video' ? <Play className="w-4 h-4 fill-current" /> : <FileText className="w-4 h-4" />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{content.title}</h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-500 font-medium">
                                                                        {content.duration ? `${Math.floor(content.duration / 60)} min` : '0 min'}
                                                                    </span>
                                                                    {content.is_preview && (
                                                                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">GRÁTIS</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // delete logic
                                                            }}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                        <ChevronRight className="w-24 h-24 mb-6 opacity-10" />
                        <p className="font-bold text-lg text-gray-400">Selecione um módulo</p>
                        <p className="text-sm text-gray-400 mt-2">Para visualizar e gerenciar suas aulas</p>
                    </div>
                )}
            </div>

            {/* DRAWER: Content Editor (Unchanged structure, just style tweaks) */}
            {isDrawerOpen && editingContent && (
                <div className="fixed inset-y-0 right-0 w-[500px] bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <h2 className="font-bold text-lg text-gray-800 dark:text-white">Editar Aula</h2>
                        <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Título da Aula</label>
                            <input
                                type="text"
                                value={editingContent.title}
                                onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                                onBlur={(e) => saveContentDetails({ title: e.target.value })}
                                className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Vídeo</label>
                            <div className="p-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                                {editingContent.video_url ? (
                                    <div className="space-y-3">
                                        <video src={editingContent.video_url} controls className="w-full rounded-lg bg-black aspect-video shadow-md" />
                                        <button
                                            onClick={() => setEditingContent({ ...editingContent, video_url: null })}
                                            className="text-xs text-red-600 hover:text-red-700 font-bold hover:underline"
                                        >
                                            REMOVER VÍDEO
                                        </button>
                                    </div>
                                ) : (
                                    <VideoUploader
                                        onUploadComplete={(url, duration) => {
                                            saveContentDetails({ video_url: url, duration: duration });
                                        }}
                                        folderPath={`portals/${portalId}/modules/${selectedModuleId}`}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Duração (seg)</label>
                                <input
                                    type="number"
                                    value={editingContent.duration || 0}
                                    onChange={(e) => setEditingContent({ ...editingContent, duration: Number(e.target.value) })}
                                    onBlur={(e) => saveContentDetails({ duration: Number(e.target.value) })}
                                    className="w-full h-12 px-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-[#FF2D78]/20 focus:border-[#FF2D78] outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-end pb-3">
                                <label className="flex items-center cursor-pointer gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition w-full">
                                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${editingContent.is_preview ? 'bg-[#FF2D78] border-[#FF2D78]' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {editingContent.is_preview && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={editingContent.is_preview || false}
                                        onChange={(e) => {
                                            const val = e.target.checked;
                                            setEditingContent({ ...editingContent, is_preview: val });
                                            saveContentDetails({ is_preview: val });
                                        }}
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Aula Gratuita?</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="px-8 py-3 bg-[#FF2D78] hover:bg-[#d61c5e] text-white rounded-xl font-bold shadow-lg shadow-pink-500/20 transition-all hover:-translate-y-0.5"
                        >
                            CONCLUÍDO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
