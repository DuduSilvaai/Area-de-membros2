'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { EnrollmentPermissions } from '@/types/enrollment';
import { ActionResponse, EnrollmentWithPortal } from '@/types/app';
import { Tables, TablesInsert } from '@/types/supabase';
import { revalidatePath } from 'next/cache';
import { createUserSchema } from '@/lib/validation/schemas';
import { checkUserCreationRateLimit, checkApiRateLimit } from '@/lib/rate-limit';
import { log } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth-guard';
import { generateSecurePassword, validatePasswordStrength, isCommonPassword } from '@/lib/security/password';
// import * as yup from 'yup'; // Removed yup

// Define types for paginated response
export interface UserData {
    id: string;
    email?: string;
    created_at: string;
    last_sign_in_at?: string;
    user_metadata: {
        name?: string;
        role?: string;
        avatar_url?: string;
    };
    app_metadata: {
        provider?: string;
        [key: string]: any;
    };
}

export interface PaginatedUsersResponse {
    users: UserData[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}

// Helper to get admin client with service role
function getAdminClient() {
    return createAdminClient();
}

export async function upsertEnrollment(
    userId: string,
    portalId: string,
    permissions: EnrollmentPermissions
) {
    const supabase = await createClient();
    const adminSupabase = getAdminClient();

    // Rate limit check
    if (!checkApiRateLimit('enrollment')) {
        return { error: 'Muitas requisições. Tente novamente em alguns minutos.' };
    }

    // Get current user for enrolled_by field
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
        return { error: 'Não autenticado' };
    }



    const now = new Date().toISOString();

    // Temporarily remove enrolled_by until migration is run
    // Temporarily remove enrolled_by until migration is run
    const enrollmentData: TablesInsert<'enrollments'> = {
        user_id: userId,
        portal_id: portalId,
        permissions: permissions as unknown as any, // Cast to any temporarily to satisfy complex Json union type
        enrolled_at: now,
        // enrolled_by: currentUser.id, // Commented out until migration
        is_active: true
    };



    const { data, error } = await adminSupabase
        .from('enrollments')
        .upsert(enrollmentData, {
            onConflict: 'user_id,portal_id'
        })
        .select()
        .single();

    if (error) {
        log.error({ errorMessage: error.message, code: error.code }, 'Error upserting enrollment');
        return { error: error.message };
    }



    // Log the action (using currentUser already fetched above)
    if (currentUser) {
        await adminSupabase.from('access_logs').insert({
            user_id: currentUser.id,
            action: 'update_permissions',
            details: JSON.parse(JSON.stringify({
                target_user_id: userId,
                portal_id: portalId,
                permissions: permissions
            }))
        });
    }

    // Force cache invalidation with multiple strategies
    revalidatePath(`/users/${userId}/manage`);
    revalidatePath('/users');
    revalidatePath('/members'); // Also invalidate members page

    // Additional cache busting - trigger a notification to realtime subscribers
    // This helps ensure immediate updates across all connected clients
    try {
        // Trigger realtime notification by touching the record
        await adminSupabase
            .from('enrollments')
            .update({ is_active: true } as any) // Trigger update to fire realtime
            .eq('id', data.id);
    } catch {
        // Realtime trigger - erros ignorados silenciosamente
    }

    return { data: data as unknown as Tables<'enrollments'> };
}

export async function deleteEnrollment(userId: string, portalId: string) {
    const supabase = await createClient();
    const adminSupabase = getAdminClient();



    // Use soft-delete instead of hard-delete to maintain data integrity
    // and ensure realtime subscriptions work properly
    const { data, error } = await adminSupabase
        .from('enrollments')
        .update({
            is_active: false
        })
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .select()
        .single();

    if (error) {
        log.error({ errorMessage: error.message }, 'Error soft-deleting enrollment');
        return { error: error.message };
    }



    // Log the action
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
        await adminSupabase.from('access_logs').insert({
            user_id: currentUser.id,
            action: 'remove_enrollment',
            details: {
                target_user_id: userId,
                portal_id: portalId
            }
        });
    }

    // Force cache invalidation with multiple strategies
    revalidatePath(`/users/${userId}/manage`);
    revalidatePath('/users');
    revalidatePath('/members'); // Also invalidate members page

    // Trigger realtime notification by updating a timestamp field
    // This ensures all connected clients receive the change immediately
    try {
        await adminSupabase
            .from('enrollments')
            .update({ is_active: false } as any) // Trigger update to fire realtime
            .eq('id', data.id);
    } catch {
        // Realtime trigger - erros ignorados silenciosamente
    }

    return { success: true };
}

