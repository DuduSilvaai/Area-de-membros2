'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function logDebug(message: string, data?: any) {
    console.log(`[DEBUG] ${message}`, data || '');
}

export async function createPortal(data: {
    name: string;
    description: string;
    support_email?: string;
    support_external_url?: string | null;
    theme?: string;
    is_external_domain?: number;
    theme_settings?: any;
    comments_settings?: any;
    image_url?: string | null;
}) {
    logDebug('Starting createPortal (Function Entry)', { data_received_name: data.name });

    let adminSupabase;
    let user;

    try {
        const cookieStore = await import('next/headers').then(mod => mod.cookies());
        console.log('[Action] Cookies available:', cookieStore.getAll().map(c => c.name).join(', '));

        adminSupabase = await createAdminClient();
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();
        user = authData.user;
    } catch (err: any) {
        logDebug('CRITICAL: Failed to init clients', err.message);
        return { error: 'Erro interno de inicialização' };
    }

    if (!user) {
        logDebug('CRITICAL: User not authenticated');
        return { error: 'Usuário não autenticado' };
    }

    try {
        // Defaults
        const defaultSettings = {
            support_email: data.support_email || 'suporte@exemplo.com',
            support_external_url: data.support_external_url || '',
            theme: data.theme || 'modern',
            is_external_domain: data.is_external_domain === 1,
            theme_settings: data.theme_settings || { default_color: '#000000' },
            comments_settings: data.comments_settings || { day_limit: 0, character_limit: 500, automatically_publish: true }
        };

        const settings = defaultSettings;

        logDebug('Settings prepared', settings);

        // 1. Create Portal
        const { data: newPortal, error: portalError } = await adminSupabase
            .from('portals')
            .insert([{
                name: data.name,
                description: data.description,
                image_url: data.image_url,
                settings: settings,
                is_active: true,
                created_by: user.id
            }])
            .select()
            .single();

        if (portalError) {
            logDebug('Supabase INSERT Error', portalError);
            console.error('Error creating portal:', portalError);
            return { error: `Erro banco de dados: ${portalError.message}` };
        }

        logDebug('Portal created successfully', newPortal);

        // 2. Create Admin Enrollment for Creator
        const { error: enrollmentError } = await adminSupabase
            .from('enrollments')
            .insert([{
                user_id: user.id,
                portal_id: newPortal.id,
                permissions: { access_all: true, allowed_modules: [] },
                is_active: true,
                enrolled_by: user.id
            }]);

        if (enrollmentError) {
            logDebug('Error creating initial enrollment', enrollmentError);
            // We don't fail the whole request but we log it. User might see empty list but portal exists.
        } else {
            logDebug('Enrollment created successfully');
        }

        revalidatePath('/portals');
        revalidatePath('/dashboard');
        return { success: true, portal: newPortal };
    } catch (error: any) {
        logDebug('Catch Error in createPortal', error.message);
        console.error('Error in createPortal:', error);
        return { error: 'Erro ao criar portal (Exception)' };
    }
}

export async function getPresignedUrl(fileName: string, fileType: string) {
    const adminSupabase = await createAdminClient();

    // Ensure unique path
    const filePath = `portals/${Math.random().toString(36).substring(2)}_${Date.now()}_${fileName}`;

    const { data, error } = await adminSupabase.storage
        .from('course-content')
        .createSignedUploadUrl(filePath);

    if (error) {
        console.error('Error creating signed url:', error);
        return { error: error.message };
    }

    return { signedUrl: data.signedUrl, path: filePath, token: data.token };
}

export async function getPortal(portalId: string) {
    logDebug('getPortal called', { portalId });

    try {
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
            return { error: 'Usuário não autenticado' };
        }

        const { data, error } = await supabase
            .from('portals')
            .select('*')
            .eq('id', portalId)
            .single();

        if (error) {
            logDebug('Error fetching portal', error);
            return { error: error.message };
        }

        return { portal: data };
    } catch (error: any) {
        logDebug('Exception in getPortal', error.message);
        return { error: 'Erro ao buscar portal' };
    }
}

export async function updatePortalSettings(
    portalId: string,
    data: {
        name: string;
        description?: string;
        slug?: string;
        settings: {
            primary_color?: string;
            secondary_color?: string;
            banner_url?: string;
            logo_url?: string;
            logo_dark_url?: string;
            favicon_url?: string;
            support_email?: string;
            support_whatsapp?: string;
            theme_mode?: 'light' | 'dark';
        };
    }
) {
    logDebug('updatePortalSettings called', { portalId, data });

    try {
        const adminSupabase = await createAdminClient();
        const supabase = await createClient();
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
            return { error: 'Usuário não autenticado' };
        }

        // Fetch current settings to merge
        const { data: currentPortal, error: fetchError } = await adminSupabase
            .from('portals')
            .select('settings')
            .eq('id', portalId)
            .single();

        if (fetchError) {
            logDebug('Error fetching current portal settings', fetchError);
            return { error: fetchError.message };
        }

        // Merge existing settings with new settings
        const existingSettings = (currentPortal?.settings as Record<string, unknown>) || {};
        const mergedSettings = {
            ...existingSettings,
            ...data.settings,
        };

        const { error: updateError } = await adminSupabase
            .from('portals')
            .update({
                name: data.name,
                description: data.description || '',
                settings: mergedSettings,
            })
            .eq('id', portalId);

        if (updateError) {
            logDebug('Error updating portal settings', updateError);
            return { error: updateError.message };
        }

        logDebug('Portal settings updated successfully');
        revalidatePath(`/portals/${portalId}`);
        revalidatePath(`/portals/${portalId}/settings`);
        revalidatePath('/portals');

        return { success: true };
    } catch (error: any) {
        logDebug('Exception in updatePortalSettings', error.message);
        return { error: 'Erro ao atualizar configurações' };
    }
}
