'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { log } from '@/lib/logger';
import { checkApiRateLimit } from '@/lib/rate-limit';
import { createModuleSchema, createContentSchema } from '@/lib/validation/schemas';

/**
 * Reorder multiple modules by updating their order_index
 */
export async function reorderModules(updates: { id: string; order_index: number; parent_module_id?: string | null }[]) {
    if (!checkApiRateLimit('content_update')) return { error: 'Muitas requisições.' };
    try {
        await requireAdmin();
        const adminSupabase = await createAdminClient();

        // Update each module's order_index and optionally parent_module_id
        const updatePromises = updates.map(({ id, order_index, parent_module_id }) => {
            const updateData: any = { order_index };
            if (parent_module_id !== undefined) {
                updateData.parent_module_id = parent_module_id;
            }

            return adminSupabase
                .from('modules')
                .update(updateData)
                .eq('id', id);
        });

        const results = await Promise.all(updatePromises);

        // Check for errors
        const error = results.find(r => r.error);
        if (error?.error) {
            console.error('Error reordering modules:', error.error);
            return { error: error.error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Error in reorderModules');
        return { error: 'Erro ao reordenar módulos' };
    }
}

/**
 * Update a module's parent (move it in hierarchy)
 */
export async function updateModuleParent(moduleId: string, newParentId: string | null) {
    try {
        await requireAdmin();
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('modules')
            .update({ parent_module_id: newParentId })
            .eq('id', moduleId);

        if (error) {
            log.error({ error: error.message }, 'Error updating module parent');
            return { error: error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error) {
        console.error('Error in updateModuleParent:', error);
        return { error: 'Erro ao mover módulo' };
    }
}

/**
 * Reorder contents within a module
 */
export async function reorderContents(updates: { id: string; order_index: number }[]) {
    try {
        await requireAdmin();
        const adminSupabase = await createAdminClient();
        const updatePromises = updates.map(({ id, order_index }) =>
            adminSupabase
                .from('contents')
                .update({ order_index })
                .eq('id', id)
        );

        const results = await Promise.all(updatePromises);

        const error = results.find(r => r.error);
        if (error?.error) {
            console.error('Error reordering contents:', error.error);
            return { error: error.error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Error in reorderContents');
        return { error: 'Erro ao reordenar conteúdos' };
    }
}

/**
 * Delete a module (cascade will handle children and contents)
 */
export async function deleteModule(moduleId: string) {
    if (!checkApiRateLimit('content_update')) return { error: 'Muitas requisições.' };
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado' };
    }

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();

    try {
        const { error } = await adminSupabase
            .from('modules')
            .delete()
            .eq('id', moduleId);

        if (error) {
            console.error('Error deleting module:', error);
            return { error: error.message };
        }

        // Log the action
        if (user) {
            await adminSupabase.from('access_logs').insert({
                user_id: user.id,
                action: 'delete_module',
                details: { module_id: moduleId }
            });
        }

        revalidatePath('/admin/contents');
        return { success: true };
        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Error in deleteModule');
        return { error: 'Erro ao excluir módulo' };
    }
}

/**
 * Update a module's title
 */
export async function updateModuleTitle(moduleId: string, title: string) {
    if (!checkApiRateLimit('content_update')) return { error: 'Muitas requisições.' };
    try {
        await requireAdmin();
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('modules')
            .update({ title: title.trim() })
            .eq('id', moduleId);

        if (error) {
            console.error('Error updating module title:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Error in updateModuleTitle');
        return { error: 'Erro ao atualizar título' };
    }
}

/**
 * Create a new module with optional parent
 */
export async function createModule(data: {
    title: string;
    description?: string;
    portal_id: string;
    parent_module_id?: string | null;
    order_index?: number;
    is_released?: boolean;
    release_date?: string | null;
    image_url?: string | null;
}) {
    // 1. Rate Limiting
    if (!checkApiRateLimit('content_creation')) {
        return { error: 'Muitas requisições. Tente novamente em alguns minutos.' };
    }

    // 2. Input Validation
    const validationResult = createModuleSchema.safeParse(data);
    if (!validationResult.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: (validationResult.error as any).issues?.[0]?.message || 'Erro de validação' };
    }

    // 3. Admin Check
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado' };
    }

    const adminSupabase = await createAdminClient();

    const insertData = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        portal_id: data.portal_id,
        parent_module_id: data.parent_module_id || null,
        order_index: data.order_index ?? 0,
        is_active: true,
        is_released: data.is_released ?? true,
        release_date: data.release_date || null,
        image_url: data.image_url || null
    };

    console.log('🔵 [SERVER] createModule - Dados a inserir:', JSON.stringify(insertData, null, 2));

    try {
        const { data: newModule, error } = await adminSupabase
            .from('modules')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('❌ [SERVER] Erro Supabase ao criar módulo:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return { error: `${error.message} (Código: ${error.code})${error.hint ? ' - Dica: ' + error.hint : ''}` };
        }

        // Log the action
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await adminSupabase.from('access_logs').insert({
                user_id: user.id,
                action: 'create_module',
                details: {
                    module_id: newModule.id,
                    module_title: data.title,
                    portal_id: data.portal_id
                }
            });
        }

        log.info({ moduleId: newModule.id }, 'Module created successfully');
        revalidatePath('/', 'layout');
        return { data: newModule, success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Exception in createModule');
        return { error: error?.message || 'Erro desconhecido ao criar módulo' };
    }
}

/**
 * Update a module's details
 */
export async function updateModule(id: string, data: {
    title?: string;
    description?: string;
    image_url?: string | null;
    is_released?: boolean;
    release_date?: string | null;
}) {
    if (!checkApiRateLimit('content_update')) return { error: 'Muitas requisições.' };
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado' };
    }

    const adminSupabase = await createAdminClient();

    try {
        const { error } = await adminSupabase
            .from('modules')
            .update({
                title: data.title?.trim(),
                description: data.description?.trim() || null,
                image_url: data.image_url || null,
                is_released: data.is_released ?? true,
                release_date: data.release_date || null
            })
            .eq('id', id);

        if (error) {
            console.error('❌ [SERVER] Erro ao atualizar módulo:', error);
            return { error: error.message };
        }

        // Verify update
        const { data: updatedModule } = await adminSupabase
            .from('modules')
            .select('*')
            .eq('id', id)
            .single();

        revalidatePath('/', 'layout'); // Revalidates everything
        return { success: true };
        revalidatePath('/', 'layout'); // Revalidates everything
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Exception in updateModule');
        return { error: error?.message || 'Erro ao atualizar módulo' };
    }
}

/**
 * Delete a content item
 */
export async function deleteContent(contentId: string) {
    if (!checkApiRateLimit('content_update')) return { error: 'Muitas requisições.' };
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado' };
    }

    const supabase = await createClient();
    const adminSupabase = await createAdminClient();

    // Get current user for logging
    const { data: { user } } = await supabase.auth.getUser();

    try {
        const { error } = await adminSupabase
            .from('contents')
            .delete()
            .eq('id', contentId);

        if (error) {
            console.error('Error deleting content:', error);
            return { error: error.message };
        }

        // Log the action
        if (user) {
            await adminSupabase.from('access_logs').insert({
                user_id: user.id,
                action: 'delete_content',
                details: { content_id: contentId }
            });
        }

        revalidatePath('/admin/contents');
        return { success: true };
        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Error in deleteContent');
        return { error: 'Erro ao excluir conteúdo' };
    }
}

/**
 * Update a content's title
 */
export async function updateContentTitle(contentId: string, title: string) {
    if (!checkApiRateLimit('content_update')) return { error: 'Muitas requisições.' };
    try {
        await requireAdmin();
        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('contents')
            .update({ title: title.trim() })
            .eq('id', contentId);

        if (error) {
            console.error('Error updating content title:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error: any) {
        log.error({ error: error.message }, 'Error in updateContentTitle');
        return { error: 'Erro ao atualizar título do conteúdo' };
    }
}

/**
 * Create a new content item
 */
export async function createContent(data: {
    title: string;
    module_id: string;
    content_type: 'video' | 'text' | 'quiz' | 'file' | 'pdf' | 'external';
    order_index?: number;
    video_url?: string;
    content_url?: string;
    duration?: number;
    is_preview?: boolean;
}) {
    // 1. Rate Limiting
    if (!checkApiRateLimit('content_creation')) {
        return { error: 'Muitas requisições. Tente novamente em alguns minutos.' };
    }

    // 2. Input Validation
    const validationResult = createContentSchema.safeParse(data);
    if (!validationResult.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: (validationResult.error as any).issues?.[0]?.message || 'Erro de validação' };
    }

    // 3. Admin Check
    try {
        await requireAdmin();
    } catch (error: any) {
        return { error: 'Não autorizado' };
    }

    const adminSupabase = await createAdminClient();

    const insertData = {
        title: data.title.trim(),
        module_id: data.module_id,
        content_type: data.content_type,
        order_index: data.order_index ?? 0,
        video_url: data.video_url || null,
        content_url: data.content_url || null,
        duration: data.duration || 0,
        is_preview: data.is_preview ?? false,
        is_active: true
    };

    console.log('🔵 [SERVER] createContent - Dados a inserir:', JSON.stringify(insertData, null, 2));

    try {
        const { data: newContent, error } = await adminSupabase
            .from('contents')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('❌ [SERVER] Erro Supabase ao criar conteúdo:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            return { error: `${error.message} (Código: ${error.code})${error.hint ? ' - Dica: ' + error.hint : ''}` };
        }

        // Log the action
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await adminSupabase.from('access_logs').insert({
                user_id: user.id,
                action: 'create_content',
                details: {
                    content_id: newContent.id,
                    content_title: data.title,
                    module_id: data.module_id,
                    content_type: data.content_type
                }
            });
        }

        console.log('✅ [SERVER] Conteúdo criado com sucesso:', newContent);
        revalidatePath('/admin/contents');
        return { data: newContent, success: true };
    } catch (error: any) {
        console.error('❌ [SERVER] Exception em createContent:', error);
        return { error: error?.message || 'Erro desconhecido ao criar conteúdo' };
    }
}