export async function getUserEnrollments(userId: string): Promise<ActionResponse<{ enrollments: EnrollmentWithPortal[] }>> {
    const adminSupabase = getAdminClient();

    const { data, error } = await adminSupabase
        .from('enrollments')
        .select(`
      *,
      portals:portal_id (
        id,
        name,
        image_url
      )
    `)
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error) {
        log.error({ errorMessage: error.message }, 'Error fetching enrollments');
        return { error: error.message };
    }

    // Cast is safe because of the select structure with relation
    return { data: { enrollments: data as unknown as EnrollmentWithPortal[] } };
}

export async function createUser(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
}): Promise<ActionResponse<{ user: any; generatedPassword?: string }>> {
    // Verify caller is an admin
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado: Apenas administradores podem criar usuários' };
    }

    // Rate limit check
    if (!checkUserCreationRateLimit('user-creation')) {
        return { error: 'Muitas requisições. Tente novamente em alguns minutos.' };
    }

    // Validate input with schema
    const validationResult = createUserSchema.safeParse({
        name: data.name,
        email: data.email,
        password: data.password || 'TempPass1@', // Temporary for validation
        role: data.role
    });

    if (!validationResult.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: (validationResult.error as any).issues?.[0]?.message || 'Erro de validação' };
    }

    const adminSupabase = getAdminClient();
    let generatedPassword: string | undefined;

    // Generate secure password if not provided
    let userPassword = data.password;
    if (!userPassword) {
        generatedPassword = generateSecurePassword(16);
        userPassword = generatedPassword;
        log.info({ email: data.email }, 'Generated secure password for new user');
    } else {
        // Validate provided password strength
        const passwordValidation = validatePasswordStrength(userPassword);
        if (!passwordValidation.isValid) {
            return { error: passwordValidation.errors.join(', ') };
        }
        // Check for common passwords
        if (isCommonPassword(userPassword)) {
            return { error: 'A senha fornecida é muito comum e insegura. Escolha uma senha mais forte.' };
        }
    }

    // 1. Create user in Supabase Auth
    const { data: newUser, error } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: userPassword,
        email_confirm: true, // Auto-confirm
        user_metadata: {
            name: data.name,
            role: data.role === 'admin' ? 'admin' : 'member' // Normalize role for consistency
        }
    });

    if (error) {
        log.error({ errorMessage: error.message }, 'Error creating user');
        return { error: error.message };
    }

    // 1.5. Explicitly update profile to ensure full_name is set
    // This addresses the user requirement to use the `full_name` column
    if (newUser.user) {
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: data.email,
                full_name: data.name,
                role: data.role === 'admin' ? 'admin' : 'member'
            });

        if (profileError) {
            console.error('Error updating profile:', profileError);
            // We don't fail the whole request, but we log it
        }
    }

    // 2. Log the action
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
        await adminSupabase.from('access_logs').insert({
            user_id: currentUser.id,
            action: 'create_user',
            details: JSON.parse(JSON.stringify({
                created_user_id: newUser.user?.id,
                created_user_email: data.email,
                created_user_role: data.role
            }))
        });
    }

    revalidatePath('/users');
    return {
        data: {
            user: newUser.user,
            generatedPassword // Return generated password so admin can share with user
        }
    };
}

