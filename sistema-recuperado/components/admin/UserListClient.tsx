// components/admin/UserListClient.tsx
'use client';

import { useState, useMemo } from 'react';
import {
    Search,
    Filter,
    UserPlus,
    Settings,
    ChevronRight,
    GraduationCap,
    Mail,
    Calendar,
    Shield,
    X,
    Loader2,
    MoreVertical,
    Key,
    UserX,
    UserCheck,
    Users,
    Download,
    Upload
} from 'lucide-react';
import Link from 'next/link';
import { Input, Button } from '@/components/UIComponents';
import { UserWithEnrollments, EnrollmentPermissions } from '@/types/enrollment';
import { createUser, resetUserPassword, toggleUserStatus, bulkEnrollUsers } from '@/app/(admin)/users/actions';
import { toast } from 'sonner';
import { QuickDebugPanel } from './QuickDebugPanel';

interface FilterState {
    searchTerm: string;
    portalFilter: string;
    statusFilter: 'all' | 'enrolled' | 'no-enrollment' | 'active' | 'inactive';
}

interface Props {
    users: any[];
    enrollments: any[];
    portals: { id: string; name: string }[];
}

export function UserListClient({ users: authUsers, enrollments, portals }: Props) {
    const [filters, setFilters] = useState<FilterState>({
        searchTerm: '',
        portalFilter: 'all',
        statusFilter: 'all'
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkEnrollModalOpen, setIsBulkEnrollModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'member' });
    const [bulkEnrollData, setBulkEnrollData] = useState({
        portalId: '',
        accessAll: true,
        selectedModules: [] as string[]
    });

    const users: UserWithEnrollments[] = useMemo(() => {
        return (authUsers || []).map(user => ({
            id: user.id,
            email: user.email || '',
            created_at: user.created_at,
            raw_user_meta_data: user.user_metadata || {},
            enrollments: (enrollments || []).filter(e => e.user_id === user.id).map(e => ({
                ...e,
                permissions: e.permissions as unknown as EnrollmentPermissions
            })),
            is_disabled: user.banned_until && new Date(user.banned_until) > new Date()
        }));
    }, [authUsers, enrollments]);

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            (user.raw_user_meta_data?.name || '').toLowerCase().includes(filters.searchTerm.toLowerCase());

        const matchesPortal =
            filters.portalFilter === 'all' ||
            user.enrollments.some(e => e.portal_id === filters.portalFilter);

        const matchesStatus =
            filters.statusFilter === 'all' ||
            (filters.statusFilter === 'enrolled' && user.enrollments.length > 0) ||
            (filters.statusFilter === 'no-enrollment' && user.enrollments.length === 0) ||
            (filters.statusFilter === 'active' && !user.is_disabled) ||
            (filters.statusFilter === 'inactive' && user.is_disabled);

        return matchesSearch && matchesPortal && matchesStatus;
    });

    const stats = {
        total: users.length,
        enrolled: users.filter(u => u.enrollments.length > 0).length,
        noEnrollment: users.filter(u => u.enrollments.length === 0).length,
        active: users.filter(u => !u.is_disabled).length,
        inactive: users.filter(u => u.is_disabled).length
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const result = await createUser(newUser);
            if (result.error) {
                toast.error(`Erro: ${result.error}`);
            } else {
                toast.success('Usuário criado com sucesso!');
                setIsCreateModalOpen(false);
                setNewUser({ name: '', email: '', password: '', role: 'member' });
            }
        } catch (error) {
            toast.error('Erro inesperado ao criar usuário');
        } finally {
            setIsCreating(false);
        }
    };

    const handleResetPassword = async (userId: string, userEmail: string) => {
        const newPassword = prompt(`Digite a nova senha para ${userEmail}:`);
        if (!newPassword) return;

        try {
            const result = await resetUserPassword(userId, newPassword);
            if (result.error) {
                toast.error(`Erro: ${result.error}`);
            } else {
                toast.success('Senha redefinida com sucesso!');
            }
        } catch (error) {
            toast.error('Erro inesperado ao redefinir senha');
        }
    };

    const handleToggleUserStatus = async (userId: string, userEmail: string, currentlyDisabled: boolean) => {
        const action = currentlyDisabled ? 'ativar' : 'desativar';
        if (!confirm(`Tem certeza que deseja ${action} o usuário ${userEmail}?`)) return;

        try {
            const result = await toggleUserStatus(userId, !currentlyDisabled);
            if (result.error) {
                toast.error(`Erro: ${result.error}`);
            } else {
                toast.success(`Usuário ${action === 'ativar' ? 'ativado' : 'desativado'} com sucesso!`);
            }
        } catch (error) {
            toast.error(`Erro inesperado ao ${action} usuário`);
        }
    };

    const handleBulkEnroll = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedUsers.size === 0 || !bulkEnrollData.portalId) {
            toast.error('Selecione usuários e um portal');
            return;
        }

        try {
            const permissions: EnrollmentPermissions = {
                access_all: bulkEnrollData.accessAll,
                allowed_modules: bulkEnrollData.accessAll ? [] : bulkEnrollData.selectedModules,
                access_granted_at: new Date().toISOString()
            };

            const result = await bulkEnrollUsers(Array.from(selectedUsers), bulkEnrollData.portalId, permissions);
            if (result.error) {
                toast.error(`Erro: ${result.error}`);
            } else {
                toast.success(`${selectedUsers.size} usuários matriculados com sucesso!`);
                setIsBulkEnrollModalOpen(false);
                setSelectedUsers(new Set());
                setBulkEnrollData({ portalId: '', accessAll: true, selectedModules: [] });
            }
        } catch (error) {
            toast.error('Erro inesperado na matrícula em lote');
        }
    };

    const toggleUserSelection = (userId: string) => {
        const newSelection = new Set(selectedUsers);
        if (newSelection.has(userId)) {
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        setSelectedUsers(newSelection);
    };

    const selectAllUsers = () => {
        if (selectedUsers.size === filteredUsers.length) {
            setSelectedUsers(new Set());
        } else {
            setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-row items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gerenciar Franqueados</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {stats.total} franqueados • {stats.enrolled} matriculados • {stats.noEnrollment} sem acesso • {stats.active} ativos • {stats.inactive} inativos
                    </p>
                </div>
                <div className="flex gap-3">
                    {selectedUsers.size > 0 && (
                        <button
                            onClick={() => setIsBulkEnrollModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full font-medium text-sm hover:bg-blue-700 transition-colors"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Matricular {selectedUsers.size} selecionados
                        </button>
                    )}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-full font-semibold text-sm hover:bg-pink-700 transition-colors shadow-lg"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Cadastrar Franqueado
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600">{stats.enrolled}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Matriculados</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-orange-600">{stats.noEnrollment}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Sem Acesso</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Ativos</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Inativos</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        />
                    </div>

                    {/* Portal Filter */}
                    <select
                        value={filters.portalFilter}
                        onChange={(e) => setFilters(prev => ({ ...prev, portalFilter: e.target.value }))}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                        <option value="all">Todos os Portais</option>
                        {portals.map(portal => (
                            <option key={portal.id} value={portal.id}>{portal.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filters.statusFilter}
                        onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value as any }))}
                        className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="enrolled">Com Matrículas</option>
                        <option value="no-enrollment">Sem Matrículas</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>

                    {/* Select All */}
                    <button
                        onClick={selectAllUsers}
                        className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                        {selectedUsers.size === filteredUsers.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                </div>
            </div>

            {/* User List */}
            <div className="space-y-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl border p-6 transition-all hover:shadow-lg ${selectedUsers.has(user.id) ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20' : 'border-gray-200 dark:border-gray-700'
                                } ${user.is_disabled ? 'opacity-60' : ''}`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4 flex-1">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => toggleUserSelection(user.id)}
                                        className="mt-1 w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />

                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white font-semibold text-lg">
                                            {(user.raw_user_meta_data?.name || user.email).charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {user.raw_user_meta_data?.name || 'Sem nome'}
                                            </h3>
                                            {user.raw_user_meta_data?.role === 'admin' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Admin
                                                </span>
                                            )}
                                            {user.is_disabled && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    <UserX className="w-3 h-3 mr-1" />
                                                    Inativo
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            <Mail className="w-4 h-4 mr-2" />
                                            {user.email}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center">
                                                <GraduationCap className="w-4 h-4 mr-2 text-pink-500" />
                                                <span className="font-medium text-gray-900 dark:text-white">{user.enrollments.length}</span>
                                                <span className="ml-1 text-gray-600 dark:text-gray-400">
                                                    {user.enrollments.length === 1 ? 'portal' : 'portais'}
                                                </span>
                                            </div>

                                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        {/* Enrollments Preview */}
                                        {user.enrollments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {user.enrollments.slice(0, 3).map((enrollment: any, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200"
                                                    >
                                                        Portal {idx + 1}
                                                    </span>
                                                ))}
                                                {user.enrollments.length > 3 && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                                        +{user.enrollments.length - 3} mais
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Quick Debug Panel */}
                                        <div className="mt-3">
                                            <QuickDebugPanel userEmail={user.email} userId={user.id} />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 ml-4">
                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleResetPassword(user.id, user.email)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Redefinir senha"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={() => handleToggleUserStatus(user.id, user.email, user.is_disabled || false)}
                                            className={`p-2 rounded-lg transition-colors ${user.is_disabled
                                                ? 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                }`}
                                            title={user.is_disabled ? 'Ativar usuário' : 'Desativar usuário'}
                                        >
                                            {user.is_disabled ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Manage Link */}
                                    <Link
                                        href={`/users/${user.id}/manage`}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        Gerenciar
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                        <Filter className="mx-auto w-12 h-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Nenhum franqueado encontrado</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Tente ajustar os filtros de busca
                        </p>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Novo Franqueado</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo</label>
                                <input
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="Ex: João Silva"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="joao@exemplo.com"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Senha Inicial</label>
                                <input
                                    required
                                    type="text"
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Você deve enviar esta senha para o usuário.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Acesso</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                    <option value="member">Franqueado (Padrão)</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isCreating}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Criando...
                                        </>
                                    ) : (
                                        newUser.role === 'admin' ? 'Criar Administrador' : 'Criar Franqueado'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Enroll Modal */}
            {isBulkEnrollModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Matrícula em Lote</h2>
                            <button
                                onClick={() => setIsBulkEnrollModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleBulkEnroll} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Portal ({selectedUsers.size} usuários selecionados)
                                </label>
                                <select
                                    required
                                    value={bulkEnrollData.portalId}
                                    onChange={e => setBulkEnrollData({ ...bulkEnrollData, portalId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                    <option value="">Selecione um portal</option>
                                    {portals.map(portal => (
                                        <option key={portal.id} value={portal.id}>{portal.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={bulkEnrollData.accessAll}
                                        onChange={e => setBulkEnrollData({ ...bulkEnrollData, accessAll: e.target.checked })}
                                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 rounded focus:ring-pink-500 dark:focus:ring-pink-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Acesso completo ao portal</span>
                                </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Se desmarcado, você poderá selecionar módulos específicos na próxima etapa.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <button
                                    type="button"
                                    onClick={() => setIsBulkEnrollModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Matricular Franqueados
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}