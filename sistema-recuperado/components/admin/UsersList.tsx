'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserData, PaginatedUsersResponse } from '@/app/(admin)/users/actions';
import { Trash2, Search, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmationModal } from '@/components/admin/DeleteConfirmationModal';

interface UsersListProps {
    initialData?: PaginatedUsersResponse;
}

export default function UsersList({ initialData }: UsersListProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<PaginatedUsersResponse | undefined>(initialData);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== (searchParams.get('q') || '')) {
                fetchUsers(1, searchTerm);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    async function fetchUsers(page: number, search: string) {
        setLoading(true);
        try {
            const { getPaginatedUsers } = await import('@/app/(admin)/users/actions');
            const res = await getPaginatedUsers(page, 20, search);

            if (res.error) {
                toast.error(res.error);
            } else if (res.data) {
                setData(res.data);
                // Update URL without refresh
                const url = new URL(window.location.href);
                url.searchParams.set('page', page.toString());
                if (search) url.searchParams.set('q', search);
                else url.searchParams.delete('q');
                window.history.pushState({}, '', url);
            }
        } catch (error) {
            toast.error('Erro ao buscar usuários');
        } finally {
            setLoading(false);
        }
    }

    // Handle click on trash icon
    const handleDeleteClick = (user: UserData) => {
        setUserToDelete(user);
        setDeleteModalOpen(true);
    };

    // Actual delete logic passed to modal
    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        try {
            const { deleteUser } = await import('@/app/(admin)/users/actions');
            const res = await deleteUser(userToDelete.id);

            if (res.error) {
                toast.error(res.error);
                throw new Error(res.error); // Stop modal spinner
            } else {
                toast.success('Usuário excluído com sucesso');
                await fetchUsers(data?.page || 1, searchTerm);
                router.refresh();
            }
        } catch (error) {
            throw error;
        }
    };

    const users = data?.users || [];
    const currentPage = data?.page || 1;
    const totalPages = data?.totalPages || 1;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <h2 className="text-xl font-semibold">Lista de Usuários ({data?.total || 0})</h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4 min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                    </div>
                ) : users.length > 0 ? (
                    users.map((user) => (
                        <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                        {user.user_metadata?.name || 'Sem nome'}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.user_metadata?.role === 'admin'
                                        ? 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        }`}>
                                        {user.user_metadata?.role === 'admin' ? 'Admin' : 'Franqueado'}
                                    </span>

                                    <Link
                                        href={`/users/${user.id}/manage`}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Gerenciar
                                    </Link>

                                    <button
                                        onClick={() => handleDeleteClick(user)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                                        title="Excluir Usuário"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nenhum usuário encontrado</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => fetchUsers(currentPage - 1, searchTerm)}
                        disabled={currentPage <= 1 || loading}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-medium">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => fetchUsers(currentPage + 1, searchTerm)}
                        disabled={currentPage >= totalPages || loading}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Delete Modal */}
            <DeleteConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                type="user"
                itemTitle={userToDelete?.user_metadata?.name || userToDelete?.email || 'Usuário'}
            />
        </div>
    );
}
