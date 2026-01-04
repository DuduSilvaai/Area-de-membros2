'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    type: 'portal' | 'module' | 'lesson';
    itemTitle: string;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, type, itemTitle }: DeleteConfirmationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const isPortal = type === 'portal';
    const requiredText = isPortal ? 'EXCLUIR' : '';
    const isConfirmDisabled = isPortal && confirmText !== requiredText;

    const handleConfirm = async () => {
        if (isPortal && confirmText !== requiredText) return;

        try {
            setIsLoading(true);
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Ocorreu um erro ao excluir o item.');
        } finally {
            setIsLoading(false);
            setConfirmText('');
        }
    };

    const getContextualMessage = () => {
        switch (type) {
            case 'portal':
                return (
                    <div className="space-y-2">
                        <p>Você tem certeza absoluta?</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                            Você perderá TODOS os Módulos, Aulas e Alunos vinculados a este portal "{itemTitle}".
                        </p>
                        <p>Esta ação não pode ser desfeita.</p>
                    </div>
                );
            case 'module':
                return (
                    <div className="space-y-2">
                        <p>Atenção!</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                            Você excluirá este módulo "{itemTitle}" e TODAS as suas sub-aulas e materiais.
                        </p>
                    </div>
                );
            case 'lesson':
                return (
                    <div className="space-y-2">
                        <p>Esta aula "{itemTitle}" e todos os seus arquivos serão removidos permanentemente.</p>
                    </div>
                );
            default:
                return <p>Tem certeza que deseja excluir este item?</p>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-full max-w-lg bg-white dark:bg-[#1A1A1E] rounded-[28px] shadow-2xl dark:border dark:border-white/10 p-8 border-0">
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 text-red-600 dark:text-red-500">
                            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-white">
                                Excluir {type === 'portal' ? 'Portal' : type === 'module' ? 'Módulo' : 'Aula'}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed pl-[52px]">
                            {getContextualMessage()}
                        </DialogDescription>
                    </div>

                    {/* Inputs (Portal Lock) */}
                    {isPortal && (
                        <div className="pl-[52px]">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                                Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar:
                            </label>
                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="EXCLUIR"
                                className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 focus:ring-red-500/20 focus:border-red-500 h-11"
                            />
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-row justify-end gap-3 mt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            className="h-11 px-6 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirm}
                            disabled={isPortal ? isConfirmDisabled || isLoading : isLoading}
                            className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 font-semibold"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                'Excluir Permanentemente'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
