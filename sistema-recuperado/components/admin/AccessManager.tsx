'use client';

import { useState, useEffect } from 'react';
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
    email: string; // or name/identifier
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

    useEffect(() => {
        fetchData();
    }, [context, portalId, resourceId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Enrollments for this Portal
            // Remove the join 'profiles:user_id' as it might cause errors if FK is missing
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('*')
                .eq('portal_id', portalId);

            if (enrollmentsError) {
                console.error('Errors fetching enrollments:', enrollmentsError);
                throw enrollmentsError;
            }

            // 2. Fetch Profiles to get names/emails
            // We need to fetch profiles for the users we found in enrollments (or ALL if context is portal)
            let profilesQuery = supabase.from('profiles').select('*');

            // If NOT portal context, only fetch profiles for enrolled users
            if (context !== 'portal' && enrollmentsData) {
                const userIds = enrollmentsData.map((e: any) => e.user_id);
                if (userIds.length > 0) {
                    profilesQuery = profilesQuery.in('id', userIds);
                } else {
                    setUsers([]);
                    setLoading(false);
                    return;
                }
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
                // List ALL profiles
                // Map to UserAccessItem
                const items: UserAccessItem[] = (profilesData as any[]).map(p => {
                    const enrollment = enrollmentsMap.get(p.id);
                    return {
                        userId: p.id,
                        email: p.full_name || p.email || `User ${p.id.substring(0, 6)}`, // Fallback
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
                // List ONLY enrolled users
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
                        email: profile?.full_name || profile?.email || `Alun@ ${e.user_id.substring(0, 6)}`,
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
                const toInsert = [];
                const toDelete = [];

                // Iterate over ALL users to see state (optimization: only modified ones)
                // But safer to just look at modified ones.
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
                    const { error: insertErr } = await supabase.from('enrollments').upsert(toInsert);
                    if (insertErr) throw insertErr;
                }
                if (toDelete.length > 0) {
                    const { error: delErr } = await supabase.from('enrollments').delete().in('id', toDelete);
                    if (delErr) throw delErr;
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

                    // Note: If access_all_modules is true, arguably we don't need to add specific IDs,
                    // but logic requests adding them. We'll add them to be explicit or if access_all is off.

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
                        user_id: u.userId,
                        portal_id: portalId,
                        permissions: currentPerms,
                        updated_at: new Date().toISOString()
                    });
                }

                if (updates.length > 0) {
                    const { error: updateErr } = await supabase.from('enrollments').upsert(updates, { onConflict: 'id' });
                    if (updateErr) throw updateErr;
                }
            }

            toast.dismiss();
            toast.success('Acessos atualizados!');
            setModifiedUsers(new Set());
            await fetchData(); // Refresh to sync IDs etc

        } catch (error: any) {
            console.error('Save error:', error);
            toast.dismiss();
            toast.error('Erro ao salvar acessos.');
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const activeCount = users.filter(u => u.hasAccess).length;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-zinc-950/50 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-zinc-900/30">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <Input
                        placeholder="Buscar usuário..."
                        className="pl-9 bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-pink-500/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <span className="font-medium text-pink-500">{activeCount}</span> selecionado(s)
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectAll} className="bg-white dark:bg-transparent border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:text-pink-600 dark:hover:text-white hover:border-pink-500/50">
                        Todos
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDeselectAll} className="border-zinc-700 text-zinc-300 hover:text-white">
                        Nenhum
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || modifiedUsers.size === 0}
                        className="bg-pink-600 hover:bg-pink-700 text-white min-w-[100px]"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-zinc-500 gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" /> Carregando usuários...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
                        <Users className="w-10 h-10 mb-2" />
                        <p>Nenhum usuário encontrado.</p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <div
                            key={user.userId}
                            className={`
                                flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer
                                ${user.hasAccess
                                    ? 'bg-pink-500/5 border-pink-500/20'
                                    : 'bg-zinc-900/20 border-zinc-800/50 hover:border-zinc-700'
                                }
                            `}
                            onClick={() => toggleUser(user.userId)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-5 h-5 rounded border flex items-center justify-center transition-colors
                                    ${user.hasAccess ? 'bg-pink-500 border-pink-500' : 'border-zinc-600'}
                                `}>
                                    {user.hasAccess && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${user.hasAccess ? 'text-pink-100' : 'text-zinc-300'}`}>
                                        {user.email}
                                    </p>
                                    <p className="text-xs text-zinc-500 font-mono">ID: {user.userId.substring(0, 8)}...</p>
                                </div>
                            </div>

                            {user.permissions?.access_all_modules && context !== 'portal' && (
                                <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded border border-emerald-500/20">
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
