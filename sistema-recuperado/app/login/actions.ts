'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { checkLoginRateLimitWithLockout, clearRateLimit, applyLockout } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validation/schemas';
import { log } from '@/lib/logger';
import { logSecurityEvent, getClientIP } from '@/lib/security/security-middleware';
import { revalidatePath } from 'next/cache';

// Contador de falhas consecutivas por email (para lockout)
const failedAttempts = new Map<string, number>();

// Limpar contadores antigos periodicamente
setInterval(() => {
    failedAttempts.clear();
}, 60 * 60 * 1000); // Limpar a cada hora

export async function loginAction(formData: FormData) {
    const data = Object.fromEntries(formData);
    const email = (data.email as string)?.toLowerCase().trim();
    const clientIP = await getClientIP();
    const rateLimitKey = `${email}-${clientIP}`;

    // 1. Rate Limiting com proteção contra brute force
    const rateCheck = checkLoginRateLimitWithLockout(rateLimitKey);

    if (!rateCheck.allowed) {
        // Log tentativa bloqueada
        await logSecurityEvent({
            type: 'rate_limit',
            details: {
                email,
                clientIP,
                lockoutRemaining: rateCheck.lockoutRemaining,
                reason: rateCheck.lockoutRemaining ? 'account_lockout' : 'rate_limit'
            }
        });

        // Log to database
        try {
            const adminDb = await createAdminClient();
            await adminDb.from('access_logs').insert({
                action: rateCheck.lockoutRemaining ? 'account_lockout' : 'login_rate_limited',
                details: {
                    email,
                    clientIP,
                    lockoutRemaining: rateCheck.lockoutRemaining
                },
                created_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to log rate limit error', err);
        }

        // Mensagem diferente para lockout vs rate limit simples
        if (rateCheck.lockoutRemaining) {
            const minutes = Math.ceil(rateCheck.lockoutRemaining / 60000);
            return {
                error: `Conta temporariamente bloqueada por segurança. Tente novamente em ${minutes} minutos.`,
                lockout: true,
                lockoutMinutes: minutes
            };
        }

        return { error: 'Muitas tentativas. Aguarde 15 minutos.' };
    }

    // 2. Input Validation
    const validationResult = loginSchema.safeParse(data);
    if (!validationResult.success) {
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
        // Incrementar contador de falhas consecutivas
        const currentFailures = (failedAttempts.get(email) || 0) + 1;
        failedAttempts.set(email, currentFailures);

        // Aplicar lockout após muitas falhas consecutivas
        if (currentFailures >= 10) {
            applyLockout(`login-${rateLimitKey}`);

            await logSecurityEvent({
                type: 'account_lockout',
                details: {
                    email,
                    clientIP,
                    consecutiveFailures: currentFailures,
                    reason: 'brute_force_protection'
                }
            });

            try {
                const adminDb = await createAdminClient();
                await adminDb.from('access_logs').insert({
                    action: 'account_lockout',
                    details: {
                        email,
                        clientIP,
                        consecutiveFailures: currentFailures,
                        reason: 'brute_force_protection'
                    },
                    created_at: new Date().toISOString()
                });
            } catch (err) {
                console.error('Failed to log lockout', err);
            }

            return {
                error: 'Conta bloqueada por segurança devido a múltiplas tentativas falhas. Aguarde 30 minutos.',
                lockout: true,
                lockoutMinutes: 30
            };
        }

        // Log falha de login
        await logSecurityEvent({
            type: 'login_failure',
            details: {
                email,
                clientIP,
                consecutiveFailures: currentFailures,
                remainingAttempts: rateCheck.remainingAttempts
            }
        });

        try {
            const adminDb = await createAdminClient();
            await adminDb.from('access_logs').insert({
                action: 'login_error',
                details: {
                    email,
                    error: 'invalid_credentials', // Não logar mensagem de erro real
                    clientIP,
                    consecutiveFailures: currentFailures
                },
                created_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('Failed to log login error', err);
        }

        // Mensagem genérica para não revelar se o email existe
        // Adicionar alerta se estiver próximo do lockout
        if (currentFailures >= 7) {
            return {
                error: `Credenciais inválidas. Atenção: mais ${10 - currentFailures} tentativas incorretas bloquearão a conta.`,
                warning: true
            };
        }

        return { error: 'Credenciais inválidas.' };
    }

    // Login bem-sucedido - limpar contadores de falha
    failedAttempts.delete(email);
    clearRateLimit(`login-${rateLimitKey}`);

    if (authData.user) {
        await logSecurityEvent({
            type: 'login_success',
            userId: authData.user.id,
            details: { email, clientIP }
        });

        try {
            const adminDb = await createAdminClient();
            await adminDb.from('access_logs').insert({
                user_id: authData.user.id,
                action: 'login',
                details: {
                    email,
                    method: 'password',
                    clientIP
                },
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

