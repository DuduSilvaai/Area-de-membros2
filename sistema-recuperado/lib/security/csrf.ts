'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = '__csrf_token';
// Em produção, defina CSRF_SECRET como variável de ambiente
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

/**
 * Gera um token CSRF para o usuário atual
 * O token é armazenado em um cookie HttpOnly e retornado para uso em forms
 */
export async function generateCSRFToken(): Promise<string> {
    const cookieStore = await cookies();

    // Criar token único com timestamp para expiração
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(24).toString('hex');
    const token = `${timestamp}.${randomPart}`;

    // Criar assinatura HMAC para validação
    const hmac = crypto.createHmac('sha256', CSRF_SECRET);
    hmac.update(token);
    const signature = hmac.digest('hex');

    const signedToken = `${token}.${signature}`;

    // Armazenar em cookie HttpOnly (não acessível via JavaScript)
    cookieStore.set(CSRF_COOKIE_NAME, signedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
    });

    // Retornar apenas a parte do token (sem assinatura) para o form
    return token;
}

/**
 * Valida um token CSRF
 * Compara o token do form com o armazenado no cookie
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;

    const cookieStore = await cookies();
    const storedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

    if (!storedToken) return false;

    try {
        const [storedTokenPart, storedSignature] = storedToken.split('.').slice(0, 2).join('.').split('.');
        const fullStoredToken = storedToken.substring(0, storedToken.lastIndexOf('.'));
        const signature = storedToken.substring(storedToken.lastIndexOf('.') + 1);

        // Verificar se o token enviado corresponde ao armazenado
        if (token !== fullStoredToken) return false;

        // Verificar assinatura HMAC
        const hmac = crypto.createHmac('sha256', CSRF_SECRET);
        hmac.update(fullStoredToken);
        const expectedSignature = hmac.digest('hex');

        // Usar comparação de tempo constante para prevenir timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
}

/**
 * Middleware helper para proteger server actions
 * Lança erro se o token CSRF for inválido
 */
export async function requireCSRF(token?: string): Promise<void> {
    if (!token || !(await validateCSRFToken(token))) {
        throw new Error('Requisição inválida. Recarregue a página e tente novamente.');
    }
}

/**
 * Limpa o token CSRF atual (após uso ou logout)
 */
export async function clearCSRFToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(CSRF_COOKIE_NAME);
}
