'use client';

import { useState } from 'react';
import { Pencil, Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserName } from '@/app/(admin)/users/actions';

interface EditUserProfileProps {
    userId: string;
    initialName: string;
}

export function EditUserProfile({ userId, initialName }: EditUserProfileProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return toast.error('O nome não pode ser vazio');
        if (name === initialName) return setIsEditing(false);

        setIsLoading(true);
        try {
            const res = await updateUserName(userId, name);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success('Nome atualizado com sucesso!');
                setIsEditing(false);
                // Note: Server action revalidates path, so UI should update automatically 
                // but local state holds the new name anyway
            }
        } catch (error) {
            toast.error('Erro ao salvar alterações');
        } finally {
            setIsLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg font-bold focus:ring-2 focus:ring-pink-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                        if (e.key === 'Escape') {
                            setIsEditing(false);
                            setName(initialName);
                        }
                    }}
                    placeholder="Nome do usuário"
                />
                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="p-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setName(initialName);
                    }}
                    disabled={isLoading}
                    className="p-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {name || 'Sem nome'}
            </h1>
            <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-400 hover:text-pink-500 transition-colors rounded-full hover:bg-pink-50 dark:hover:bg-pink-900/20"
                title="Editar nome"
            >
                <Pencil className="w-4 h-4" />
            </button>
        </div>
    );
}
