'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { checkLoginRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validation/schemas';
import { log } from '@/lib/logger';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function loginAction(formData: FormData) {
    const data = Object.fromEntries(formData);
    const email = data.email as string;

    // 1. Rate Limiting
    if (email && !checkLoginRateLimit(`email:${email}`)) {
        log.warn({ email }, 'Login rate limit exceeded for email');

        // Log to database
        try {
            const adminDb = await createAdminClient();
            await adminDb.from('access_logs').insert({
                action: 'login_rate_limited',
                details: { email },
                created_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to log rate limit error', err);
        }

        return { error: 'Muitas tentativas. Aguarde 15 minutos.' };
    }

    // 2. Input Validation
    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorMessage = (validationResult.error as any).issues?.[0]?.message || 'Erro de validação';
        return { error: errorMessage };
    }

    const password = data.password as string;

    const supabase = await createClient();

    // 3. Authenticate with Supabase
    const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        log.warn({ email, error: error.message }, 'Login failed');

        // Log to database using Admin Client to bypass RLS if needed, or ensuring we can write
        try {
            const adminDb = await createAdminClient();
            await adminDb.from('access_logs').insert({
                action: 'login_error',
                details: { email, error: error.message, reason: 'invalid_credentials' },
                created_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to log login error', err);
        }

        return { error: 'Credenciais inválidas.' };
    }

    if (authData.user) {
        // Log successful login
        log.info({ userId: authData.user.id }, 'User logged in successfully');

        // We also log success here to ensure we capture it on the server side reliably
        try {
            const adminDb = await createAdminClient();
            await adminDb.from('access_logs').insert({
                user_id: authData.user.id,
                action: 'login',
                details: { email, method: 'password' },
                created_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to log login success', err);
        }
    }

    // 4. Determine redirect based on role
    const role = authData.user?.user_metadata?.role;
    const redirectPath = role === 'admin' ? '/dashboard' : '/members';

    revalidatePath('/', 'layout');

    return { success: true, redirectUrl: redirectPath };
}
