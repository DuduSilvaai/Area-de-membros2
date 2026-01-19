'use server';

import { createClient } from '@/lib/supabase/server';
import { log } from '@/lib/logger';
import { headers } from 'next/headers';

export async function requestPasswordReset(formData: FormData) {
    try {
        const email = formData.get('email') as string;

        if (!email) {
            return { error: 'Email é obrigatório' };
        }

        const supabase = await createClient();
        const origin = (await headers()).get('origin');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback?next=/reset-password`,
        });

        if (error) {
            // For security, checking if user exists or not via error might expose accounts.
            // But Supabase often limits rate.
            // We should just log detailed error and return generic success or specific error context if needed.
            // Usually we return success to prevent enumeration.
            log.error({ errorMessage: error.message }, 'Error requesting password reset');

            // However, Supabase often returns error for rate limits
            if (error.message.includes('Rate limit')) {
                return { error: 'Muitas tentativas. Aguarde um pouco.' };
            }

            // If generic error, we might want to hide it? Or show it?
            // Show it for now for debugging as requested.
            return { error: error.message };
        }

        return { success: true };

    } catch (error: any) {
        log.error({ error: error.message }, 'Exception in requestPasswordReset');
        return { error: 'Ocorreu um erro. Tente novamente.' };
    }
}
