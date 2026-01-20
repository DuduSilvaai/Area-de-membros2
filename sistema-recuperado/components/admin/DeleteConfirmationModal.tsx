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
    type: 'portal' | 'module' | 'lesson' | 'user';
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
                    <div className="space-y-3 mt-4">
                        <p className="text-zinc-600 dark:text-zinc-400">Você tem certeza absoluta?</p>
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl space-y-1">
                            <p className="font-semibold text-red-700 dark:text-red-400">
                                Atenção: Ação Irreversível
                            </p>
                            <p className="text-red-600/90 dark:text-red-400/90 text-sm">
                                Você perderá TODOS os serviços, módulos, aulas e alunos vinculados a este portal <span className="font-bold">"{itemTitle}"</span>.
                            </p>
                        </div>
                        <p className="text-zinc-500 text-sm">Esta ação não pode ser desfeita e todos os dados serão perdidos permanentemente.</p>
                    </div>
                );
            case 'module':
                return (
                    <div className="space-y-3 mt-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl">
                            <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
                                Excluir Módulo
                            </p>
                            <p className="text-amber-600/90 dark:text-amber-400/90 text-sm">
                                Você excluirá este módulo <span className="font-bold">"{itemTitle}"</span> e TODAS as suas sub-aulas e materiais.
                            </p>
                        </div>
                    </div>
                );
            case 'lesson':
                return (
                    <div className="space-y-3 mt-4">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            A aula <span className="font-medium text-zinc-900 dark:text-zinc-200">"{itemTitle}"</span> e todos os seus arquivos serão removidos permanentemente do sistema.
                        </p>
                    </div>
                );
            case 'user':
                return (
                    <div className="space-y-3 mt-4">
                        <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl space-y-1">
                            <p className="font-semibold text-red-700 dark:text-red-400">
                                Atenção: Ação Permanente
                            </p>
                            <p className="text-red-600/90 dark:text-red-400/90 text-sm">
                                O usuário <span className="font-bold">"{itemTitle}"</span> será removido do sistema, incluindo todo seu histórico, matrículas e comentários.
                            </p>
                        </div>
                    </div>
                );
            default:
                return <p className="mt-4 text-zinc-600 dark:text-zinc-400">Tem certeza que deseja excluir este item?</p>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] gap-0 p-0 overflow-hidden border-0 rounded-[24px] shadow-2xl bg-white dark:bg-[#1A1A1E]">
                <div className="p-6 pb-0">
                    <DialogHeader className="gap-2">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-1 text-left">
                                <DialogTitle className="text-xl font-semibold text-zinc-900 dark:text-white">
                                    Excluir {type === 'portal' ? 'Portal' : type === 'module' ? 'Módulo' : type === 'user' ? 'Usuário' : 'Aula'}
                                </DialogTitle>
                                <DialogDescription className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Esta é uma ação destrutiva.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Content Body */}
                    <div className="pl-[64px]">
                        {getContextualMessage()}
                    </div>

                    {/* Inputs (Portal Lock) */}
                    {isPortal && (
                        <div className="pl-[64px] mt-6">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                                Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar:
                            </label>
                            <Input
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="EXCLUIR"
                                className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 focus:ring-red-500/20 focus:border-red-500 h-11"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-zinc-50/50 dark:bg-white/5 mt-8 flex flex-row justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isLoading}
                        className="h-11 px-6 rounded-xl hover:bg-zinc-200/50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isPortal ? isConfirmDisabled || isLoading : isLoading}
                        className="h-11 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
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
            </DialogContent>
        </Dialog>
    );
}
