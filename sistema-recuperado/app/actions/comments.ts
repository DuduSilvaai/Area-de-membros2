'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

import fs from 'fs';
import path from 'path';

// Force load env if missing (Manual fallback)
const getServiceKey = () => {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        const envPath = path.resolve(process.cwd(), '.env.local');
        if (fs.existsSync(envPath)) {
            const fileContent = fs.readFileSync(envPath, 'utf8');
            const match = fileContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);
            if (match && match[1]) {
                const key = match[1].trim().replace(/^["']|["']$/g, '');
                console.log('[Manual Env] Successfully loaded Service Key from file');
                return key;
            }
        }
    } catch (error) {
        console.error('[Manual Env] Failed to read .env.local:', error);
    }
    return '';
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = getServiceKey();

// Strict check for environment variables
const envCheck = (() => {
    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('CRITICAL: Missing Supabase Environment Variables for Admin Client');
        return false;
    }
    return true;
})();

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
    // Fail Fast if env is missing
    if (!supabaseUrl || !supabaseServiceKey) {
        return {
            success: false,
            error: 'Erro Crítico: Chave de API Service Role ausente. Reinicie o servidor.'
        };
    }

    const keyPrefix = supabaseServiceKey.substring(0, 5) + '...';
    console.log(`[Delete Action] Initialized with Key: ${keyPrefix}`);

    try {
        console.log(`[Delete Action] Attempting delete for ID: ${commentId}`);
        await recursiveDelete(commentId);

        // EXTRA VERIFICATION STEP
        const { data: check, error: checkError } = await supabaseAdmin
            .from('comments')
            .select('id')
            .eq('id', commentId)
            .single();

        if (check) {
            console.error(`[Delete Action] ZOMBIE RECORD: ID ${commentId} still exists after delete!`);
            return { success: false, error: 'Erro Desconhecido: O comentário foi "excluído" mas continua no banco de dados. Verifique constraints ou triggers.' };
        } else {
            console.log(`[Delete Action] Verification Passed: ID ${commentId} is gone.`);
        }

        // Revalidate multiple paths to be safe
        revalidatePath('/members/[portalId]/lesson/[lessonId]');
        revalidatePath('/comments');
        revalidatePath('/');

        return { success: true };
    } catch (error: any) {
        console.error('[Delete Action] Failed:', error);
        return { success: false, error: error.message || 'Failed to delete comment tree' };
    }
}
