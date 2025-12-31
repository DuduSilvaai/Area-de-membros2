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
    DragStartEvent,
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
import { Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { ModuleTreeItem } from './ModuleTreeItem';
import { ModuleModal } from './ModuleModal';
import { LessonDrawer } from './LessonDrawer';
import { ConfirmModal } from './ConfirmModal';
import { ModuleWithChildren, ModuleWithContents, Content } from '@/types/enrollment';
import {
    createModule,
    deleteModule,
    reorderModules,
    reorderContents,
    deleteContent,
    createContent,
} from '@/app/(admin)/contents/actions';
import { Button } from '@/components/ui/button';

interface CourseTreeProps {
    portalId: string;
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '0.5' },
        },
    }),
};

export function CourseTree({ portalId }: CourseTreeProps) {
    // Data State
    const [modules, setModules] = useState<ModuleWithContents[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI State
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeItem, setActiveItem] = useState<any>(null); // To show correct overlay

    // Modal/Drawer State
    const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<ModuleWithContents | null>(null); // For creating sub-modules or editing
    const [creatingSubModuleParentId, setCreatingSubModuleParentId] = useState<string | null>(null);

    const [isLessonDrawerOpen, setIsLessonDrawerOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Content | null>(null);
    const [creatingLessonModuleId, setCreatingLessonModuleId] = useState<string | null>(null);

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
        variant: 'danger' | 'default';
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
        variant: 'default'
    });

    const supabase = createClient();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- Fetching Logic ---
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const { data: modulesData, error: modulesError } = await supabase
                .from('modules')
                .select('*')
                .eq('portal_id', portalId)
                .order('order_index', { ascending: true });

            if (modulesError) throw modulesError;

            const moduleIds = modulesData.map(m => m.id);
            let contentsData: Content[] = [];
            if (moduleIds.length > 0) {
                const { data: contents, error: contentsError } = await supabase
                    .from('contents')
                    .select('*')
                    .in('module_id', moduleIds)
                    .order('order_index', { ascending: true });

                if (contentsError) throw contentsError;
                contentsData = (contents as unknown as Content[]) || [];
            }

            const builtTree = buildTree(modulesData, contentsData);
            setModules(builtTree);

        } catch (error: any) {
            console.error('Error fetching course tree:', error);
            toast.error('Erro ao carregar estrutura do curso');
        } finally {
            setIsLoading(false);
        }
    };

    const buildTree = (flatModules: any[], flatContents: Content[]): ModuleWithContents[] => {
        const moduleMap = new Map<string, ModuleWithContents>();

        flatModules.forEach(m => {
            moduleMap.set(m.id, {
                ...m,
                children: [],
                contents: []
            });
        });

        flatContents.forEach(c => {
            const module = moduleMap.get(c.module_id);
            if (module) {
                if (!module.contents) module.contents = [];
                module.contents.push(c);
            }
        });

        const rootModules: ModuleWithContents[] = [];
        flatModules.forEach(m => {
            const node = moduleMap.get(m.id)!;
            node.contents?.sort((a, b) => a.order_index - b.order_index);

            if (m.parent_module_id) {
                const parent = moduleMap.get(m.parent_module_id);
                if (parent) {
                    if (!parent.children) parent.children = [];
                    parent.children.push(node);
                } else {
                    rootModules.push(node);
                }
            } else {
                rootModules.push(node);
            }
        });

        const sortNodes = (nodes: ModuleWithContents[]) => {
            nodes.sort((a, b) => a.order_index - b.order_index);
            nodes.forEach(n => {
                if (n.children && n.children.length > 0) sortNodes(n.children);
            });
        };
        sortNodes(rootModules);

        return rootModules;
    };

    useEffect(() => {
        fetchData();
    }, [portalId]);

    // --- Actions ---

    const handleCreateModuleSave = async (data: any) => {
        // If we have an ID, it's an update
        if (editingModule && editingModule.id) {
            const supabase = createClient();
            const { error } = await supabase
                .from('modules')
                .update({
                    title: data.title,
                    description: data.description,
                    // Handle other fields if necessary
                })
                .eq('id', editingModule.id);

            if (error) {
                toast.error('Erro ao atualizar módulo');
            } else {
                toast.success('Módulo atualizado!');
                fetchData();
            }
        } else {
            // Create
            const res = await createModule({
                ...data,
                portal_id: portalId,
                parent_module_id: creatingSubModuleParentId
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Módulo criado!');
                fetchData();
            }
        }
        setIsModuleModalOpen(false);
        setCreatingSubModuleParentId(null);
        setEditingModule(null);
    };

    const handleCreateLesson = (moduleId: string) => {
        setCreatingLessonModuleId(moduleId);
        setEditingLesson(null);
        setIsLessonDrawerOpen(true);
    };

    const handleDrawerSave = async (id: string, updates: Partial<Content>) => {
        // The Drawer now handles the upsert/persistence directly.
        // We just need to refresh the tree.
        await fetchData();
    };


    // --- Drag and Drop ---
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
        setActiveItem(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveItem(null);

        if (!over) return;
        if (active.id === over.id) return;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;
        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeType === 'Module') {
            const oldIndex = modules.findIndex(m => m.id === active.id);
            const newIndex = modules.findIndex(m => m.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newModules = arrayMove(modules, oldIndex, newIndex);
                setModules(newModules);
                const updates = newModules.map((m, i) => ({ id: m.id, order_index: i }));
                await reorderModules(updates);
            }
        }
        else if (activeType === 'Lesson') {
            const activeLesson = activeData?.lesson as Content;
            const sourceModuleId = activeLesson.module_id;
            let targetModuleId: string | null = null;
            let newIndex = 0;

            if (overType === 'Module') {
                targetModuleId = over.id as string;
                const targetMod = modules.find(m => m.id === targetModuleId);
                newIndex = targetMod?.contents?.length || 0;
            } else if (overType === 'Lesson') {
                const overLesson = overData?.lesson as Content;
                targetModuleId = overLesson.module_id;
                const targetMod = modules.find(m => m.id === targetModuleId);
                if (targetMod && targetMod.contents) {
                    const overIndex = targetMod.contents.findIndex(c => c.id === overLesson.id);
                    newIndex = overIndex;
                }
            }

            if (!targetModuleId) return;

            if (sourceModuleId === targetModuleId) {
                const moduleIndex = modules.findIndex(m => m.id === sourceModuleId);
                if (moduleIndex === -1) return;
                const mod = modules[moduleIndex];
                if (!mod.contents) return;

                const oldLIndex = mod.contents.findIndex(c => c.id === active.id);
                const newLIndex = mod.contents.findIndex(c => c.id === over.id);

                if (oldLIndex !== -1 && newLIndex !== -1) {
                    const newContents = arrayMove(mod.contents, oldLIndex, newLIndex);
                    const updatedModules = [...modules];
                    updatedModules[moduleIndex] = { ...mod, contents: newContents };
                    setModules(updatedModules);
                    await reorderContents(newContents.map((c, i) => ({ id: c.id, order_index: i })));
                }
            } else {
                const supabase = createClient();
                await supabase.from('contents').update({
                    module_id: targetModuleId,
                    order_index: newIndex
                }).eq('id', active.id as string);
                fetchData();
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
            {/* Toolbar */}
            <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-zinc-100 font-bold text-lg tracking-tight">Estrutura do Curso</h2>
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={isLoading}
                        className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingModule(null);
                            setCreatingSubModuleParentId(null);
                            setIsModuleModalOpen(true);
                        }}
                        className="bg-pink-600 hover:bg-pink-700 text-white border-0 shadow-lg shadow-pink-600/20 transition-all font-bold"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Módulo
                    </Button>
                </div>
            </div>

            {/* Tree Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-2 relative bg-grid-zinc-900/50 [mask-image:linear-gradient(to_bottom,transparent,black)]">
                {/* Only visual grid pattern, maybe remove if too noisy */}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={modules.map(m => m.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {modules.length > 0 ? (
                            modules.map(module => (
                                <ModuleTreeItem
                                    key={module.id}
                                    module={module}
                                    onEdit={(m) => {
                                        setEditingModule(m);
                                        setCreatingSubModuleParentId(null);
                                        setIsModuleModalOpen(true);
                                    }}
                                    onDelete={(id) => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'Excluir Módulo',
                                            description: 'Tem certeza? Isso apagará todas as aulas e submódulos contidos aqui. Esta ação não pode ser desfeita.',
                                            variant: 'danger',
                                            onConfirm: async () => {
                                                await deleteModule(id);
                                                fetchData();
                                            }
                                        });
                                    }}
                                    onAddLesson={(modId) => handleCreateLesson(modId)}
                                    onEditLesson={(lesson) => {
                                        setCreatingLessonModuleId(null);
                                        setEditingLesson(lesson);
                                        setIsLessonDrawerOpen(true);
                                    }}
                                    onDeleteLesson={(lessonId) => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'Excluir Aula',
                                            description: 'Excluir permanentemente esta aula? O progresso dos alunos será perdido.',
                                            variant: 'danger',
                                            onConfirm: async () => {
                                                await deleteContent(lessonId);
                                                fetchData();
                                            }
                                        });
                                    }}
                                />
                            ))
                        ) : (
                            !isLoading && (
                                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-zinc-500 hover:border-zinc-700 transition-colors group">
                                    <div className="p-4 rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors mb-3">
                                        <Plus className="w-8 h-8 opacity-50" />
                                    </div>
                                    <p className="font-medium">Nenhum módulo criado ainda.</p>
                                    <Button variant="link" onClick={() => setIsModuleModalOpen(true)} className="text-pink-500 font-bold">
                                        + Criar o primeiro módulo
                                    </Button>
                                </div>
                            )
                        )}
                    </SortableContext>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeId ? (
                            <div className="p-3 bg-zinc-800 rounded-lg shadow-xl border border-pink-500/30 text-zinc-200 font-medium">
                                {activeItem?.type === 'Module' ? `Módulo: ${activeItem?.module?.title}` : `Aula: ${activeItem?.lesson?.title}`}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Modals */}
            <ModuleModal
                isOpen={isModuleModalOpen}
                onClose={() => setIsModuleModalOpen(false)}
                onSave={handleCreateModuleSave}
                initialData={editingModule ? {
                    title: editingModule.title,
                    description: editingModule.description || '',
                    id: editingModule.id
                } : null}
            />

            <LessonDrawer
                isOpen={isLessonDrawerOpen}
                onClose={() => setIsLessonDrawerOpen(false)}
                lesson={editingLesson || (creatingLessonModuleId ? { module_id: creatingLessonModuleId } as any : null)}
                onSave={handleDrawerSave}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                variant={confirmModal.variant}
            />
        </div>
    );
}
