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
import { createUser } from '@/app/(admin)/admin/users/actions';
import { toast } from 'sonner';

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

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>Gerenciar Alunos</h1>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {stats.total} alunos • {stats.enrolled} matriculados • {stats.noEnrollment} sem acesso
                    </p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '12px 24px',
                        backgroundColor: 'var(--primary-main)',
                        color: 'var(--text-on-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: 'var(--shadow-medium)',
                    }}
                >
                    <UserPlus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    Cadastrar Franqueado
                </button>
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50,
                    padding: '16px',
                    backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-xl)',
                        boxShadow: 'var(--shadow-large)',
                        maxWidth: '448px',
                        width: '100%',
                        padding: '28px',
                        border: '1px solid var(--border-color)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Novo Usuário</h2>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-disabled)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                }}
                            >
                                <X style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nome Completo</label>
                                <input
                                    required
                                    value={newUser.name}
                                    onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="Ex: João Silva"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'var(--bg-canvas)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
                                <input
                                    required
                                    type="email"
                                    value={newUser.email}
                                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="joao@exemplo.com"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'var(--bg-canvas)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha Inicial</label>
                                <input
                                    required
                                    type="text"
                                    minLength={6}
                                    value={newUser.password}
                                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Mínimo 6 caracteres"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'var(--bg-canvas)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                    }}
                                />
                                <p style={{ fontSize: '12px', color: 'var(--text-disabled)', marginTop: '4px' }}>Você deve enviar esta senha para o usuário.</p>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo de Acesso</label>
                                <select
                                    value={newUser.role}
                                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-md)',
                                        backgroundColor: 'var(--bg-canvas)',
                                        color: 'var(--text-primary)',
                                        fontSize: '14px',
                                    }}
                                >
                                    <option value="student">Aluno (Padrão)</option>
                                    <option value="admin">Administrador</option>
                                    <option value="franchisee">Franqueado</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    disabled={isCreating}
                                >
                                    Cancelar
                                </Button>
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '12px 24px',
                                        backgroundColor: 'var(--primary-main)',
                                        color: 'var(--text-on-primary)',
                                        border: 'none',
                                        borderRadius: 'var(--radius-full)',
                                        fontWeight: '600',
                                        fontSize: '14px',
                                        cursor: isCreating ? 'not-allowed' : 'pointer',
                                        opacity: isCreating ? 0.7 : 1,
                                    }}
                                >
                                    {isCreating ? <><Loader2 style={{ width: '16px', height: '16px', marginRight: '8px', animation: 'spin 1s linear infinite' }} />Criando...</> : 'Criar Usuário'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                padding: '20px',
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Search */}
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--text-disabled)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            value={filters.searchTerm}
                            onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                            style={{
                                width: '100%',
                                paddingLeft: '40px',
                                padding: '12px 16px 12px 40px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: 'var(--bg-canvas)',
                                color: 'var(--text-primary)',
                                fontSize: '14px',
                            }}
                        />
                    </div>

                    {/* Portal Filter */}
                    <select
                        value={filters.portalFilter}
                        onChange={(e) => setFilters(prev => ({ ...prev, portalFilter: e.target.value }))}
                        style={{
                            padding: '12px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-canvas)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                        }}
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
                        style={{
                            padding: '12px 16px',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-canvas)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                        }}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="enrolled">Com Matrículas</option>
                        <option value="no-enrollment">Sem Matrículas</option>
                    </select>
                </div>
            </div>

            {/* User Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                        <div
                            key={user.id}
                            style={{
                                backgroundColor: 'var(--bg-surface)',
                                borderRadius: 'var(--radius-xl)',
                                border: '1px solid var(--border-color)',
                                padding: '24px',
                                boxShadow: 'var(--shadow-card)',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                                    {/* Avatar with Pink Gradient */}
                                    <div style={{ flexShrink: 0 }}>
                                        <div style={{
                                            height: '48px',
                                            width: '48px',
                                            borderRadius: 'var(--radius-full)',
                                            background: 'linear-gradient(135deg, var(--primary-main) 0%, var(--primary-hover) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-on-primary)',
                                            fontWeight: '600',
                                            fontSize: '18px',
                                        }}>
                                            {(user.raw_user_meta_data?.name || user.email).charAt(0).toUpperCase()}
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                {user.raw_user_meta_data?.name || 'Sem nome'}
                                            </h3>
                                            {user.raw_user_meta_data?.role === 'admin' && (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '2px 8px',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    backgroundColor: 'var(--primary-subtle)',
                                                    color: 'var(--primary-main)',
                                                }}>
                                                    <Shield style={{ width: '12px', height: '12px', marginRight: '4px' }} />
                                                    Admin
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            <Mail style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                            {user.email}
                                        </div>

                                        <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
                                            {/* Enrollment Count */}
                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px' }}>
                                                <GraduationCap style={{ width: '14px', height: '14px', marginRight: '6px', color: 'var(--primary-main)' }} />
                                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.enrollments.length}</span>
                                                <span style={{ marginLeft: '4px', color: 'var(--text-secondary)' }}>
                                                    {user.enrollments.length === 1 ? 'portal' : 'portais'}
                                                </span>
                                            </div>

                                            {/* Created Date */}
                                            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <Calendar style={{ width: '14px', height: '14px', marginRight: '6px' }} />
                                                Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        {/* Enrollments Preview */}
                                        {user.enrollments.length > 0 && (
                                            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {user.enrollments.slice(0, 3).map((enrollment: any, idx: number) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '4px 10px',
                                                            borderRadius: 'var(--radius-md)',
                                                            fontSize: '12px',
                                                            fontWeight: '500',
                                                            backgroundColor: 'var(--primary-subtle)',
                                                            color: 'var(--primary-main)',
                                                            border: '1px solid var(--primary-main)',
                                                            borderColor: 'rgba(255, 45, 120, 0.2)',
                                                        }}
                                                    >
                                                        Portal {idx + 1}
                                                    </span>
                                                ))}
                                                {user.enrollments.length > 3 && (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        padding: '4px 10px',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        backgroundColor: 'var(--bg-canvas)',
                                                        color: 'var(--text-secondary)',
                                                    }}>
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
                                    style={{
                                        marginLeft: '16px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '10px 20px',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-full)',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: 'var(--text-primary)',
                                        backgroundColor: 'var(--bg-canvas)',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <Settings style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                                    Gerenciar Acessos
                                    <ChevronRight style={{ width: '16px', height: '16px', marginLeft: '4px' }} />
                                </Link>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '48px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-xl)',
                        border: '2px dashed var(--border-color)',
                    }}>
                        <Filter style={{ margin: '0 auto', width: '48px', height: '48px', color: 'var(--text-disabled)' }} />
                        <h3 style={{ marginTop: '12px', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Nenhum aluno encontrado</h3>
                        <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Tente ajustar os filtros de busca
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