// New function to reset user password
export async function resetUserPassword(userId: string, newPassword: string) {
    // Verify caller is an admin
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado: Apenas administradores podem redefinir senhas' };
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return { error: 'ID de usuário inválido' };
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
        return { error: passwordValidation.errors.join(', ') };
    }

    // Check for common passwords
    if (isCommonPassword(newPassword)) {
        return { error: 'A senha fornecida é muito comum e insegura. Escolha uma senha mais forte.' };
    }

    const adminSupabase = getAdminClient();

    const { data, error } = await adminSupabase.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (error) {
        log.error({ errorMessage: error.message }, 'Error resetting password');
        return { error: error.message };
    }

    // Log the action
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
        await adminSupabase.from('access_logs').insert({
            user_id: currentUser.id,
            action: 'reset_password',
            details: {
                target_user_id: userId
            }
        });
    }

    return { data };
}

// New function to deactivate/activate user
export async function toggleUserStatus(userId: string, disabled: boolean) {
    // Verify caller is an admin
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado: Apenas administradores podem alterar status de usuários' };
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
        return { error: 'ID de usuário inválido' };
    }

    const adminSupabase = getAdminClient();

    const { data, error } = await adminSupabase.auth.admin.updateUserById(userId, {
        ban_duration: disabled ? '876000h' : 'none' // ~100 years or none
    });

    if (error) {
        log.error({ errorMessage: error.message }, 'Error toggling user status');
        return { error: error.message };
    }

    // Log the action
    const supabase = await createClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
        await adminSupabase.from('access_logs').insert({
            user_id: currentUser.id,
            action: disabled ? 'deactivate_user' : 'activate_user',
            details: {
                target_user_id: userId
            }
        });
    }

    revalidatePath('/users');
    return { data };
}

// New function for bulk enrollment
export async function bulkEnrollUsers(userIds: string[], portalId: string, permissions: EnrollmentPermissions) {
    const adminSupabase = getAdminClient();
    const supabase = await createClient();

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
        return { error: 'Não autenticado' };
    }

    // Temporarily remove enrolled_by until migration is run
    const enrollments = userIds.map(userId => ({
        user_id: userId,
        portal_id: portalId,
        permissions: permissions as any,
        // enrolled_by: currentUser.id, // Commented out until migration
        is_active: true
    }));

    const { data, error } = await adminSupabase
        .from('enrollments')
        .upsert(enrollments, {
            onConflict: 'user_id,portal_id'
        });

    if (error) {
        console.error('Error bulk enrolling users:', error);
        return { error: error.message };
    }

    // Log the action
    await adminSupabase.from('access_logs').insert({
        user_id: currentUser.id,
        action: 'bulk_enroll',
        details: {
            portal_id: portalId,
            user_count: userIds.length,
            user_ids: userIds
        }
    });

    revalidatePath('/users');
    return { data };
}

// Debug user access function
export async function debugUserAccess(userEmail: string) {
    const adminSupabase = getAdminClient();

    try {
        // Find user by email
        const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();

        if (usersError) {
            return { error: `Error listing users: ${usersError.message}` };
        }

        const targetUser = users?.find(u => u.email === userEmail);

        if (!targetUser) {
            return { error: `User with email ${userEmail} not found` };
        }

        // Get all enrollments for this user
        const { data: allEnrollments, error: enrollError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id);

        // Get active enrollments only
        const activeEnrollments = allEnrollments?.filter(e => e.is_active) || [];

        // Otimização: Buscar apenas campos necessários dos portais ativos
        const { data: allPortals, error: portalsError } = await adminSupabase
            .from('portals')
            .select('id, name, is_active')
            .eq('is_active', true); // Buscar apenas ativos direto do banco

        // Get active portals only (já filtrado na query, mas mantendo variável para compatibilidade lógica)
        const activePortals = allPortals || [];

        // Get portal IDs from enrollments
        const enrolledPortalIds = activeEnrollments.map(e => e.portal_id);

        // Get enrolled portals (what should appear)
        const enrolledPortals = activePortals.filter(p => enrolledPortalIds.includes(p.id));

        return {
            success: true,
            data: {
                user: {
                    id: targetUser.id,
                    email: targetUser.email
                },
                totalEnrollments: allEnrollments?.length || 0,
                activeEnrollments: activeEnrollments.length,
                totalPortals: allPortals?.length || 0,
                activePortals: activePortals.length,
                expectedPortals: enrolledPortals.length,
                enrolledPortals: enrolledPortals,
                missingPortals: activePortals.filter(p => !enrolledPortalIds.includes(p.id))
            }
        };

    } catch (error) {
        console.error('Debug error:', error);
        return { error: `Unexpected error: ${error}` };
    }
}

