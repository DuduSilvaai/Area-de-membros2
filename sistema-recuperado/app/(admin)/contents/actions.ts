'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Reorder multiple modules by updating their order_index
 */
export async function reorderModules(updates: { id: string; order_index: number; parent_module_id?: string | null }[]) {
    const adminSupabase = await createAdminClient();

    try {
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
    } catch (error) {
        console.error('Error in reorderModules:', error);
        return { error: 'Erro ao reordenar módulos' };
    }
}

/**
 * Update a module's parent (move it in hierarchy)
 */
export async function updateModuleParent(moduleId: string, newParentId: string | null) {
    const adminSupabase = await createAdminClient();

    try {
        const { error } = await adminSupabase
            .from('modules')
            .update({ parent_module_id: newParentId })
            .eq('id', moduleId);

        if (error) {
            console.error('Error updating module parent:', error);
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
    const adminSupabase = await createAdminClient();

    try {
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
    } catch (error) {
        console.error('Error in reorderContents:', error);
        return { error: 'Erro ao reordenar conteúdos' };
    }
}

/**
 * Delete a module (cascade will handle children and contents)
 */
export async function deleteModule(moduleId: string) {
    const adminSupabase = await createAdminClient();

    try {
        const { error } = await adminSupabase
            .from('modules')
            .delete()
            .eq('id', moduleId);

        if (error) {
            console.error('Error deleting module:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteModule:', error);
        return { error: 'Erro ao excluir módulo' };
    }
}

/**
 * Update a module's title
 */
export async function updateModuleTitle(moduleId: string, title: string) {
    const adminSupabase = await createAdminClient();

    try {
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
    } catch (error) {
        console.error('Error in updateModuleTitle:', error);
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
}) {
    const adminSupabase = await createAdminClient();

    try {
        const { data: newModule, error } = await adminSupabase
            .from('modules')
            .insert([{
                title: data.title.trim(),
                description: data.description?.trim() || null,
                portal_id: data.portal_id,
                parent_module_id: data.parent_module_id || null,
                order_index: data.order_index ?? 0,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating module:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/contents');
        return { data: newModule, success: true };
    } catch (error) {
        console.error('Error in createModule:', error);
        return { error: 'Erro ao criar módulo' };
    }
}

/**
 * Delete a content item
 */
export async function deleteContent(contentId: string) {
    const adminSupabase = await createAdminClient();

    try {
        const { error } = await adminSupabase
            .from('contents')
            .delete()
            .eq('id', contentId);

        if (error) {
            console.error('Error deleting content:', error);
            return { error: error.message };
        }

        revalidatePath('/admin/contents');
        return { success: true };
    } catch (error) {
        console.error('Error in deleteContent:', error);
        return { error: 'Erro ao excluir conteúdo' };
    }
}

/**
 * Update a content's title
 */
export async function updateContentTitle(contentId: string, title: string) {
    const adminSupabase = await createAdminClient();

    try {
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
    } catch (error) {
        console.error('Error in updateContentTitle:', error);
        return { error: 'Erro ao atualizar título do conteúdo' };
    }
}
