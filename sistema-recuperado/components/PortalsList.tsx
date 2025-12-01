'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Search, Plus, Users, Globe, Loader2, X, Cloud } from 'lucide-react';
import { Input } from '@/components/UIComponents';
import { Button } from '@/components/UIComponents';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

// --- Types & Schema ---

interface Portal {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  created_at: string;
  updated_at: string | null;
}

const portalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  image_url: z.string().optional(),
});

type PortalFormValues = z.infer<typeof portalSchema>;

// --- Components ---

const PortalCard = ({ portal }: { portal: Portal }) => {
  const lastUpdated = portal.updated_at || portal.created_at;
  const timeAgo = lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR }) : 'Recentemente';
  return (
    <Link href={`/portals/${portal.id}`} className="block group">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {portal.image_url ? <img src={portal.image_url} alt={portal.name} className="w-full h-40 object-cover" /> : <div className="h-2 bg-blue-500"></div>}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{portal.name}</h3>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">Ativo</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">{portal.description || 'Sem descrição'}</p>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3 mt-auto">
            <div className="flex items-center"><Users className="w-4 h-4 mr-1" /><span>0 membros</span></div>
            <span className="text-xs">{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function PortalsList() {
  const router = useRouter();
  const supabase = createClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [portals, setPortals] = useState<Portal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PortalFormValues>({
    resolver: zodResolver(portalSchema),
    defaultValues: {
      name: '',
      description: '',
      image_url: ''
    }
  });

  // Fetch Data with Timeout & Debug
  const fetchPortals = async () => {
    console.log('🔍 fetchPortals iniciado');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🛠️ Configuração Supabase:', {
      urlPresent: !!supabaseUrl,
      keyPresent: !!supabaseKey,
      url: supabaseUrl ? supabaseUrl.substring(0, 15) + '...' : 'MISSING',
    });

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Erro de configuração: Variáveis de ambiente ausentes');
      setIsLoading(false);
      return;
    }

    // Timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: Supabase demorou muito')), 10000)
    );

    try {
      setIsLoading(true);

      // Check auth (non-blocking for debugging)
      supabase.auth.getUser().then(({ data }) => {
        console.log('👤 Usuário (Async):', data.user ? data.user.email : 'Nenhum');
      });

      // Race between fetch and timeout
      // Simplified query to test connection
      const fetchPromise = supabase
        .from('portals')
        .select('id, name, description, image_url, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;

      const { data, error } = result;

      console.log('📦 Resposta Supabase:', {
        dataLength: data?.length,
        error
      });

      if (error) throw error;

      console.log(`✅ ${data?.length || 0} portais carregados`);
      setPortals(data || []);
    } catch (error: any) {
      console.error('❌ Erro fetchPortals:', error);
      toast.error(`Erro ao carregar: ${error.message || 'Desconhecido'}`);
      setPortals([]);
    } finally {
      console.log('🏁 Finalizando loading...');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handlers
  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Selecione apenas imagens');
    if (file.size > 5 * 1024 * 1024) return toast.error('Imagem deve ter no máximo 5MB');

    try {
      setUploadingImage(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `portals/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('course-content').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('course-content').getPublicUrl(filePath);

      setValue('image_url', publicUrl);
      setImagePreview(publicUrl);
      toast.success('Imagem enviada!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Erro no upload: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = async (data: PortalFormValues) => {
    console.log('🚀 Iniciando criação do portal...', data);
    try {
      // 1. Insert into Supabase
      const { data: newPortal, error } = await supabase
        .from('portals')
        .insert({
          name: data.name.trim(),
          description: data.description?.trim() || null,
          image_url: data.image_url || null,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Success Feedback
      console.log('✅ Portal criado:', newPortal);
      toast.success('Portal criado com sucesso!');

      // 3. Cleanup & Refresh
      reset();
      setImagePreview(null);
      setShowCreateModal(false);

      // 4. Revalidate
      await fetchPortals(); // Update local list
      router.refresh();     // Update server components/cache

    } catch (error: any) {
      console.error('❌ Erro ao criar portal:', error);
      toast.error(`Erro ao criar portal: ${error.message || 'Erro desconhecido'}`);
    } finally {
      console.log('🏁 Processo de criação finalizado');
    }
  };

  const filteredPortals = portals.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meus Portais</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie seus portais e acessos</p>
        </div>
        <Button variant="primary" className="w-full sm:w-auto" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />Criar Novo Portal
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
        <Input type="text" placeholder="Buscar portais..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : filteredPortals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortals.map(portal => <PortalCard key={portal.id} portal={portal} />)}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Globe className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">Nenhum portal encontrado</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{searchTerm ? 'Nenhum portal corresponde à sua busca.' : 'Você ainda não possui portais criados.'}</p>
          <div className="mt-6"><Button variant="primary" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Criar Novo Portal</Button></div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Criar Novo Portal</h2>
              <button
                onClick={() => { setShowCreateModal(false); reset(); setImagePreview(null); }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Image Upload Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Imagem</label>
                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setValue('image_url', ''); }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="upload"
                      accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                      className="hidden"
                      disabled={uploadingImage || isSubmitting}
                    />
                    <label
                      htmlFor="upload"
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 ease-in-out group ${uploadingImage || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? (
                        <><Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" /><p className="text-sm text-gray-600 dark:text-gray-400">Enviando...</p></>
                      ) : (
                        <><Cloud className="w-12 h-12 text-gray-400 group-hover:text-blue-500 transition-colors duration-200 mb-3" /><p className="text-sm text-gray-600 dark:text-gray-400 font-semibold group-hover:text-blue-600 transition-colors">Clique para fazer upload</p><p className="text-xs text-gray-500">PNG, JPG até 5MB</p></>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowCreateModal(false); reset(); }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || uploadingImage}
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : <><Plus className="w-4 h-4 mr-2" />Criar</>}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}