'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, Save, CheckCircle2, Circle, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { toast } from 'sonner';

interface AccessManagerProps {
    context: 'portal' | 'module' | 'content';
    portalId: string;
    resourceId?: string; // module_id or content_id (required if context != portal)
}

interface UserAccessItem {
    userId: string;
    displayEmail: string;
    fullName: string;
    avatarUrl?: string;
    hasAccess: boolean;
    enrollmentId?: string;
    permissions?: any; // The full permission json
}

export function AccessManager({ context, portalId, resourceId }: AccessManagerProps) {
    const [users, setUsers] = useState<UserAccessItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // For local diff tracking
    const [modifiedUsers, setModifiedUsers] = useState<Set<string>>(new Set());

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        fetchData();
    }, [context, portalId, resourceId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Enrollments for this Portal
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('portal_id', portalId);

            if (enrollmentsError) {
                console.error('Errors fetching enrollments:', enrollmentsError);
                throw enrollmentsError;
            }

            // 2. Fetch Profiles to get names/emails
            let profilesQuery = supabase.from('profiles').select('*').neq('role', 'admin');

            // For module/content context: fetch profiles for enrolled users
            // For portal context: fetch ALL profiles (to allow enrolling new users)
            if (context !== 'portal' && enrollmentsData) {
                const userIds = enrollmentsData.map((e: any) => e.user_id);
                if (userIds.length === 0) {
                    // No enrollments yet - show empty state for module/content
                    setUsers([]);
                    setLoading(false);
                    return;
                }
                profilesQuery = profilesQuery.in('id', userIds);
            }

            const { data: profilesData, error: profilesError } = await profilesQuery;

            if (profilesError) {
                console.error('Error fetching profiles:', profilesError);
                throw profilesError;
            }

            const profilesMap = new Map((profilesData as any[])?.map(p => [p.id, p]));
            const enrollmentsMap = new Map((enrollmentsData as any[])?.map(e => [e.user_id, e]));

            // Context-specific Logic
            if (context === 'portal') {
                // List ALL profiles for portal context
                const items: UserAccessItem[] = (profilesData as any[]).map(p => {
                    const enrollment = enrollmentsMap.get(p.id);
                    return {
                        userId: p.id,
                        displayEmail: p.email,
                        fullName: p.full_name || '',
                        avatarUrl: p.avatar_url,
                        hasAccess: !!enrollment,
                        enrollmentId: enrollment?.id,
                        permissions: enrollment?.permissions || {
                            access_all_modules: true,
                            allowed_modules: [],
                            allowed_contents: []
                        }
                    };
                });
                setUsers(items);

            } else {
                // For module/content context: List ENROLLED users only
                // Show them all, but mark hasAccess based on their permissions for this specific resource
                const items: UserAccessItem[] = (enrollmentsData as any[]).map(e => {
                    const profile = profilesMap.get(e.user_id);
                    const perms = e.permissions || {};
                    let hasAccess = false;

                    if (perms.access_all_modules) {
                        hasAccess = true;
                    } else if (context === 'module' && resourceId) {
                        const allowed = perms.allowed_modules || [];
                        hasAccess = allowed.includes(resourceId);
                    } else if (context === 'content' && resourceId) {
                        const allowed = perms.allowed_contents || [];
                        hasAccess = allowed.includes(resourceId);
                    }

                    return {
                        userId: e.user_id,
                        displayEmail: profile?.email || 'Sem email',
                        fullName: profile?.full_name || '',
                        avatarUrl: profile?.avatar_url,
                        hasAccess: hasAccess,
                        enrollmentId: e.id,
                        permissions: perms
                    };
                });
                setUsers(items);
            }

        } catch (error: any) {
            console.error('Error fetching data (detailed):', JSON.stringify(error, null, 2));
            toast.error(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = (userId: string) => {
        setUsers(current =>
            current.map(u => {
                if (u.userId === userId) {
                    return { ...u, hasAccess: !u.hasAccess };
                }
                return u;
            })
        );
        setModifiedUsers(prev => new Set(prev).add(userId));
    };

    const handleSelectAll = () => {
        setUsers(current => current.map(u => ({ ...u, hasAccess: true })));
        setModifiedUsers(new Set(users.map(u => u.userId))); // Mark all as modified (simplification)
    };

    const handleDeselectAll = () => {
        setUsers(current => current.map(u => ({ ...u, hasAccess: false })));
        setModifiedUsers(new Set(users.map(u => u.userId)));
    };

    const handleSave = async () => {
        if (!modifiedUsers.size) {
            toast.info('Nenhuma alteração para salvar.');
            return;
        }

        setSaving(true);
        toast.loading('Salvando permissões...');

        try {
            // Prepare updates
            // Context: PORTAL -> Enrollment Create/Delete
            if (context === 'portal') {
                const toInsert: any[] = [];
                const toDelete: string[] = [];

                // Iterate over modified users
                const modifiedList = users.filter(u => modifiedUsers.has(u.userId));

                for (const u of modifiedList) {
                    if (u.hasAccess && !u.enrollmentId) {
                        // Needs to be enrolled
                        toInsert.push({
                            portal_id: portalId,
                            user_id: u.userId,
                            permissions: {
                                access_all_modules: true,
                                allowed_modules: [],
                                allowed_contents: []
                            },
                            enrolled_at: new Date().toISOString(),
                            is_active: true
                        });
                    } else if (!u.hasAccess && u.enrollmentId) {
                        // Needs to be removed
                        toDelete.push(u.enrollmentId);
                    }
                }

                if (toInsert.length > 0) {
                    console.log('Inserting enrollments:', toInsert);
                    // Explicitly use onConflict if there's a unique constraint on portal_id + user_id, 
                    // though usually we relying on ID. Since we don't have ID, we rely on insert.
                    // If a record actually exists (race condition or soft delete), upsert helps if we knew the conflict column.
                    // Assuming unique(user_id, portal_id).
                    const { error: insertErr } = await supabase
                        .from('enrollments')
                        .upsert(toInsert, { onConflict: 'user_id,portal_id' }); // Use composite key if exists

                    if (insertErr) {
                        console.error('Insert error:', insertErr);
                        throw insertErr;
                    }
                }
                if (toDelete.length > 0) {
                    console.log('Deleting enrollments:', toDelete);
                    const { error: delErr } = await supabase.from('enrollments').delete().in('id', toDelete);

                    if (delErr) {
                        console.error('Delete error:', delErr);
                        throw delErr;
                    }
                }

            } else if (resourceId) {
                // Context: MODULE or CONTENT -> Update JSONB
                const updates = [];

                const modifiedList = users.filter(u => modifiedUsers.has(u.userId));

                for (const u of modifiedList) {
                    if (!u.enrollmentId) continue; // Should exist if context != portal

                    const currentPerms = {
                        access_all_modules: false,
                        allowed_modules: [] as string[],
                        allowed_contents: [] as string[],
                        ...u.permissions
                    };

                    if (context === 'module') {
                        let modules = new Set(currentPerms.allowed_modules || []);
                        if (u.hasAccess) {
                            modules.add(resourceId);
                        } else {
                            modules.delete(resourceId);
                        }
                        currentPerms.allowed_modules = Array.from(modules);
                    } else if (context === 'content') {
                        let contents = new Set(currentPerms.allowed_contents || []);
                        if (u.hasAccess) {
                            contents.add(resourceId);
                        } else {
                            contents.delete(resourceId);
                        }
                        currentPerms.allowed_contents = Array.from(contents);
                    }

                    updates.push({
                        id: u.enrollmentId,
                        user_id: u.userId, // Include for safety
                        portal_id: portalId, // Include for safety
                        permissions: currentPerms
                    });
                }

                if (updates.length > 0) {
                    const { error: updateErr } = await supabase.from('enrollments').upsert(updates, { onConflict: 'id' });
                    if (updateErr) throw updateErr;
                }
            }

            toast.dismiss();
            toast.success('Acessos atualizados com sucesso!');
            setModifiedUsers(new Set());
            await fetchData(); // Refresh to sync IDs etc
            router.refresh(); // Invalidate Next.js cache

        } catch (error: any) {
            console.error('Save error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            toast.dismiss();
            toast.error(`Erro ao salvar: ${error.message || 'Verifique o console para detalhes'}`);
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = users.filter(u => u.hasAccess).length;

    // Helper to get initials
    const getInitials = (name: string, email: string) => {
        if (name) {
            return name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#1A1A1E] rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm transition-colors">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-[#1A1A1E]">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                    <Input
                        placeholder="Buscar por nome ou email..."
                        className="pl-9 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-pink-500/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
                    <span className="font-medium text-pink-500">{activeCount}</span> selecionado(s)
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-zinc-600 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-white hover:bg-pink-50 dark:hover:bg-white/5"
                    >
                        Todos
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeselectAll}
                        className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5"
                    >
                        Nenhum
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || modifiedUsers.size === 0}
                        className="bg-pink-600 hover:bg-pink-700 text-white min-w-[100px] shadow-lg shadow-pink-500/20"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px] bg-white dark:bg-[#1A1A1E]">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Carregando usuários...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-400 opacity-60">
                        <Users className="w-10 h-10 mb-2" />
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <div
                            key={user.userId}
                            className={`
                                flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer group
                                ${user.hasAccess
                                    ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20'
                                    : 'bg-white dark:bg-[#27272A] border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                                }
                            `}
                            onClick={() => toggleUser(user.userId)}
                        >
                            <div className="flex items-center gap-3">
                                {/* Checkbox Indicator */}
                                <div className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                                    ${user.hasAccess
                                        ? 'bg-pink-500 border-pink-500 text-white'
                                        : 'border-gray-300 dark:border-zinc-600 bg-white dark:bg-transparent group-hover:border-gray-400'
                                    }
                                `}>
                                    {user.hasAccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-zinc-700 overflow-hidden flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/5">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                                                {getInitials(user.fullName, user.displayEmail)}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <p className={`text-sm font-semibold capitalize ${user.hasAccess ? 'text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                            {user.fullName || (user.displayEmail.split('@')[0])}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                                            {user.displayEmail}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {user.permissions?.access_all_modules && context !== 'portal' && (
                                <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                                    Acesso Total
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