// Fix missing enrollments function
export async function fixMissingEnrollments(userEmail: string) {
    const adminSupabase = getAdminClient();

    try {
        // Find user by email
        const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
        const targetUser = users?.find(u => u.email === userEmail);

        if (!targetUser) {
            return { error: `User with email ${userEmail} not found` };
        }

        // Get all active portals
        const { data: allPortals, error: portalsError } = await adminSupabase
            .from('portals')
            .select('id, name')
            .eq('is_active', true);

        if (portalsError) {
            return { error: `Error fetching portals: ${portalsError.message}` };
        }

        // Get existing enrollments (ALL enrollments, not just active ones)
        const { data: existingEnrollments, error: enrollError } = await adminSupabase
            .from('enrollments')
            .select('*')
            .eq('user_id', targetUser.id);

        // Find missing enrollments - check ALL existing enrollments, not just active ones
        const existingPortalIds = existingEnrollments?.map(e => e.portal_id) || [];
        const missingPortals = allPortals?.filter(p => !existingPortalIds.includes(p.id)) || [];

        // Also check for inactive enrollments that can be reactivated
        const inactiveEnrollments = existingEnrollments?.filter(e => !e.is_active) || [];
        const reactivatePortals = allPortals?.filter(p =>
            inactiveEnrollments.some(e => e.portal_id === p.id)
        ) || [];

        if (missingPortals.length === 0 && reactivatePortals.length === 0) {
            return {
                success: true,
                message: 'No missing enrollments found',
                data: { createdCount: 0, reactivatedCount: 0 }
            };
        }

        let createdCount = 0;
        let reactivatedCount = 0;

        // Reactivate inactive enrollments first
        if (reactivatePortals.length > 0) {
            const reactivateIds = reactivatePortals.map(p => p.id);
            const { error: reactivateError } = await adminSupabase
                .from('enrollments')
                .update({
                    is_active: true,
                    permissions: {
                        access_all: true,
                        allowed_modules: [],
                        access_granted_at: new Date().toISOString()
                    }
                } as any)
                .eq('user_id', targetUser.id)
                .in('portal_id', reactivateIds);

            if (reactivateError) {
                return { error: `Error reactivating enrollments: ${reactivateError.message}` };
            }

            reactivatedCount = reactivatePortals.length;
        }

        // Create missing enrollments (only for truly missing ones)
        if (missingPortals.length > 0) {
            const newEnrollments = missingPortals.map(portal => ({
                user_id: targetUser.id,
                portal_id: portal.id,
                permissions: {
                    access_all: true,
                    allowed_modules: [],
                    access_granted_at: new Date().toISOString()
                },
                is_active: true,
                enrolled_at: new Date().toISOString()
            }));

            const { data: createdEnrollments, error: createError } = await adminSupabase
                .from('enrollments')
                .insert(newEnrollments)
                .select();

            if (createError) {
                return { error: `Error creating enrollments: ${createError.message}` };
            }

            createdCount = createdEnrollments?.length || 0;
        }

        revalidatePath('/users');
        revalidatePath('/members');

        const totalActions = createdCount + reactivatedCount;
        const actionMessages = [];

        if (createdCount > 0) {
            actionMessages.push(`${createdCount} novos enrollments criados`);
        }
        if (reactivatedCount > 0) {
            actionMessages.push(`${reactivatedCount} enrollments reativados`);
        }

        return {
            success: true,
            message: actionMessages.length > 0
                ? actionMessages.join(' e ')
                : 'Nenhuma ação necessária',
            data: {
                createdCount: createdCount,
                reactivatedCount: reactivatedCount,
                totalActions: totalActions,
                createdFor: missingPortals.map(p => p.name),
                reactivatedFor: reactivatePortals.map(p => p.name)
            }
        };

    } catch (error) {
        return { error: `Unexpected error: ${error}` };
    }
}

