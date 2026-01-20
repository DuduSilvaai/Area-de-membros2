import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Cria cliente Supabase com privilégios de admin (Service Role)
 * ATENÇÃO: Usar APENAS em Server Actions e Server Components
 * NUNCA expor este cliente para o lado do cliente
 */
export const createAdminClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada');
    }

    if (!key) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
    }

    return createClient<Database>(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
};
