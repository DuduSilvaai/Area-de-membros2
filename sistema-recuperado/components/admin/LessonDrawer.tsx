'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, Video, Link, FileText, Settings, Upload, CheckCircle, Trash2, Plus, File as FileIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

// Mock content type for now
interface Content {
    id: string;
    title: string;
    video_url?: string | null;
    description?: string | null;
    is_preview?: boolean;
    is_published?: boolean;
    duration?: number;
    module_id: string;
    content_type?: 'video' | 'text' | 'external_video';
    config?: any;
    attachments?: any[];
}

interface LessonDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: Content | null;
    onSave: (lessonId: string, updates: Partial<Content>) => Promise<void>;
}

type TabType = 'content' | 'materials' | 'settings';

export function LessonDrawer({ isOpen, onClose, lesson, onSave }: LessonDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('content');
    const [formData, setFormData] = useState<Partial<Content>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Video Upload
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Materials State
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isAddingMaterial, setIsAddingMaterial] = useState(false);
    const [newMaterial, setNewMaterial] = useState({ type: 'link', title: '', url: '' });
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

    useEffect(() => {
        if (lesson) {
            setFormData({
                ...lesson
            });
            // Priority: config.attachments > attachments column > empty
            const storedAttachments = lesson.config?.attachments || lesson.attachments || [];
            console.log('Loading attachments:', storedAttachments);
            setAttachments(storedAttachments);
        } else {
            // New lesson defaults
            setFormData({
                is_published: true,
                is_preview: false,
                content_type: 'video'
            });
            setAttachments([]);
        }
    }, [lesson, isOpen]);

    // Debugging
    useEffect(() => {
        if (isOpen) console.log('Drawer Open. Lesson:', lesson);
    }, [isOpen]);


    const handleSave = async () => {
        if (!formData.title) {
            toast.error('O título da aula é obrigatório');
            return;
        }

        setIsSaving(true);
        console.log('Saving...', formData);

        try {
            // Prepare payload for Supabase
            // Mapping fields to DB schema
            const dbPayload: any = {
                title: formData.title,
                module_id: formData.module_id || lesson?.module_id,

                video_url: formData.video_url,

                // Map logical fields to physical columns
                duration_seconds: formData.duration,
                content_type: formData.content_type || 'video',
                is_active: formData.is_published !== false,

                // Store extra fields AND attachments in config JSONB
                // This ensures persistence works even if 'attachments' column doesn't exist yet
                config: {
                    description: formData.description,
                    is_preview: formData.is_preview,
                    attachments: attachments, // Saved here for robustness
                    ...(formData.config || {})
                },

                // attachments: attachments, // REMOVED: causing "column does not exist" error
                updated_at: new Date().toISOString(),
            };

            // Only add ID if it exists and isn't 'new' or temp
            if (lesson?.id && lesson.id !== 'new') {
                dbPayload.id = lesson.id;
            }

            console.log('Payload being sent:', dbPayload);

            // Perform UPSERT directly to ensure persistence
            const { data, error } = await supabase
                .from('contents')
                .upsert(dbPayload)
                .select()
                .single();

            if (error) {
                console.error('Supabase Upsert Error Detailed:', JSON.stringify(error, null, 2));
                throw error;
            }

            console.log('Saved successfully:', data);

            // Notify parent to refresh
            await onSave(data.id, data as any);

            toast.success('Aula salva com sucesso');
            onClose();
        } catch (error: any) {
            console.error('Save error detailed:', error);
            // Fallback error handling
            const msg = error.message || error.details || error.hint || 'Erro desconhecido';
            toast.error(`Erro ao salvar: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const triggerFileUpload = () => {
        console.log('Triggering file upload click');
        fileInputRef.current?.click();
    };

    const handleVideoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('File selected:', file.name);
        setIsUploading(true);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `lesson-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `videos/${fileName}`;

            console.log('Uploading to:', filePath);

            const { error: uploadError } = await supabase.storage
                .from('course-content')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('course-content')
                .getPublicUrl(filePath);

            console.log('Upload success. URL:', publicUrl);
            setFormData(prev => ({
                ...prev,
                video_url: publicUrl,
                content_type: 'video'
            }));
            toast.success('Upload de vídeo concluído!');

        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error(`Erro no upload: ${error.message}`);
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData(prev => ({
            ...prev,
            video_url: url,
            content_type: 'external_video' // Assume external if manually typed
        }));
    };

    // Materials handler
    const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingMaterial(true);
        try {
            const fileName = `material-${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage
                .from('course-content')
                .upload(`materials/${fileName}`, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('course-content')
                .getPublicUrl(`materials/${fileName}`);

            setNewMaterial(prev => ({ ...prev, url: publicUrl, title: prev.title || file.name }));
            toast.success('Material enviado!');
        } catch (error: any) {
            toast.error('Erro no upload do material');
        } finally {
            setIsUploadingMaterial(false);
        }
    };

    const confirmAddMaterial = () => {
        if (!newMaterial.title || !newMaterial.url) {
            toast.error('Preencha título e Link/Arquivo');
            return;
        }
        setAttachments([...attachments, { ...newMaterial }]);
        setNewMaterial({ type: 'link', title: '', url: '' });
        setIsAddingMaterial(false);
    };

    const removeAttachment = (index: number) => {
        const newAtts = [...attachments];
        newAtts.splice(index, 1);
        setAttachments(newAtts);
    };

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setActiveTab('content');
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 w-full lg:w-1/2 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3 flex-1 mr-4">
                                <div className="flex-1 mr-4">
                                    <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Título da Aula <span className="text-red-500">*</span></label>
                                    <Input
                                        value={formData.title || ''}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="bg-zinc-900 border-zinc-700 text-lg font-bold text-white placeholder:text-zinc-600 w-full shadow-sm focus:ring-2 focus:ring-pink-500/20"
                                        placeholder="Ex: Introdução ao React"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="text-zinc-400 hover:text-white hover:bg-zinc-900"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="bg-pink-600 hover:bg-pink-700 text-white min-w-[100px]"
                                >
                                    {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save className="w-4 h-4 mr-2" />}
                                    Salvar
                                </Button>
                            </div>
                        </div>

                        {/* Tabs Navigation */}
                        <div className="border-b border-zinc-800 px-6">
                            <div className="flex gap-6">
                                <TabButton
                                    active={activeTab === 'content'}
                                    onClick={() => { console.log('Tab: Content'); setActiveTab('content'); }}
                                    icon={<Video className="w-4 h-4" />}
                                    label="Conteúdo"
                                />
                                <TabButton
                                    active={activeTab === 'materials'}
                                    onClick={() => { console.log('Tab: Materials'); setActiveTab('materials'); }}
                                    icon={<Link className="w-4 h-4" />}
                                    label="Materiais"
                                />
                                <TabButton
                                    active={activeTab === 'settings'}
                                    onClick={() => { console.log('Tab: Settings'); setActiveTab('settings'); }}
                                    icon={<Settings className="w-4 h-4" />}
                                    label="Configurações"
                                />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === 'content' && (
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Vídeo da Aula</h3>

                                        {/* Hidden Input */}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="video/mp4,video/quicktime,video/webm"
                                            onChange={handleVideoFileChange}
                                        />

                                        <div
                                            className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[200px] border-dashed group hover:border-zinc-700 transition-colors cursor-pointer"
                                            onClick={(e) => {
                                                // Only trigger if clicking container, not children buttons
                                                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.upload-trigger')) {
                                                    triggerFileUpload();
                                                }
                                            }}
                                        >
                                            {isUploading ? (
                                                <div className="text-center">
                                                    <div className="animate-spin text-pink-500 mb-2">⏳</div>
                                                    <p className="text-zinc-400">Fazendo upload...</p>
                                                </div>
                                            ) : formData.video_url ? (
                                                <div className="w-full space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                                                    <div className="aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 relative group/video">
                                                        {formData.content_type === 'external_video' || formData.video_url.includes('youtube') || formData.video_url.includes('vimeo') ? (
                                                            <iframe
                                                                src={formData.video_url.replace('watch?v=', 'embed/')}
                                                                className="w-full h-full"
                                                                frameBorder="0"
                                                                allowFullScreen
                                                            />
                                                        ) : (
                                                            <video
                                                                src={formData.video_url}
                                                                controls
                                                                className="w-full h-full object-contain bg-black"
                                                            />
                                                        )}

                                                        <div className="absolute top-2 right-2 bg-black/80 text-xs px-2 py-1 rounded text-white overflow-hidden max-w-[200px] truncate">
                                                            {formData.video_url}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 border border-red-500/20"
                                                        onClick={() => setFormData({ ...formData, video_url: null })}
                                                    >
                                                        Remover Vídeo
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="text-center space-y-4 upload-trigger">
                                                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto group-hover:bg-zinc-800 transition-colors pointer-events-none">
                                                        <Upload className="w-8 h-8 text-zinc-500 group-hover:text-zinc-400" />
                                                    </div>
                                                    <div className="pointer-events-none">
                                                        <p className="text-zinc-200 font-medium">Arraste seu arquivo de vídeo aqui</p>
                                                        <p className="text-zinc-500 text-sm mt-1">MP4, MOV (Máx 500MB)</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 pointer-events-none">
                                                        <div className="h-[1px] bg-zinc-800 flex-1"></div>
                                                        <span className="text-xs text-zinc-600 font-medium uppercase">OU</span>
                                                        <div className="h-[1px] bg-zinc-800 flex-1"></div>
                                                    </div>
                                                    <Input
                                                        placeholder="Cole uma URL do YouTube/Vimeo..."
                                                        className="bg-zinc-950 border-zinc-800 text-sm"
                                                        value={formData.video_url || ''}
                                                        onClick={(e) => e.stopPropagation()} // Prevent triggering upload
                                                        onChange={handleVideoUrlChange}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Descrição</h3>
                                        <Textarea
                                            value={formData.description || ''}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Detalhes sobre esta aula..."
                                            className="min-h-[150px] bg-zinc-900/30 border-zinc-800 focus:border-pink-500/50 resize-none font-light"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'materials' && (
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    {/* Add Material Form */}
                                    {isAddingMaterial ? (
                                        <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium text-zinc-200">Novo Material</h4>
                                                <Button variant="ghost" size="sm" onClick={() => setIsAddingMaterial(false)}><X className="w-4 h-4" /></Button>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant={newMaterial.type === 'link' ? 'default' : 'outline'}
                                                        className={newMaterial.type === 'link' ? 'bg-pink-600 hover:bg-pink-700' : 'border-zinc-700 text-zinc-400'}
                                                        onClick={() => setNewMaterial({ ...newMaterial, type: 'link' })}
                                                    >
                                                        <Link className="w-4 h-4 mr-2" /> Link Externo
                                                    </Button>
                                                    <Button
                                                        variant={newMaterial.type === 'file' ? 'default' : 'outline'}
                                                        className={newMaterial.type === 'file' ? 'bg-pink-600 hover:bg-pink-700' : 'border-zinc-700 text-zinc-400'}
                                                        onClick={() => setNewMaterial({ ...newMaterial, type: 'file' })}
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" /> Arquivo
                                                    </Button>
                                                </div>

                                                <Input
                                                    placeholder="Nome do Material (ex: Slide da Aula)"
                                                    value={newMaterial.title}
                                                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                                    className="bg-zinc-950 border-zinc-700"
                                                />

                                                {newMaterial.type === 'link' ? (
                                                    <Input
                                                        placeholder="URL (https://...)"
                                                        value={newMaterial.url}
                                                        onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                                                        className="bg-zinc-950 border-zinc-700"
                                                    />
                                                ) : (
                                                    <div className="border border-dashed border-zinc-700 rounded-lg p-4 text-center hover:bg-zinc-800/50 transition-colors">
                                                        {newMaterial.url ? (
                                                            <div className="flex items-center justify-center gap-2 text-green-500">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span className="text-sm">Arquivo carregado</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <label className="cursor-pointer">
                                                                    <span className="text-pink-500 text-sm font-medium hover:underline">Clique para selecionar</span>
                                                                    <input type="file" className="hidden" onChange={handleMaterialUpload} />
                                                                </label>
                                                                {isUploadingMaterial && <span className="text-zinc-500 text-sm ml-2">Enviando...</span>}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                <Button className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200" onClick={confirmAddMaterial} disabled={isUploadingMaterial}>
                                                    Adicionar a Lista
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                                            <div>
                                                <h3 className="font-medium text-zinc-200">Arquivos e Links</h3>
                                                <p className="text-sm text-zinc-500">Adicione PDFs, Docs ou Links úteis</p>
                                            </div>
                                            <Button onClick={() => setIsAddingMaterial(true)} variant="outline" className="border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                                                <Plus className="w-4 h-4 mr-2" /> Adicionar
                                            </Button>
                                        </div>
                                    )}

                                    {/* List */}
                                    <div className="space-y-2">
                                        {attachments.map((att, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-zinc-700 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-800 rounded-md text-zinc-400">
                                                        {att.type === 'file' ? <FileIcon className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-zinc-200 font-medium">{att.title}</p>
                                                        <a href={att.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:text-pink-500 flex items-center gap-1">
                                                            Acessar Material <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeAttachment(idx)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {!isAddingMaterial && attachments.length === 0 && (
                                            <div className="text-center py-8 text-zinc-600">
                                                <p className="text-sm">Nenhum material adicionado ainda.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="space-y-6 max-w-2xl mx-auto">
                                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-zinc-200 font-medium">Prévia Gratuita</h4>
                                                <p className="text-zinc-500 text-sm">Permitir que não-alunos assistam a esta aula</p>
                                            </div>
                                            <div className="flex items-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={formData.is_preview || false}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, is_preview: e.target.checked });
                                                        }}
                                                    />
                                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                                </label>
                                            </div>
                                        </div>

                                        <div className="p-4 flex items-center justify-between">
                                            <div>
                                                <h4 className="text-zinc-200 font-medium">Publicado</h4>
                                                <p className="text-zinc-500 text-sm">Aula visível para os alunos</p>
                                            </div>
                                            <div className="flex items-center">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={formData.is_published !== false}
                                                        onChange={(e) => {
                                                            setFormData({ ...formData, is_published: e.target.checked });
                                                        }}
                                                    />
                                                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        <label className="text-sm font-medium text-zinc-300">Duração (segundos)</label>
                                        <Input
                                            type="number"
                                            value={formData.duration || 0}
                                            onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            className="bg-zinc-900/50 border-zinc-800"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`
                h-12 border-b-2 flex items-center gap-2 px-1 transition-all text-sm font-medium
                ${active
                    ? 'border-pink-500 text-pink-500'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}
