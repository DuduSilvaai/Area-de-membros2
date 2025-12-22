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

const PortalCard = ({ portal }: { portal: Portal }) => {
  const lastUpdated = portal.updated_at || portal.created_at;
  const timeAgo = lastUpdated ? formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR }) : 'Recentemente';
  return (
    <Link href={`/portals/${portal.id}`} className="block group">
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          // Simple gradient or just surface color for dark mode compatibility
          //backgroundImage: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-canvas) 100%)', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-floating)';
          e.currentTarget.style.transform = 'translateY(-6px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {portal.image_url ? (
          <img src={portal.image_url} alt={portal.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '4px', background: 'linear-gradient(90deg, var(--primary-main) 0%, var(--primary-hover) 100%)' }}></div>
        )}
        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{portal.name}</h3>
            <span style={{ padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary-main)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>Ativo</span>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {portal.description || 'Sem descrição'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Users style={{ width: '16px', height: '16px', marginRight: '4px' }} />
              <span>0 membros</span>
            </div>
            <span style={{ fontSize: '12px' }}>{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function PortalsList() {
  const router = useRouter();
  const supabase = createClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [portals, setPortals] = useState<Portal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const fetchPortals = async () => {
    console.log('🔍 fetchPortals iniciado');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      toast.error('Erro de configuração: Variáveis de ambiente ausentes');
      setIsLoading(false);
      return;
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: Supabase demorou muito')), 10000)
    );

    try {
      setIsLoading(true);
      supabase.auth.getUser().then(({ data }) => {
        console.log('👤 Usuário (Async):', data.user ? data.user.email : 'Nenhum');
      });

      const fetchPromise = supabase
        .from('portals')
        .select('id, name, description, image_url, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(10);

      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      const { data, error } = result;

      if (error) throw error;
      console.log(`✅ ${data?.length || 0} portais carregados`);
      setPortals(data || []);
    } catch (error: any) {
      console.error('❌ Erro fetchPortals:', error);
      toast.error(`Erro ao carregar: ${error.message || 'Desconhecido'}`);
      setPortals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPortals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleImageUpload = async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return toast.error('Selecione apenas imagens');
    if (file.size > 5 * 1024 * 1024) return toast.error('Imagem deve ter no máximo 5MB');

    try {
      setUploadingImage(true);
      const { getPresignedUrl } = await import('@/app/(admin)/admin/actions');
      const result = await getPresignedUrl(file.name, file.type);

      if (result.error || !result.signedUrl) {
        throw new Error(result.error || 'Erro ao gerar URL de upload');
      }

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
    try {
      const result = await createPortal({
        name: data.name.trim(),
        description: data.description?.trim() || '',
        image_url: data.image_url || null,
      });

      if (result.error) throw new Error(result.error);
      toast.success('Portal criado com sucesso!');

      reset();
      setImagePreview(null);
      setShowCreateModal(false);

      await fetchPortals();
      router.refresh();

    } catch (error: any) {
      console.error('❌ Erro ao criar portal:', error);
      toast.error(`Erro ao criar portal: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const filteredPortals = portals.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Meus Portais</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>Gerencie seus portais e acessos</p>
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus style={{ width: '18px', height: '18px', marginRight: '8px' }} />Criar Novo Portal
          </Button>
        </div>

        {/* Search */}
        <div style={{ maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search style={{ width: '20px', height: '20px', color: 'var(--text-secondary)', position: 'absolute', left: '12px' }} />
            <Input
              type="text"
              placeholder="Buscar portais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}>
          <Loader2 style={{ width: '32px', height: '32px', animation: 'spin 1s linear infinite', color: 'var(--primary-main)' }} />
        </div>
      ) : filteredPortals.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredPortals.map(portal => <PortalCard key={portal.id} portal={portal} />)}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <Globe style={{ margin: '0 auto', width: '48px', height: '48px', color: 'var(--text-disabled)', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Nenhum portal encontrado</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {searchTerm ? 'Nenhum portal corresponde à sua busca.' : 'Você ainda não possui portais criados.'}
          </p>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            <Plus style={{ width: '18px', height: '18px', marginRight: '8px' }} />Criar Novo Portal
          </Button>
        </div>
      )
      }

      {/* Create Modal */}
      {
        showCreateModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', backdropFilter: 'blur(8px)' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-floating)', maxWidth: '512px', width: '100%', maxHeight: '90vh', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

              {/* Modal Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', borderBottom: '1px solid var(--border-subtle)', position: 'sticky', top: 0, backgroundColor: 'var(--bg-surface)', zIndex: 10 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Criar Novo Portal</h2>
                <button
                  onClick={() => { setShowCreateModal(false); reset(); setImagePreview(null); }}
                  style={{ padding: '8px', backgroundColor: 'transparent', borderRadius: '8px', cursor: 'pointer', transition: 'background-color 0.2s', border: 'none', color: 'var(--text-secondary)' }}
                  disabled={isSubmitting}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-canvas)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <X style={{ width: '20px', height: '20px' }} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit(onSubmit)} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Name Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome *</label>
                  <input
                    {...register('name')}
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: `1px solid ${errors.name ? 'var(--status-error)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                    }}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p style={{ color: 'var(--status-error)', fontSize: '12px', marginTop: '4px' }}>{errors.name.message}</p>}
                </div>

                {/* Description Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descrição</label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-canvas)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                    }}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Image Upload Field */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Imagem</label>
                  {imagePreview ? (
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '192px', objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }} />
                      <button
                        type="button"
                        onClick={() => { setImagePreview(null); setValue('image_url', ''); }}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          padding: '8px',
                          backgroundColor: 'var(--status-error)',
                          color: 'white',
                          borderRadius: '9999px',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                        disabled={isSubmitting}
                      >
                        <X style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="upload"
                        accept="image/*"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                        style={{ display: 'none' }}
                        disabled={uploadingImage || isSubmitting}
                      />
                      <label
                        htmlFor="upload"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '192px',
                          border: '2px dashed var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          cursor: uploadingImage || isSubmitting ? 'not-allowed' : 'pointer',
                          backgroundColor: 'var(--bg-canvas)',
                          transition: 'background-color 0.2s',
                          opacity: uploadingImage || isSubmitting ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (!uploadingImage && !isSubmitting) {
                            e.currentTarget.style.backgroundColor = 'var(--primary-subtle)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--bg-canvas)';
                        }}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 style={{ width: '48px', height: '48px', color: 'var(--primary-main)', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Enviando...</p>
                          </>
                        ) : (
                          <>
                            <Cloud style={{ width: '48px', height: '48px', color: 'var(--text-disabled)', marginBottom: '12px', transition: 'color 0.2s' }} />
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '600' }}>Clique para fazer upload</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>PNG, JPG até 5MB</p>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', marginTop: '16px' }}>
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
                    {isSubmitting ? <><Loader2 style={{ width: '16px', height: '16px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />Criando...</> : <><Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />Criar</>}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )
      }
    </div >
  );
}
