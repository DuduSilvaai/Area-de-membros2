'use client';

import { useState } from 'react';
import { createUser } from '@/app/(admin)/users/actions';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function CreateUserForm() {
    const [isCreating, setIsCreating] = useState(false);
    const [role, setRole] = useState('member');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsCreating(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        try {
            const result = await createUser({
                name,
                email,
                password,
                role
            });

            if (result.error) {
                toast.error(`Erro: ${result.error}`);
            } else {
                toast.success(`${role === 'admin' ? 'Administrador' : 'Franqueado'} criado com sucesso!`);
                // Reset form
                (e.target as HTMLFormElement).reset();
                setRole('member');
                // Optional: show generated password if returned
                if (result.data?.generatedPassword) {
                    alert(`Senha gerada: ${result.data.generatedPassword}`);
                }
            }
        } catch (error) {
            toast.error('Erro inesperado ao criar usuário');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cadastrar Novo Franqueado</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome Completo
                    </label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Ex: João Silva"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                    </label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="joao@exemplo.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Senha Inicial
                    </label>
                    <input
                        name="password"
                        type="text"
                        required
                        minLength={6}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="Mínimo 6 caracteres"
                    />
                    <p className="text-xs text-gray-500 mt-1">Você deve enviar esta senha para o usuário.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tipo de Acesso
                    </label>
                    <select
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                        <option value="member">Franqueado (Padrão)</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg hover:bg-pink-700 transition-colors font-medium flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isCreating ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                        </>
                    ) : (
                        role === 'admin' ? 'Criar Administrador' : 'Criar Franqueado'
                    )}
                </button>
            </form>
        </div>
    );
}
