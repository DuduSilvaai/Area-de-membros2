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
import { createPortal } from '@/app/(admin)/admin/actions';

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
      <div className="bg-background-surface dark:bg-background-surface rounded-xl border border-border dark:border-border overflow-hidden shadow-card hover:shadow-medium transition-shadow duration-200 h-full flex flex-col">
        {portal.image_url ? <img src={portal.image_url} alt={portal.name} className="w-full h-40 object-cover" /> : <div className="h-2 bg-primary-main"></div>}
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary group-hover:text-primary-main dark:group-hover:text-primary-main transition-colors">{portal.name}</h3>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary-subtle dark:bg-primary-subtle text-primary-main dark:text-primary-main">Ativo</span>
          </div>
          <p className="text-sm text-text-secondary dark:text-text-secondary mb-4 flex-1 line-clamp-2">{portal.description || 'Sem descrição'}</p>
          <div className="flex items-center justify-between text-sm text-text-secondary dark:text-text-secondary border-t border-border dark:border-border pt-3 mt-auto">
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
      
      // 1. Get signed URL from server action
      // We import it dynamically or assume it's imported at top
      const { getPresignedUrl } = await import('@/app/(admin)/admin/actions');
      const result = await getPresignedUrl(file.name, file.type);
      
      if (result.error || !result.signedUrl) {
          throw new Error(result.error || 'Erro ao gerar URL de upload');
      }

      // 2. Upload directly to Supabase Storage using the signed URL
      const uploadResponse = await fetch(result.signedUrl, {
          method: 'PUT',
          body: file,
          headers: {
              'Content-Type': file.type,
          },
      });

      if (!uploadResponse.ok) {
          throw new Error(`Erro no upload: ${uploadResponse.statusText}`);
      }

      // 3. Get Public URL (Construct it manually or retrieve)
      // Since we know the path and bucket, we can construct the public URL
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/course-content/${result.path}`;

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
      // 1. Insert into Supabase via Server Action
      const result = await createPortal({
        name: data.name.trim(),
        description: data.description?.trim() || '',
        image_url: data.image_url || null,
        // Optional fields will be handled by defaults in the action
      });

      if (result.error) throw new Error(result.error);
      const newPortal = result.portal;

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
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary">Meus Portais</h1>
          <p className="text-text-secondary dark:text-text-secondary">Gerencie seus portais e acessos</p>
        </div>
        <Button variant="primary" className="w-full sm:w-auto" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />Criar Novo Portal
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-text-secondary" /></div>
        <Input type="text" placeholder="Buscar portais..." className="pl-10 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-main" /></div>
      ) : filteredPortals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortals.map(portal => <PortalCard key={portal.id} portal={portal} />)}
        </div>
      ) : (
        <div className="text-center py-12 bg-background-surface dark:bg-background-surface rounded-xl border border-border dark:border-border shadow-card">
          <Globe className="mx-auto h-12 w-12 text-text-secondary" />
          <h3 className="mt-2 text-lg font-medium text-text-primary dark:text-text-primary">Nenhum portal encontrado</h3>
          <p className="mt-1 text-text-secondary dark:text-text-secondary">{searchTerm ? 'Nenhum portal corresponde à sua busca.' : 'Você ainda não possui portais criados.'}</p>
          <div className="mt-6"><Button variant="primary" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Criar Novo Portal</Button></div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-background-surface dark:bg-background-surface rounded-xl shadow-floating max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border dark:border-border sticky top-0 bg-background-surface dark:bg-background-surface z-10">
              <h2 className="text-xl font-semibold text-text-primary dark:text-text-primary">Criar Novo Portal</h2>
              <button
                onClick={() => { setShowCreateModal(false); reset(); setImagePreview(null); }}
                className="p-2 hover:bg-background-canvas dark:hover:bg-background-canvas rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1">Nome *</label>
                <input
                  {...register('name')}
                  type="text"
                  className={`w-full px-4 py-2 border rounded-md bg-background-canvas dark:bg-background-canvas text-text-primary dark:text-text-primary transition-colors ${errors.name ? 'border-status-error' : 'border-border dark:border-border'}`}
                  disabled={isSubmitting}
                />
                {errors.name && <p className="text-status-error text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Description Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1">Descrição</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-4 py-2 border border-border dark:border-border rounded-md bg-background-canvas dark:bg-background-canvas text-text-primary dark:text-text-primary transition-colors"
                  disabled={isSubmitting}
                />
              </div>

              {/* Image Upload Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-2">Imagem</label>
                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg border-2 border-border dark:border-border" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setValue('image_url', ''); }}
                      className="absolute top-2 right-2 p-2 bg-status-error hover:bg-status-error/80 text-text-on-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                      className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-background-canvas dark:bg-background-canvas border-border dark:border-border hover:bg-primary-subtle dark:hover:bg-primary-subtle transition-colors duration-200 ease-in-out group ${uploadingImage || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingImage ? (
                        <><Loader2 className="w-12 h-12 text-primary-main animate-spin mb-3" /><p className="text-sm text-text-secondary dark:text-text-secondary">Enviando...</p></>
                      ) : (
                        <><Cloud className="w-12 h-12 text-text-secondary group-hover:text-primary-main transition-colors duration-200 mb-3" /><p className="text-sm text-text-secondary dark:text-text-secondary font-semibold group-hover:text-primary-main transition-colors">Clique para fazer upload</p><p className="text-xs text-text-disabled">PNG, JPG até 5MB</p></>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-border dark:border-border mt-6">
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
