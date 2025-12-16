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
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Input, Button } from '@/components/UIComponents';
import { UserWithEnrollments, EnrollmentPermissions } from '@/types/enrollment';
import { createUser } from '@/app/(admin)/admin/users/actions'; // Server Action
import { toast } from 'sonner';

// ... (interfaces restored) ...
interface FilterState {
    searchTerm: string;
    portalFilter: string;
    statusFilter: 'all' | 'enrolled' | 'no-enrollment';
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

    // New User Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });

    // Combine users with their enrollments
    const users: UserWithEnrollments[] = useMemo(() => {
        return (authUsers || []).map(user => ({
            id: user.id,
            email: user.email || '',
            created_at: user.created_at,
            raw_user_meta_data: user.user_metadata || {},
            enrollments: (enrollments || []).filter(e => e.user_id === user.id).map(e => ({
                ...e,
                permissions: e.permissions as unknown as EnrollmentPermissions
            }))
        }));
    }, [authUsers, enrollments]);

    // Apply filters
    const filteredUsers = users.filter(user => {
       // ... (filtering logic same) ...
        const matchesSearch =
            user.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            (user.raw_user_meta_data?.name || '').toLowerCase().includes(filters.searchTerm.toLowerCase());

        const matchesPortal =
            filters.portalFilter === 'all' ||
            user.enrollments.some(e => e.portal_id === filters.portalFilter);

        const matchesStatus =
            filters.statusFilter === 'all' ||
            (filters.statusFilter === 'enrolled' && user.enrollments.length > 0) ||
            (filters.statusFilter === 'no-enrollment' && user.enrollments.length === 0);

        return matchesSearch && matchesPortal && matchesStatus;
    });

    const stats = {
        total: users.length,
        enrolled: users.filter(u => u.enrollments.length > 0).length,
        noEnrollment: users.filter(u => u.enrollments.length === 0).length
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
                setNewUser({ name: '', email: '', password: '', role: 'student' });
            }
        } catch (error) {
            toast.error('Erro inesperado ao criar usuário');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {stats.total} alunos • {stats.enrolled} matriculados • {stats.noEnrollment} sem acesso
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Cadastrar Franqueado
                </Button>
            </div>

            {/* Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Novo Usuário</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <Input
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="Ex: João Silva"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <Input
                                    required
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="joao@exemplo.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Senha Inicial</label>
                                <Input
                                    required
                                    type="text" // Visible by default for admin convenience
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <p className="text-xs text-gray-500 mt-1">Você deve enviar esta senha para o usuário.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Acesso</label>
                                <select
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="student">Aluno (Padrão)</option>
                                    <option value="admin">Administrador</option>
                                    <option value="franchisee">Franqueado</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isCreating}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 text-white hover:bg-blue-700"
                                    disabled={isCreating}
                                >
                                    {isCreating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Criando...</> : 'Criar Usuário'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            className="pl-10"
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        />
                    </div>

                    {/* Portal Filter */}
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.portalFilter}
                        onChange={(e) => setFilters(prev => ({ ...prev, portalFilter: e.target.value }))}
                    >
                        <option value="all">Todos os Portais</option>
                        {portals.map(portal => (
                            <option key={portal.id} value={portal.id}>{portal.name}</option>
                        ))}
                    </select>

                    {/* Status Filter */}
                    <select
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={filters.statusFilter}
                        onChange={(e) => setFilters(prev => ({ ...prev, statusFilter: e.target.value as any }))}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="enrolled">Com Matrículas</option>
                        <option value="no-enrollment">Sem Matrículas</option>
                    </select>
                </div>
            </div>

            {/* User Cards */}
            <div className="grid grid-cols-1 gap-4">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                    {/* Avatar */}
                                    <div className="flex-shrink-0">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                                            {(user.raw_user_meta_data?.name || user.email).charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                {user.raw_user_meta_data?.name || 'Sem nome'}
                                            </h3>
                                            {user.raw_user_meta_data?.role === 'admin' && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                    <Shield className="w-3 h-3 mr-1" />
                                                    Admin
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 flex items-center text-sm text-gray-500">
                                            <Mail className="w-4 h-4 mr-1" />
                                            {user.email}
                                        </div>

                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            {/* Enrollment Count */}
                                            <div className="flex items-center text-sm">
                                                <GraduationCap className="w-4 h-4 mr-1.5 text-blue-600" />
                                                <span className="font-medium text-gray-900">{user.enrollments.length}</span>
                                                <span className="ml-1 text-gray-500">
                                                    {user.enrollments.length === 1 ? 'portal' : 'portais'}
                                                </span>
                                            </div>

                                            {/* Created Date */}
                                            <div className="flex items-center text-sm text-gray-500">
                                                <Calendar className="w-4 h-4 mr-1.5" />
                                                Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        {/* Enrollments Preview */}
                                        {user.enrollments.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {user.enrollments.slice(0, 3).map((enrollment, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                                    >
                                                        Portal {idx + 1}
                                                    </span>
                                                ))}
                                                {user.enrollments.length > 3 && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                                                        +{user.enrollments.length - 3} mais
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <Link
                                    href={`/admin/users/${user.id}/manage`}
                                    className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <Settings className="w-4 h-4 mr-2" />
                                    Gerenciar Acessos
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                        <Filter className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum aluno encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Tente ajustar os filtros de busca
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
