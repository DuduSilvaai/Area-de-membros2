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
  reorderContents,
  deleteContent,
  updateContentTitle,
  createContent
} from '@/app/(admin)/contents/actions';
import { ContentListItem } from './ContentListItem';

interface CourseBuilderProps {
  portalId: string;
  onBack: () => void;
}

export function CourseBuilder({ portalId, onBack }: CourseBuilderProps) {
  const [modules, setModules] = useState<ModuleWithChildren[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>();
  const [contents, setContents] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingContent, setIsCreatingContent] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Module Form
  const [newModuleForm, setNewModuleForm] = useState({
    title: '',
    description: '',
    parentId: null as string | null,
  });

  // Content Form
  const [showContentForm, setShowContentForm] = useState(false);
  const [newContentForm, setNewContentForm] = useState({
    title: '',
    type: 'video' as 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external',
    url: '',
  });

  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Build hierarchical tree from flat modules array
  const buildModuleTree = (flatModules: ModuleWithChildren[]): ModuleWithChildren[] => {
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

      // Map to ensure all required fields exist (DB might be missing new fields)
      const mappedModules: ModuleWithChildren[] = (data || []).map((m: any) => ({
        ...m,
        is_released: m.is_released ?? true, // Default to released if missing
        release_date: m.release_date || null
      }));

      const tree = buildModuleTree(mappedModules);
      setModules(tree);
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast.error('Falha ao carregar os módulos');
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
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;

      setContents((data as Content[]) || []);
    } catch (error) {
      console.error('Error fetching contents:', error);
      toast.error('Falha ao carregar conteúdos');
    } finally {
      setIsLoadingContents(false);
    }
  };

  useEffect(() => {
    if (portalId) {
      fetchModules();
    }
  }, [portalId]);

  useEffect(() => {
    if (selectedModuleId) {
      fetchContents(selectedModuleId);
      setShowContentForm(false); // Reset form when changing modules
    } else {
      setContents([]);
    }
  }, [selectedModuleId]);

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

    if (activeIndex !== -1 && overIndex !== -1) {
      // Module Reordering
      const reordered = arrayMove(flatModules, activeIndex, overIndex);

      // Optimistic update
      setModules(buildModuleTree(reordered));

      const updates = reordered.map((mod, idx) => ({
        id: mod.id,
        order_index: idx,
      }));

      const result = await reorderModules(updates);
      if (result.error) {
        toast.error(result.error);
        await fetchModules();
      } else {
        toast.success('Ordem dos módulos atualizada!');
      }
      return;
    }

    // Content Reordering
    const activeContentIndex = contents.findIndex(c => c.id === active.id);
    const overContentIndex = contents.findIndex(c => c.id === over.id);

    if (activeContentIndex !== -1 && overContentIndex !== -1) {
      const reordered = arrayMove(contents, activeContentIndex, overContentIndex);
      setContents(reordered); // Optimistic

      const updates = reordered.map((c, idx) => ({
        id: c.id,
        order_index: idx
      }));

      const result = await reorderContents(updates);
      if (result.error) {
        toast.error(result.error);
        if (selectedModuleId) await fetchContents(selectedModuleId);
      } else {
        toast.success('Ordem dos conteúdos atualizada!');
      }
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

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) return;
    if (!newContentForm.title.trim()) {
      toast.error('O título da aula é obrigatório');
      return;
    }

    try {
      setIsCreatingContent(true);
      const result = await createContent({
        title: newContentForm.title,
        module_id: selectedModuleId,
        content_type: newContentForm.type,
        order_index: contents.length,
        video_url: newContentForm.type === 'video' ? newContentForm.url : undefined,
        content_url: newContentForm.type !== 'video' ? newContentForm.url : undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setNewContentForm({ title: '', type: 'video', url: '' });
      setShowContentForm(false);
      await fetchContents(selectedModuleId);
      toast.success('Aula criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar aula:', error);
      toast.error('Erro ao criar a aula');
    } finally {
      setIsCreatingContent(false);
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

  const handleEditContent = async (contentId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      toast.error('O título não pode estar vazio');
      return;
    }

    const result = await updateContentTitle(contentId, newTitle);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Título da aula atualizado!');
      if (selectedModuleId) await fetchContents(selectedModuleId);
      setEditingContentId(null);
    }
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta aula?')) {
      return;
    }

    const result = await deleteContent(contentId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Aula excluída!');
      if (selectedModuleId) await fetchContents(selectedModuleId);
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
              <p>• Selecione um módulo para gerenciar suas aulas</p>
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
                        onEdit={(module) => {
                          setEditingModuleId(module.id);
                          setEditTitle(module.title);
                        }}
                        onDelete={handleDeleteModule}
                        onAddLesson={(moduleId) => {
                          setSelectedModuleId(moduleId);
                          setShowContentForm(true);
                        }}
                        onEditLesson={(lesson) => {
                          setEditingContentId(lesson.id);
                          setEditTitle(lesson.title);
                        }}
                        onDeleteLesson={handleDeleteContent}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Create Module Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                  rows={2}
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
          </div>

          {/* Selected Module Content */}
          {selectedModuleId ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  📚 Aulas do Módulo
                </h2>
                <button
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  onClick={() => setShowContentForm(!showContentForm)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Nova Aula
                </button>
              </div>

              {/* Create Content Form */}
              {showContentForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Adicionar Nova Aula</h3>
                  <form onSubmit={handleCreateContent} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        placeholder="Título da Aula"
                        value={newContentForm.title}
                        onChange={(e) => setNewContentForm({ ...newContentForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newContentForm.type}
                        onChange={(e) => setNewContentForm({ ...newContentForm, type: e.target.value as 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="video">Vídeo</option>
                        <option value="text">Texto</option>
                        <option value="pdf">PDF</option>
                        <option value="quiz">Quiz</option>
                        <option value="external">Link Externo</option>
                      </select>
                      <input
                        type="text"
                        placeholder={newContentForm.type === 'video' ? 'URL do Vídeo (Vimeo/YouTube)' : 'URL do Conteúdo'}
                        value={newContentForm.url}
                        onChange={(e) => setNewContentForm({ ...newContentForm, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowContentForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingContent || !newContentForm.title.trim()}
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isCreatingContent ? 'Salvando...' : 'Salvar Aula'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {isLoadingContents ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : contents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm">Nenhuma aula neste módulo.</p>
                  <p className="text-xs mt-1">Adicione conteúdos para seus alunos.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={contents.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {contents.map((content) => (
                        <ContentListItem
                          key={content.id}
                          content={content}
                          onEdit={(id, title) => {
                            setEditingContentId(id);
                            setEditTitle(title);
                          }}
                          onDelete={handleDeleteContent}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              <p>Selecione um módulo à esquerda para gerenciar suas aulas.</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal (Reusable for Module and Content) */}
      {(editingModuleId || editingContentId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingModuleId ? 'Editar Título do Módulo' : 'Editar Título da Aula'}
            </h3>
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
                onClick={() => {
                  setEditingModuleId(null);
                  setEditingContentId(null);
                }}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingModuleId) handleEditModule(editingModuleId, editTitle);
                  if (editingContentId) handleEditContent(editingContentId, editTitle);
                }}
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