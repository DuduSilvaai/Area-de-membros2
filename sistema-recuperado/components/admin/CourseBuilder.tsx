// components/admin/CourseBuilder.tsx
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
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Loader2, Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleTreeItem } from './ModuleTreeItem';
import { ModuleWithChildren, Content } from '@/types/enrollment';
import {
  createModule,
  deleteModule,
  updateModuleTitle,
  reorderModules,
} from '@/app/(admin)/contents/actions';

interface CourseBuilderProps {
  portalId: string;
  onBack: () => void;
}

export function CourseBuilder({ portalId, onBack }: CourseBuilderProps) {
  const [modules, setModules] = useState<ModuleWithChildren[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [newModuleForm, setNewModuleForm] = useState({
    title: '',
    description: '',
    parentId: null as string | null,
  });

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build hierarchical tree from flat modules array
  const buildModuleTree = (flatModules: any[]): ModuleWithChildren[] => {
    const moduleMap = new Map<string, ModuleWithChildren>();
    const rootModules: ModuleWithChildren[] = [];

    // First pass: create map
    flatModules.forEach(module => {
      moduleMap.set(module.id, { ...module, children: [] });
    });

    // Second pass: build tree
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

    // Sort each level by order_index
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
      setIsLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('portal_id', portalId)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      const tree = buildModuleTree(data || []);
      setModules(tree);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Falha ao carregar os módulos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (portalId) {
      fetchModules();
    }
  }, [portalId]);

  // Flatten tree for drag-and-drop
  const flattenModules = (tree: ModuleWithChildren[]): ModuleWithChildren[] => {
    const result: ModuleWithChildren[] = [];
    const flatten = (modules: ModuleWithChildren[]) => {
      modules.forEach(m => {
        result.push(m);
        if (m.children && m.children.length > 0) {
          flatten(m.children);
        }
      });
    };
    flatten(tree);
    return result;
  };

  const flatModules = useMemo(() => flattenModules(modules), [modules]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeIndex = flatModules.findIndex(m => m.id === active.id);
    const overIndex = flatModules.findIndex(m => m.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Reorder locally
    const reordered = arrayMove(flatModules, activeIndex, overIndex);

    // Update order_index for all affected modules
    const updates = reordered.map((mod, idx) => ({
      id: mod.id,
      order_index: idx,
    }));

    // Optimistic update
    setModules(buildModuleTree(reordered));

    // Persist to database
    const result = await reorderModules(updates);
    if (result.error) {
      toast.error(result.error);
      await fetchModules(); // Revert on error
    } else {
      toast.success('Ordem atualizada!');
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModuleForm.title.trim()) {
      toast.error('O título do módulo é obrigatório');
      return;
    }

    try {
      setIsCreating(true);
      const result = await createModule({
        title: newModuleForm.title,
        description: newModuleForm.description,
        portal_id: portalId,
        parent_module_id: newModuleForm.parentId,
        order_index: flatModules.length,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setNewModuleForm({ title: '', description: '', parentId: null });
      await fetchModules();
      toast.success('Módulo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      toast.error('Erro ao criar o módulo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditModule = async (moduleId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast.error('O título não pode estar vazio');
      return;
    }

    const result = await updateModuleTitle(moduleId, newTitle);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Título atualizado!');
      await fetchModules();
      setEditingModuleId(null);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Tem certeza? Isso excluirá o módulo e todos os seus submódulos e conteúdos.')) {
      return;
    }

    const result = await deleteModule(moduleId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Módulo excluído!');
      await fetchModules();
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(undefined);
      }
    }
  };

  const handleAddChildModule = (parentId: string) => {
    setNewModuleForm({ ...newModuleForm, parentId });
    toast.info(`Próximo módulo será criado como filho`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Módulos</h1>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900">Drag-and-Drop Ativado</h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>• Arraste módulos para reordenar</p>
              <p>• Passe o mouse para ver ações rápidas</p>
              <p>• Crie sub-módulos com o botão "+"</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar: Module Tree */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              Estrutura ({flatModules.length})
            </h2>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={flatModules.map(m => m.id)}
                strategy={verticalListSortingStrategy}
              >
                {modules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Nenhum módulo criado ainda.</p>
                    <p className="text-xs mt-1">Crie seu primeiro módulo ao lado →</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {modules.map(module => (
                      <ModuleTreeItem
                        key={module.id}
                        module={module}
                        depth={0}
                        onEdit={(id, title) => {
                          setEditingModuleId(id);
                          setEditTitle(title);
                        }}
                        onDelete={handleDeleteModule}
                        onAddChild={handleAddChildModule}
                        onSelectModule={setSelectedModuleId}
                        selectedModuleId={selectedModuleId}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Main Content: Create Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              {newModuleForm.parentId ? '➕ Novo Submódulo' : '➕ Novo Módulo'}
            </h2>

            {newModuleForm.parentId && (
              <div className="mb-4 p-3 bg-blue-50 rounded-md flex items-center justify-between">
                <span className="text-sm text-blue-900">
                  Será criado como filho do módulo selecionado
                </span>
                <button
                  onClick={() => setNewModuleForm({ ...newModuleForm, parentId: null })}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Cancelar
                </button>
              </div>
            )}

            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Título do Módulo *
                </label>
                <input
                  type="text"
                  id="title"
                  value={newModuleForm.title}
                  onChange={(e) => setNewModuleForm({ ...newModuleForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Introdução ao Curso"
                  disabled={isCreating}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={newModuleForm.description}
                  onChange={(e) => setNewModuleForm({ ...newModuleForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Breve descrição do módulo"
                  disabled={isCreating}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating || !newModuleForm.title.trim()}
                  className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {newModuleForm.parentId ? 'Criar Submódulo' : 'Criar Módulo'}
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Selected Module Content (placeholder for future) */}
            {selectedModuleId && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">
                  📚 Conteúdos do Módulo
                </h3>
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm">Gerenciamento de conteúdos em breve...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal (Simple Inline) */}
      {editingModuleId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Título</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Novo título"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEditingModuleId(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEditModule(editingModuleId, editTitle)}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}