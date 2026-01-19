'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

import { ActionResponse } from '@/types/app';
import { Tables, TablesInsert, Json } from '@/types/supabase';
import { requireAdmin } from '@/lib/auth-guard';
import { log } from '@/lib/logger';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { createPortalSchema } from '@/lib/validation/schemas';

function logDebug(message: string, data?: unknown) {
    // console.log(`[DEBUG] ${message}`, data || '');
}

export async function createPortal(data: {
    name: string;
    description: string;
    support_email?: string;
    support_external_url?: string | null;
    theme?: string;
    is_external_domain?: number;
    theme_settings?: Record<string, unknown>;
    comments_settings?: Record<string, unknown>;
    image_url?: string | null;
}): Promise<ActionResponse<{ portal: Tables<'portals'> }>> {
    log.info({ portalName: data.name }, 'Starting createPortal');

    // 1. Rate Limiting
    if (!checkApiRateLimit('portal_creation')) {
        return { error: 'Muitas requisições. Tente novamente em alguns minutos.' };
    }

    // 2. Input Validation
    const validationResult = createPortalSchema.safeParse(data);
    if (!validationResult.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: (validationResult.error as any).issues?.[0]?.message || 'Erro de validação' };
    }

    let adminSupabase;
    let user;

    try {
        user = await requireAdmin();
        adminSupabase = await createAdminClient();
    } catch (err: any) {
        log.error({ errorMessage: err.message }, 'Unauthorized Create Portal');
        return { error: 'Não autorizado' };
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
                settings: settings as unknown as Json, // Cast to Json for Supabase compatibility
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

        // Log the action
        await adminSupabase.from('access_logs').insert({
            user_id: user.id,
            action: 'create_portal',
            details: {
                portal_id: newPortal.id,
                portal_name: data.name
            }
        });

        revalidatePath('/portals');
        revalidatePath('/dashboard');
        return { data: { portal: newPortal } };
    } catch (error: any) {
        // Log error
        if (user) {
            await adminSupabase.from('access_logs').insert({
                user_id: user.id,
                action: 'error',
                details: {
                    action_attempted: 'create_portal',
                    error_message: error.message
                }
            });
        }
        logDebug('Catch Error in createPortal', error.message);
        console.error('Error in createPortal:', error);
        return { error: 'Erro ao criar portal (Exception)' };
    }
}

export async function getPresignedUrl(fileName: string, fileType: string) {
    try {
        await requireAdmin();
    } catch {
        return { error: 'Unauthorized' };
    }
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

export async function getPortal(portalId: string): Promise<ActionResponse<{ portal: Tables<'portals'> }>> {
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

        return { data: { portal: data } };
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
        image_url?: string;
        settings: {
            primary_color?: string;
            secondary_color?: string;
            banner_url?: string; // This is the same as image_url usually, or specific to internal banner
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

    // 1. Rate Limiting
    if (!checkApiRateLimit('portal_update')) {
        return { error: 'Muitas requisições. Tente novamente em alguns minutos.' };
    }

    let user;
    try {
        user = await requireAdmin();
        const adminSupabase = await createAdminClient();

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
        } as unknown as Json; // Cast to Json for Supabase compatibility

        const { error: updateError } = await adminSupabase
            .from('portals')
            .update({
                name: data.name,
                description: data.description || '',
                image_url: data.settings.banner_url || data.image_url || null, // Update image_url with banner_url
                settings: mergedSettings,
            })
            .eq('id', portalId);

        if (updateError) {
            logDebug('Error updating portal settings', updateError);
            return { error: updateError.message };
        }

        logDebug('Portal settings updated successfully');

        // Log the action
        await adminSupabase.from('access_logs').insert({
            user_id: user.id,
            action: 'update_portal',
            details: {
                portal_id: portalId,
                portal_name: data.name
            }
        });

        revalidatePath(`/portals/${portalId}`);
        revalidatePath(`/portals/${portalId}/settings`);
        revalidatePath('/portals');

        return { success: true };
    } catch (error: any) {
        logDebug('Exception in updatePortalSettings', error.message);
        return { error: 'Erro ao atualizar configurações' };
    }
}
