'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { log } from '@/lib/logger';

// Get Supabase configuration from environment only
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

// Submit or update a rating
export async function submitRating(contentId: string, stars: number) {
    // Validate inputs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contentId)) {
        return { success: false, error: 'ID de conteúdo inválido' };
    }

    if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
        return { success: false, error: 'Avaliação deve ser entre 1 e 5 estrelas' };
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: 'Erro Crítico: Configuração do servidor incompleta.' };
    }

    try {
        // Get current user from service role (we'll pass userId from client)
        // For security, we should get the user from the client-side auth
        // This is a simplified version - in production, verify the session

        const { data, error } = await supabaseAdmin
            .from('ratings')
            .upsert({
                content_id: contentId,
                user_id: '', // Will be set by the caller
                stars,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'content_id,user_id'
            })
            .select('id')
            .single();

        if (error) {
            log.error({ contentId, error: error.message }, 'Failed to submit rating');
            return { success: false, error: 'Erro ao enviar avaliação' };
        }

        log.info({ contentId, stars }, 'Rating submitted successfully');

        revalidatePath('/members/[portalId]/lesson/[lessonId]');

        return { success: true, ratingId: data?.id };
    } catch (error: any) {
        log.error({ contentId, errorMessage: error.message }, 'Failed to submit rating');
        return { success: false, error: error.message || 'Erro ao enviar avaliação' };
    }
}

// Submit or update a rating with userId from client
export async function submitRatingWithUser(contentId: string, userId: string, stars: number) {
    // Validate inputs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contentId) || !uuidRegex.test(userId)) {
        return { success: false, error: 'IDs inválidos' };
    }

    if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
        return { success: false, error: 'Avaliação deve ser entre 1 e 5 estrelas' };
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: 'Erro Crítico: Configuração do servidor incompleta.' };
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('ratings')
            .upsert({
                content_id: contentId,
                user_id: userId,
                stars,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'content_id,user_id'
            })
            .select('id')
            .single();

        if (error) {
            log.error({ contentId, userId, error: error.message }, 'Failed to submit rating');
            return { success: false, error: 'Erro ao enviar avaliação' };
        }

        log.info({ contentId, userId, stars }, 'Rating submitted successfully');

        revalidatePath('/members/[portalId]/lesson/[lessonId]');

        return { success: true, ratingId: data?.id };
    } catch (error: any) {
        log.error({ contentId, errorMessage: error.message }, 'Failed to submit rating');
        return { success: false, error: error.message || 'Erro ao enviar avaliação' };
    }
}

// Submit feedback for a rating
export async function submitFeedback(ratingId: string, text: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ratingId)) {
        return { success: false, error: 'ID de avaliação inválido' };
    }

    if (!text || text.trim().length === 0) {
        return { success: false, error: 'O feedback não pode estar vazio' };
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: 'Erro Crítico: Configuração do servidor incompleta.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('feedback')
            .insert({
                rating_id: ratingId,
                text: text.trim()
            });

        if (error) {
            log.error({ ratingId, error: error.message }, 'Failed to submit feedback');
            return { success: false, error: 'Erro ao enviar feedback' };
        }

        log.info({ ratingId }, 'Feedback submitted successfully');

        return { success: true };
    } catch (error: any) {
        log.error({ ratingId, errorMessage: error.message }, 'Failed to submit feedback');
        return { success: false, error: error.message || 'Erro ao enviar feedback' };
    }
}

// Get user's rating for a content
export async function getUserRating(contentId: string, userId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contentId) || !uuidRegex.test(userId)) {
        return { success: false, error: 'IDs inválidos', rating: null };
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: 'Erro Crítico: Configuração do servidor incompleta.', rating: null };
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('ratings')
            .select('id, stars, created_at, updated_at')
            .eq('content_id', contentId)
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            log.error({ contentId, userId, error: error.message }, 'Failed to get rating');
            return { success: false, error: 'Erro ao buscar avaliação', rating: null };
        }

        return { success: true, rating: data };
    } catch (error: any) {
        log.error({ contentId, errorMessage: error.message }, 'Failed to get rating');
        return { success: false, error: error.message || 'Erro ao buscar avaliação', rating: null };
    }
}

// Get average rating and count for a content (for display)
export async function getContentRatingStats(contentId: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(contentId)) {
        return { success: false, error: 'ID de conteúdo inválido', stats: null };
    }

    if (!supabaseUrl || !supabaseServiceKey) {
        return { success: false, error: 'Erro Crítico: Configuração do servidor incompleta.', stats: null };
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('ratings')
            .select('stars')
            .eq('content_id', contentId);

        if (error) {
            log.error({ contentId, error: error.message }, 'Failed to get rating stats');
            return { success: false, error: 'Erro ao buscar estatísticas', stats: null };
        }

        if (!data || data.length === 0) {
            return { success: true, stats: { average: 0, count: 0 } };
        }

        const total = data.reduce((sum, r) => sum + r.stars, 0);
        const average = total / data.length;

        return {
            success: true,
            stats: {
                average: Math.round(average * 10) / 10,
                count: data.length
            }
        };
    } catch (error: any) {
        log.error({ contentId, errorMessage: error.message }, 'Failed to get rating stats');
        return { success: false, error: error.message || 'Erro ao buscar estatísticas', stats: null };
    }
}