// New function to synchronization for legacy users
export async function syncUsersProfiles() {
    const adminSupabase = getAdminClient();

    try {
        let allUsers: any[] = [];
        let page = 1;
        const perPage = 50;
        let hasMore = true;

        // Fetch all users with pagination
        while (hasMore) {
            const { data: { users }, error } = await adminSupabase.auth.admin.listUsers({
                page: page,
                perPage: perPage
            });

            if (error) throw error;

            if (users.length > 0) {
                // Using User type from Supabase Auth
                allUsers = [...allUsers, ...users];
                page++;
            } else {
                hasMore = false;
            }

            // Safety break just in case
            if (users.length < perPage) hasMore = false;
        }

        console.log(`Syncing profiles for ${allUsers.length} total users...`);

        let updatedCount = 0;
        // Process in batches to avoid overwhelming the DB
        const batchSize = 20;
        for (let i = 0; i < allUsers.length; i += batchSize) {
            const batch = allUsers.slice(i, i + batchSize);
            // Otimização: Preparar todos os profiles do batch para um único upsert
            const updates: TablesInsert<'profiles'>[] = batch
                .filter((user: any) => user.user_metadata?.name) // Filtrar apenas usuários válidos
                .map((user: any) => ({
                    id: user.id,
                    email: user.email,
                    full_name: user.user_metadata.name,
                    role: (user.user_metadata.role === 'admin' ? 'admin' : 'member') as 'admin' | 'member',
                    updated_at: new Date().toISOString()
                }));

            if (updates.length > 0) {
                const { error } = await adminSupabase
                    .from('profiles')
                    .upsert(updates, { onConflict: 'id' });

                if (error) {
                    console.error('Error syncing batch:', error);
                } else {
                    updatedCount += updates.length;
                }
            }
        }

        console.log(`Profiles synced successfully. Updated: ${updatedCount}`);

        revalidatePath('/users');
        revalidatePath('/chat');
        return { success: true, count: updatedCount };

    } catch (error: any) {
        console.error('Error syncing profiles:', error);
        return { error: error.message };
    }
}

// New function to delete user (Auth + DB)
export async function deleteUser(userId: string) {
    try {
        await requireAdmin();
        const adminSupabase = getAdminClient();
        const supabase = await createClient(); // For logging user

        // 1. Manual cleanup from public tables FIRST (to prevent FK constraints blocking Auth delete)
        // We delete from "leaves" to "root" to avoid internal FK violations too, 
        // though Supabase Auth delete is the strict one.

        // Content interactions
        await adminSupabase.from('comment_likes').delete().eq('user_id', userId);
        await adminSupabase.from('comments').delete().eq('user_id', userId);
        await adminSupabase.from('progress').delete().eq('user_id', userId);
        await adminSupabase.from('lesson_attachments').delete().eq('type', 'file').ilike('url', `%${userId}%`); // Optional safety for uploads? skipped for now

        // Communication
        await adminSupabase.from('messages').delete().eq('sender_id', userId);
        await adminSupabase.from('conversations').delete().eq('student_id', userId);
        // If user was an admin in a conversation, nullify to keep chat for student
        await adminSupabase.from('conversations').update({ admin_id: null }).eq('admin_id', userId);

        // Access & System
        await adminSupabase.from('enrollments').delete().eq('user_id', userId);
        await adminSupabase.from('access_logs').delete().eq('user_id', userId);

        // Notifications (using 'as any' since tables might be missing in types)
        // Notifications (using 'as any' since tables might be missing in types)
        await adminSupabase.from('notifications' as any).delete().eq('user_id', userId);
        await adminSupabase.from('notification_reads' as any).delete().eq('user_id', userId);

        // Delete profile (node)
        await adminSupabase.from('profiles').delete().eq('id', userId);

        // 2. Delete from Supabase Auth (Root)
        const { error: deleteError } = await adminSupabase.auth.admin.deleteUser(userId);

        if (deleteError) {
            log.error({ errorMessage: deleteError.message }, 'Error deleting user from Auth');
            return { error: deleteError.message };
        }

        // 3. Log the action
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
            await adminSupabase.from('access_logs').insert({
                user_id: currentUser.id,
                action: 'delete_user',
                details: {
                    target_user_id: userId
                }
            });
        }

        revalidatePath('/users');
        revalidatePath('/members');
        return { success: true };

    } catch (error: any) {
        log.error({ error: error.message }, 'Exception in deleteUser');
        return { error: error.message || 'Erro ao excluir usuário' };
    }
}

