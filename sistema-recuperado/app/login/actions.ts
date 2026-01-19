'use server';

import { createClient } from '@/lib/supabase/server';
import { checkLoginRateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validation/schemas';
import { log } from '@/lib/logger';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const data = Object.fromEntries(formData);

    // 1. Rate Limiting
    // Using IP as identifier (In production, headers().get('x-forwarded-for') is better)
    // Here we use email as a key component to prevent locking out all users from same IP
    const email = data.email as string;

    // Check rate limit by email to prevent brute force on specific accounts
    if (email && !checkLoginRateLimit(`email:${email}`)) {
        log.warn({ email }, 'Login rate limit exceeded for email');
        return { error: 'Muitas tentativas. Aguarde 15 minutos.' };
    }

    // 2. Input Validation
    // 2. Input Validation
    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { error: (validationResult.error as any).issues?.[0]?.message || 'Erro de validação' };
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
        return { error: 'Credenciais inválidas.' };
    }

    if (authData.user) {
        // Log successful login
        log.info({ userId: authData.user.id }, 'User logged in successfully');
    }

    // 4. Determine redirect based on role
    const role = authData.user?.user_metadata?.role;
    const redirectPath = role === 'admin' ? '/dashboard' : '/members';

    // Return success to client for redirection by client (or redirect here)
    // Server actions redirect works by throwing a NEXT_REDIRECT error
    redirect(redirectPath);
}
