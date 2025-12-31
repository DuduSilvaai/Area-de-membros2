'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Image as ImageIcon, Calendar } from 'lucide-react';
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
}

export function ModuleModal({ isOpen, onClose, onSave, initialData, isLoading = false }: ModuleModalProps) {
    const [formData, setFormData] = useState<ModuleData>({
        title: '',
        description: '',
        release_settings: 'immediate',
    });

    useEffect(() => {
        if (isOpen) {
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
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden gap-0">
                <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-semibold text-white">
                            {initialData ? 'Editar Módulo' : 'Novo Módulo'}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 text-sm mt-1.5">
                            Organize suas aulas agrupando-as neste módulo.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="title" className="text-sm font-medium text-zinc-300">
                                Título do Módulo
                            </label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Introdução ao Curso"
                                className="bg-zinc-900/50 border-zinc-800 focus:border-pink-500/50 focus:ring-pink-500/20 text-zinc-100 placeholder:text-zinc-600 h-10"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-medium text-zinc-300">
                                Descrição (Opcional)
                            </label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Uma breve descrição sobre o conteúdo deste módulo..."
                                className="bg-zinc-900/50 border-zinc-800 focus:border-pink-500/50 focus:ring-pink-500/20 text-zinc-100 placeholder:text-zinc-600 min-h-[80px] resize-none"
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
            </DialogContent>
        </Dialog>
    );
}
