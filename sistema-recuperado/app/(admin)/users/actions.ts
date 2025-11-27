'use server';

import { createClient, createAdminClient } from '../../../lib/supabase/server';
import { EnrollmentPermissions } from '@/types/enrollment';
import { revalidatePath } from 'next/cache';

export async function upsertEnrollment(
    userId: string,
    portalId: string,
    permissions: EnrollmentPermissions
) {
    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Get current user for enrolled_by field
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
        return { error: 'Não autenticado' };
    }

    const { data, error } = await adminSupabase
        .from('enrollments')
        .upsert({
            user_id: userId,
            portal_id: portalId,
            permissions: permissions as any,
            enrolled_by: currentUser.id,
            is_active: true
        }, {
            onConflict: 'user_id,portal_id'
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting enrollment:', error);
        return { error: error.message };
    }

    revalidatePath(`/admin/users/${userId}/manage`);
    revalidatePath('/admin/users');

    return { data };
}

export async function deleteEnrollment(userId: string, portalId: string) {
    const adminSupabase = await createAdminClient();

    const { error } = await adminSupabase
        .from('enrollments')
        .delete()
        .eq('user_id', userId)
        .eq('portal_id', portalId);

    if (error) {
        console.error('Error deleting enrollment:', error);
        return { error: error.message };
    }

    revalidatePath(`/admin/users/${userId}/manage`);
    revalidatePath('/admin/users');

    return { success: true };
}

export async function getUserEnrollments(userId: string) {
    const adminSupabase = await createAdminClient();

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
