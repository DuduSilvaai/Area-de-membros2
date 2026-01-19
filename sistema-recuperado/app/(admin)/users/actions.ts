'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { EnrollmentPermissions } from '@/types/enrollment';
import { revalidatePath } from 'next/cache';

// Helper to get admin client with service role
function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
}

export async function upsertEnrollment(
    userId: string,
    portalId: string,
    permissions: EnrollmentPermissions
) {
    const supabase = await createClient();
    const adminSupabase = getAdminClient();

    console.log('Upserting enrollment for user:', userId, 'portal:', portalId, 'permissions:', permissions);

    // Get current user for enrolled_by field
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
        console.log('No current user found');
        return { error: 'Não autenticado' };
    }

    console.log('Current user:', currentUser.id);

    const now = new Date().toISOString();

    // Temporarily remove enrolled_by until migration is run
    const enrollmentData = {
        user_id: userId,
        portal_id: portalId,
        permissions: permissions as any,
        enrolled_at: now,
        // enrolled_by: currentUser.id, // Commented out until migration
        is_active: true
    } as any; // Type assertion to handle potential updated_at field

    console.log('Enrollment data to upsert:', enrollmentData);

    const { data, error } = await adminSupabase
        .from('enrollments')
        .upsert(enrollmentData, {
            onConflict: 'user_id,portal_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting enrollment:', error);
        return { error: error.message };
    }

    console.log('Enrollment upserted successfully:', data);

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
    } catch (e) {
        // This is just to trigger realtime notifications, ignore errors
        console.log('Realtime trigger completed');
    }

    return { data };
}

export async function deleteEnrollment(userId: string, portalId: string) {
    const adminSupabase = getAdminClient();

    console.log('Soft-deleting enrollment for user:', userId, 'portal:', portalId);

    // Use soft-delete instead of hard-delete to maintain data integrity
    // and ensure realtime subscriptions work properly
    const { data, error } = await adminSupabase
        .from('enrollments')
        .update({
            is_active: false
        } as any) // Type assertion to handle updated_at field
        .eq('user_id', userId)
        .eq('portal_id', portalId)
        .select()
        .single();

    if (error) {
        console.error('Error soft-deleting enrollment:', error);
        return { error: error.message };
    }

    console.log('Enrollment soft-deleted successfully:', data);

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
    } catch (e) {
        console.log('Realtime trigger completed');
    }

    return { success: true };
}

export async function getUserEnrollments(userId: string) {
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
        console.error('Error fetching enrollments:', error);
        return { error: error.message };
    }

    return { data };
}

export async function createUser(data: {
    name: string;
    email: string;
    password?: string;
    role: string;
}) {
    const adminSupabase = getAdminClient();

    // 1. Create user in Supabase Auth
    const { data: newUser, error } = await adminSupabase.auth.admin.createUser({
        email: data.email,
        password: data.password || 'Mudar123!', // Default password if not provided
        email_confirm: true, // Auto-confirm
        user_metadata: {
            name: data.name,
            role: data.role === 'admin' ? 'admin' : 'member' // Normalize role for consistency
        }
    });

    if (error) {
        console.error('Error creating user:', error);
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
            details: {
                created_user_id: newUser.user?.id,
                created_user_email: data.email,
                created_user_role: data.role
            }
        });
    }

    revalidatePath('/users');
    return { data: newUser };
}

// New function to reset user password
export async function resetUserPassword(userId: string, newPassword: string) {
    const adminSupabase = getAdminClient();

    const { data, error } = await adminSupabase.auth.admin.updateUserById(userId, {
        password: newPassword
    });

    if (error) {
        console.error('Error resetting password:', error);
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
    const adminSupabase = getAdminClient();

    const { data, error } = await adminSupabase.auth.admin.updateUserById(userId, {
        ban_duration: disabled ? '876000h' : 'none' // ~100 years or none
    });

    if (error) {
        console.error('Error toggling user status:', error);
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

        // Get all portals
        const { data: allPortals, error: portalsError } = await adminSupabase
            .from('portals')
            .select('*');

        // Get active portals only
        const activePortals = allPortals?.filter(p => p.is_active) || [];

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
            .select('*')
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
            const updates = batch.map(async (user) => {
                if (user.user_metadata?.name) {
                    const { error } = await adminSupabase
                        .from('profiles')
                        .upsert({
                            id: user.id,
                            email: user.email,
                            full_name: user.user_metadata.name,
                            role: user.user_metadata.role === 'admin' ? 'admin' : 'member'
                        });

                    if (!error) updatedCount++;
                }
            });
            await Promise.all(updates);
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
