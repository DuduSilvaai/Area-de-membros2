

import { headers } from 'next/headers';
import { log } from '@/lib/logger';
import { checkApiRateLimit } from '@/lib/rate-limit';

// Padrões suspeitos em inputs que podem indicar ataques
const SUSPICIOUS_PATTERNS = [
    /<script\b/i,                    // XSS script tags
    /javascript:/i,                   // XSS via URL scheme
    /on\w+\s*=/i,                     // Event handlers (onclick, onerror, etc)
    /\bunion\s+select\b/i,           // SQL Injection
    /\bselect\s+\*\s+from\b/i,       // SQL Injection
    /\bdrop\s+table\b/i,             // SQL Injection
    /\bdelete\s+from\b/i,            // SQL Injection
    /\binsert\s+into\b/i,            // SQL Injection
    /--\s*$/,                         // SQL Comment
    /\/\*.*\*\//,                     // SQL Block Comment
    /\$\{[^}]+\}/,                    // Template injection
    /__proto__/,                      // Prototype pollution
    /constructor\s*\[/,               // Prototype pollution
    /\beval\s*\(/,                    // Code execution
    /\bFunction\s*\(/,                // Code execution
    /<iframe/i,                       // Frame injection
    /<object/i,                       // Object injection
    /<embed/i,                        // Embed injection
    /<svg.*onload/i,                  // SVG XSS
];

// IPs conhecidos como suspeitos (pode ser expandido com integração de threat intelligence)
const suspiciousIPs = new Set<string>();

/**
 * Verifica input para padrões maliciosos conhecidos
 */
export function containsSuspiciousPatterns(input: unknown): boolean {
    if (typeof input === 'string') {
        return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
    }

    if (Array.isArray(input)) {
        return input.some(item => containsSuspiciousPatterns(item));
    }

    if (input && typeof input === 'object') {
        return Object.values(input).some(value => containsSuspiciousPatterns(value));
    }

    return false;
}

/**
 * Obtém IP do cliente de forma segura
 * Suporta proxies reversos e CDNs como Cloudflare
 */
export async function getClientIP(): Promise<string> {
    const headersList = await headers();

    // Ordem de prioridade para detecção de IP (do mais confiável para menos)
    const ipHeaders = [
        'cf-connecting-ip',    // Cloudflare
        'x-real-ip',           // Nginx
        'x-forwarded-for',     // Standard proxy header
        'x-client-ip',         // Apache
    ];

    for (const header of ipHeaders) {
        const value = headersList.get(header);
        if (value) {
            // x-forwarded-for pode conter múltiplos IPs (client, proxy1, proxy2...)
            const ip = value.split(',')[0].trim();
            // Validação básica de formato IP
            if (/^[\d.:a-f]+$/i.test(ip) && ip.length <= 45) {
                return ip;
            }
        }
    }

    return 'unknown';
}

/**
 * Obtém User-Agent do cliente
 */
export async function getClientUserAgent(): Promise<string> {
    const headersList = await headers();
    return headersList.get('user-agent') || 'unknown';
}

/**
 * Middleware de segurança para server actions
 * Verifica rate limits e padrões suspeitos em inputs
 */
export async function securityCheck(options?: {
    rateLimit?: boolean;
    checkSuspicious?: boolean;
    input?: unknown;
    action?: string;
}): Promise<{ passed: boolean; error?: string; clientIP?: string }> {
    const { rateLimit = true, checkSuspicious = true, input, action } = options || {};

    const clientIP = await getClientIP();

    // Verificar se IP está marcado como suspeito
    if (suspiciousIPs.has(clientIP)) {
        log.warn({ clientIP, action }, 'Request from suspicious IP blocked');
        return { passed: false, error: 'Acesso temporariamente bloqueado.', clientIP };
    }

    // Rate limiting
    if (rateLimit && !checkApiRateLimit(clientIP)) {
        log.warn({ clientIP, action }, 'Rate limit exceeded');
        return { passed: false, error: 'Muitas requisições. Tente novamente em alguns minutos.', clientIP };
    }

    // Verificar padrões suspeitos no input
    if (checkSuspicious && input && containsSuspiciousPatterns(input)) {
        const userAgent = await getClientUserAgent();
        log.warn({
            clientIP,
            userAgent,
            action,
            inputPreview: JSON.stringify(input).slice(0, 200)
        }, 'Suspicious input pattern detected');

        // Marcar IP como suspeito para monitoramento
        markSuspicious(clientIP);

        return { passed: false, error: 'Conteúdo inválido detectado.', clientIP };
    }

    return { passed: true, clientIP };
}

/**
 * Marca um IP como suspeito para monitoramento
 * IPs suspeitos são bloqueados temporariamente
 */
export function markSuspicious(identifier: string): void {
    suspiciousIPs.add(identifier);

    // Remover da lista após 1 hora
    setTimeout(() => {
        suspiciousIPs.delete(identifier);
    }, 60 * 60 * 1000);
}

/**
 * Verifica se IP é suspeito
 */
export function isSuspicious(identifier: string): boolean {
    return suspiciousIPs.has(identifier);
}

/**
 * Remove IP da lista de suspeitos (após verificação manual)
 */
export function clearSuspicious(identifier: string): void {
    suspiciousIPs.delete(identifier);
}

/**
 * Log de atividade de segurança estruturado
 */
export async function logSecurityEvent(event: {
    type: 'login_attempt' | 'login_success' | 'login_failure' | 'suspicious_activity' |
    'rate_limit' | 'access_denied' | 'password_reset' | 'account_lockout' |
    'csrf_failure' | 'invalid_input';
    userId?: string;
    details?: Record<string, unknown>;
}): Promise<void> {
    const clientIP = await getClientIP();
    const userAgent = await getClientUserAgent();

    log.info({
        securityEvent: event.type,
        clientIP,
        userAgent,
        userId: event.userId,
        timestamp: new Date().toISOString(),
        ...event.details
    }, `Security event: ${event.type}`);
}