// Optimized Paginated User Fetch
export async function getPaginatedUsers(
    page: number = 1,
    perPage: number = 20,
    search: string = ''
): Promise<ActionResponse<PaginatedUsersResponse>> {
    const adminSupabase = getAdminClient();

    try {
        // Unfortunately, Supabase Auth API doesn't support server-side search/filtering efficiently
        // For filtering by name/email, we often need to rely on the 'profiles' table if it serves as a mirror
        // OR fetch a larger batch from Auth and filter in memory (not ideal for huge datasets)

        // BETTER APPROACH: Query 'profiles' table which SHOULD be synced and supports filtering
        // We will join with auth users via loose coupling or just trust profiles for listing

        let query = adminSupabase
            .from('profiles')
            .select('*', { count: 'exact' });

        if (search) {
            query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }

        // Calculate range
        const from = (page - 1) * perPage;
        const to = from + perPage - 1;

        query = query.range(from, to).order('full_name', { ascending: true });

        const { data: profiles, error, count } = await query;

        if (error) {
            log.error({ error: error.message }, 'Error listing profiles');
            return { error: 'Erro ao listar usuários' };
        }

        // Map profiles to standard UserData format
        // Note: Profiles might miss some auth metadata (like last_sign_in), but for the list view it's often enough.
        // If we strictly need last_sign_in, we'd need to fetch auth users, but that doesn't support search well.
        // For now, we return profile data which is faster.
        const users: UserData[] = profiles.map(p => ({
            id: p.id,
            email: p.email || '',
            created_at: new Date().toISOString(), // 'updated_at' missing in DB schema, fallback to now
            last_sign_in_at: undefined, // details page can fetch this
            user_metadata: {
                name: p.full_name || '',
                role: p.role || 'member',
                avatar_url: p.avatar_url || ''
            },
            app_metadata: {}
        }));

        return {
            data: {
                users,
                total: count || 0,
                page,
                perPage,
                totalPages: Math.ceil((count || 0) / perPage)
            }
        };

    } catch (error: any) {
        log.error({ error: error.message }, 'Exception in getPaginatedUsers');
        return { error: 'Erro ao carregar usuários' };
    }
}

// Update user name action
export async function updateUserName(userId: string, newName: string) {
    try {
        await requireAdmin();
        const adminSupabase = getAdminClient();
        const supabase = await createClient(); // For logging

        // Validate input
        if (!newName || newName.trim().length < 2) {
            return { error: 'O nome deve ter pelo menos 2 caracteres' };
        }

        // 1. Update Profile (DB)
        const { error: profileError } = await adminSupabase
            .from('profiles')
            .update({ full_name: newName })
            .eq('id', userId);

        if (profileError) {
            log.error({ errorMessage: profileError.message }, 'Error updating profile name');
            return { error: 'Erro ao atualizar perfil' };
        }

        // 2. Update Auth Metadata (Supabase Auth)
        const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
            user_metadata: { name: newName }
        });

        if (authError) {
            log.error({ errorMessage: authError.message }, 'Error updating auth metadata');
            return { error: 'Erro ao atualizar conta de usuário' };
        }

        // 3. Log Action
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
            await adminSupabase.from('access_logs').insert({
                user_id: currentUser.id,
                action: 'update_user_profile',
                details: {
                    target_user_id: userId,
                    new_name: newName
                }
            });
        }

        revalidatePath(`/users/${userId}/manage`);
        revalidatePath('/users');
        return { success: true };

    } catch (error: any) {
        log.error({ error: error.message }, 'Exception in updateUserName');
        return { error: error.message || 'Erro ao atualizar nome' };
    }
}
