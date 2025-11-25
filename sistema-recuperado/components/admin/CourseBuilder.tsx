// components/admin/CourseBuilder.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Module {
  id: string;
  title: string;
  description: string | null;
  portal_id?: string;
  created_at: string;
  updated_at: string | null;
  order_index: number;
  image_url?: string | null;
}

interface CourseBuilderProps {
  portalId: string;
  onBack: () => void;
}

export function CourseBuilder({ portalId, onBack }: CourseBuilderProps) {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newModule, setNewModule] = useState({
    title: '',
    description: ''
  });
  
  const supabase = createClient();

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('portal_id', portalId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      
      // Ensure all required fields are present and properly typed
      const typedModules = (data || []).map((module: any) => ({
        id: module.id,
        title: module.title || 'Sem título',
        description: module.description ?? null,
        portal_id: portalId, // Use the portalId from props
        created_at: module.created_at || new Date().toISOString(),
        updated_at: module.updated_at ?? null,
        order_index: typeof module.order_index === 'number' ? module.order_index : 0,
        image_url: module.image_url ?? null
      } as Module));
      
      setModules(typedModules);
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

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModule.title.trim()) {
      toast.error('O título do módulo é obrigatório');
      return;
    }

    try {
      setIsCreating(true);
      const { data, error } = await supabase
        .from('modules')
        .insert([
          { 
            title: newModule.title.trim(),
            description: newModule.description.trim() || null,
            portal_id: portalId,
            order_index: modules.length
          }
        ])
        .select();

      if (error) throw error;
      
      setNewModule({ title: '', description: '' });
      await fetchModules(); // Atualiza a lista de módulos
      toast.success('Módulo criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      toast.error('Erro ao criar o módulo');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <button 
          onClick={onBack}
          className="mr-4 text-gray-600 hover:text-gray-900"
        >
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold">Gerenciar Módulos</h1>
      </div>

      {/* Formulário para criar novo módulo */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Novo Módulo</h2>
        <form onSubmit={handleCreateModule} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Título do Módulo *
            </label>
            <input
              type="text"
              id="title"
              value={newModule.title}
              onChange={(e) => setNewModule({...newModule, title: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Ex: Introdução ao Curso"
              disabled={isCreating}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Descrição (opcional)
            </label>
            <textarea
              id="description"
              rows={2}
              value={newModule.description}
              onChange={(e) => setNewModule({...newModule, description: e.target.value})}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Breve descrição do módulo"
              disabled={isCreating}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating || !newModule.title.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Módulo
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de módulos existentes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Módulos ({modules.length})</h2>
        </div>
        {modules.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhum módulo encontrado. Crie seu primeiro módulo acima.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {modules.map((module) => (
              <li key={module.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{module.title}</h3>
                    {module.description && (
                      <p className="mt-1 text-sm text-gray-500">{module.description}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(module.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}