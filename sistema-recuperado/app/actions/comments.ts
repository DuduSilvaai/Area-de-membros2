'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-guard';
import { log } from '@/lib/logger';

// Get Supabase configuration from environment only (no filesystem fallback)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Strict check for environment variables
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Missing Supabase Environment Variables for Admin Client');
}

const supabaseAdmin = createClient(
    supabaseUrl || '',
    supabaseServiceKey || ''
);

// Helper to recursively delete a comment and its descendants
async function recursiveDelete(commentId: string) {
    // 1. Fetch direct children (replies)
    const { data: replies } = await supabaseAdmin
        .from('comments')
        .select('id')
        .eq('parent_id', commentId);

    if (replies && replies.length > 0) {
        // Recursively delete children first
        for (const reply of replies) {
            await recursiveDelete(reply.id);
        }
    }

    // 2. Delete likes for this specific comment
    const { error: likesError } = await supabaseAdmin
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId);

    if (likesError) {
        console.error(`Error deleting likes for comment ${commentId}:`, likesError);
    }

    // 3. Delete the comment itself
    const { error: deleteError, count } = await supabaseAdmin
        .from('comments')
        .delete({ count: 'exact' })
        .eq('id', commentId);

    if (deleteError) {
        throw new Error(`Error deleting comment ${commentId}: ${deleteError.message}`);
    }

    // If successful but count is 0, it means it wasn't found (maybe already deleted or wrong ID)
    if (count === 0) {
        // We throw a specific error, but we log it as a warning
        throw new Error('Comentário não encontrado no banco de dados. Pode já ter sido excluído.');
    }
}

export async function deleteComment(commentId: string) {
    // Verify caller is an admin
    try {
        await requireAdmin();
    } catch (error: any) {
        return { success: false, error: 'Não autorizado: Apenas administradores podem excluir comentários' };
    }

    // Validate commentId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(commentId)) {
        return { success: false, error: 'ID de comentário inválido' };
    }

    // Fail Fast if env is missing
    if (!supabaseUrl || !supabaseServiceKey) {
        return {
            success: false,
            error: 'Erro Crítico: Configuração do servidor incompleta.'
        };
    }

    try {
        log.info({ commentId }, 'Admin attempting to delete comment');
        await recursiveDelete(commentId);

        // Verification step
        const { data: check } = await supabaseAdmin
            .from('comments')
            .select('id')
            .eq('id', commentId)
            .single();

        if (check) {
            log.error({ commentId }, 'Comment still exists after delete attempt');
            return { success: false, error: 'Erro ao excluir comentário. Tente novamente.' };
        }

        log.info({ commentId }, 'Comment deleted successfully');

        // Revalidate paths
        revalidatePath('/members/[portalId]/lesson/[lessonId]');
        revalidatePath('/comments');
        revalidatePath('/');

        return { success: true };
    } catch (error: any) {
        log.error({ commentId, errorMessage: error.message }, 'Failed to delete comment');
        return { success: false, error: error.message || 'Failed to delete comment tree' };
    }
}
