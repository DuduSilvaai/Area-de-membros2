'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, Calendar, Lock } from 'lucide-react';
import { AccessManager } from '@/components/admin/AccessManager';
import { toast } from 'sonner';

// Mock types for now, will replace with shared types
interface ModuleData {
    id?: string;
    title: string;
    description?: string;
    cover_image_url?: string;
    release_settings?: 'immediate' | 'scheduled';
    scheduled_date?: string;
}

interface ModuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ModuleData) => Promise<void>;
    initialData?: ModuleData | null;
    isLoading?: boolean;
    portalId: string;
}

export function ModuleModal({ isOpen, onClose, onSave, initialData, isLoading = false, portalId }: ModuleModalProps) {
    const [activeTab, setActiveTab] = useState<'details' | 'access'>('details');
    const [formData, setFormData] = useState<ModuleData>({
        title: '',
        description: '',
        release_settings: 'immediate',
    });

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details'); // Reset tab on open
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({
                    title: '',
                    description: '',
                    release_settings: 'immediate'
                });
            }
        }
    }, [isOpen, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('O título é obrigatório');
            return;
        }
        await onSave(formData);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-0 overflow-hidden gap-0">
                <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-zinc-900 dark:text-white">
                            {initialData ? 'Editar Módulo' : 'Novo Módulo'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-sm mt-1.5">
                            Organize suas aulas agrupando-as neste módulo.
                        </DialogDescription>
                    </DialogHeader>
                </div>


                {/* Tabs (Only if editing) */}
                {initialData && (
                    <div className="px-6 border-b border-zinc-200 dark:border-zinc-800 flex gap-6">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-[#FF2D78] text-[#FF2D78]' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Detalhes
                        </button>
                        <button
                            onClick={() => setActiveTab('access')}
                            className={`py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'access' ? 'border-[#FF2D78] text-[#FF2D78]' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                                }`}
                        >
                            Permissões de Acesso
                        </button>
                    </div>
                )}

                {activeTab === 'details' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Título do Módulo
                                </label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ex: Introdução ao Curso"
                                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:border-[#FF2D78]/50 focus:ring-[#FF2D78]/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 h-10"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Descrição (Opcional)
                                </label>
                                <Textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Uma breve descrição sobre o conteúdo deste módulo..."
                                    className="bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus:border-[#FF2D78]/50 focus:ring-[#FF2D78]/20 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 min-h-[80px] resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="bg-transparent border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 hover:border-zinc-700"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-pink-600 hover:bg-pink-700 text-white border-0 shadow-lg shadow-pink-600/20"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    initialData ? 'Salvar Alterações' : 'Criar Módulo'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="p-6 h-[400px]">
                        {initialData?.id ? (
                            <AccessManager
                                context="module"
                                portalId="bd886290-0937-4d08-8449-31846b412975" // FIXME: We need to pass portalId prop to ModuleModal
                                resourceId={initialData.id}
                            />
                        ) : (
                            <div className="text-center text-zinc-500">Salve o módulo antes de gerenciar acessos.</div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
