/**
 * Rate Limiting em memória local
 * Para produção em escala, considere usar Upstash Redis
 * 
 * Funcionalidades:
 * - Rate limiting básico por janela de tempo
 * - Proteção contra brute force com lockout
 * - Tracking de IPs suspeitos
 */

// Configurações de segurança
const SECURITY_CONFIG = {
    bruteForceThreshold: 3,           // Tentativas antes de mensagem de alerta
    lockoutThreshold: 10,             // Tentativas antes de lockout
    lockoutDurationMs: 30 * 60 * 1000, // 30 minutos de lockout
    suspiciousActivityThreshold: 50    // Requests suspeitas por hora
};

interface RateLimitRecord {
    count: number;
    resetAt: number;
    lockedUntil?: number;
    isBlocked?: boolean;
}

const attempts = new Map<string, RateLimitRecord>();
const suspiciousIPs = new Set<string>();

// Limpar registros expirados periodicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
        // Não apagar se estiver em lockout ativo
        if (record.lockedUntil && now < record.lockedUntil) continue;

        if (now > record.resetAt) {
            attempts.delete(key);
        }
    }
}, 60000); // Limpar a cada 1 minuto

/**
 * Verifica se o rate limit foi excedido
 * @param key - Identificador único (ex: "login-192.168.1.1")
 * @param max - Número máximo de tentativas
 * @param windowMs - Janela de tempo em milissegundos
 * @returns true se permitido, false se bloqueado
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
    const now = Date.now();
    const record = attempts.get(key);

    // Verificar lockout ativo
    if (record?.lockedUntil && now < record.lockedUntil) {
        return false;
    }

    // Primeiro acesso ou janela expirada
    if (!record || now > record.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    // Limite excedido
    if (record.count >= max) {
        return false;
    }

    // Incrementar contador
    record.count++;
    return true;
}

/**
 * Verifica se um identificador está em lockout
 */
export function isLockedOut(key: string): { locked: boolean; remainingMs?: number } {
    const record = attempts.get(key);
    if (!record?.lockedUntil) return { locked: false };

    const now = Date.now();
    if (now < record.lockedUntil) {
        return { locked: true, remainingMs: record.lockedUntil - now };
    }

    // Lockout expirado, limpar
    record.lockedUntil = undefined;
    record.isBlocked = false;

    return { locked: false };
}

/**
 * Aplica lockout a um identificador
 */
export function applyLockout(key: string): void {
    const now = Date.now();
    const record = attempts.get(key) || { count: 0, resetAt: now + SECURITY_CONFIG.lockoutDurationMs };

    record.lockedUntil = now + SECURITY_CONFIG.lockoutDurationMs;
    record.isBlocked = true;
    record.resetAt = Math.max(record.resetAt, record.lockedUntil);

    attempts.set(key, record);
}

/**
 * Rate limiter para login com proteção contra brute force
 * 5 tentativas a cada 15 minutos, lockout após 10 tentativas
 */
export function checkLoginRateLimitWithLockout(identifier: string): {
    allowed: boolean;
    remainingAttempts?: number;
    lockoutRemaining?: number;
    shouldWarn?: boolean;
} {
    const key = `login-${identifier}`;

    // Verificar lockout
    const lockout = isLockedOut(key);
    if (lockout.locked) {
        return {
            allowed: false,
            remainingAttempts: 0,
            lockoutRemaining: lockout.remainingMs
        };
    }

    const now = Date.now();
    const record = attempts.get(key);
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 5;

    if (!record || now > record.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remainingAttempts: maxAttempts - 1 };
    }

    // Verificar se atingiu threshold de lockout
    if (record.count >= SECURITY_CONFIG.lockoutThreshold) {
        applyLockout(key);
        return {
            allowed: false,
            remainingAttempts: 0,
            lockoutRemaining: SECURITY_CONFIG.lockoutDurationMs
        };
    }

    if (record.count >= maxAttempts) {
        return {
            allowed: false,
            remainingAttempts: 0,
            shouldWarn: record.count >= SECURITY_CONFIG.bruteForceThreshold
        };
    }

    record.count++;

    return {
        allowed: true,
        remainingAttempts: maxAttempts - record.count,
        shouldWarn: record.count >= SECURITY_CONFIG.bruteForceThreshold
    };
}

/**
 * Rate limiter para login (versão simples, mantida para compatibilidade)
 * 5 tentativas a cada 15 minutos
 */
export function checkLoginRateLimit(identifier: string): boolean {
    return checkRateLimit(`login-${identifier}`, 5, 15 * 60 * 1000);
}

/**
 * Rate limiter para APIs administrativas
 * 30 requests por minuto
 */
export function checkApiRateLimit(identifier: string): boolean {
    return checkRateLimit(`api-${identifier}`, 30, 60 * 1000);
}

/**
 * Rate limiter para criação de usuários
 * 10 criações por hora
 */
export function checkUserCreationRateLimit(identifier: string): boolean {
    return checkRateLimit(`create-user-${identifier}`, 10, 60 * 60 * 1000);
}

/**
 * Rate limiter para ações sensíveis (alteração de senha, etc)
 * 3 tentativas a cada 30 minutos
 */
export function checkSensitiveActionRateLimit(identifier: string): boolean {
    return checkRateLimit(`sensitive-${identifier}`, 3, 30 * 60 * 1000);
}

/**
 * Obtém tempo restante até reset do rate limit
 * @param key - Identificador único
 * @returns Tempo em segundos até reset, ou 0 se não existe limite
 */
export function getRateLimitResetTime(key: string): number {
    const record = attempts.get(key);
    if (!record) return 0;

    const now = Date.now();

    // Se está em lockout, retornar tempo do lockout
    if (record.lockedUntil && now < record.lockedUntil) {
        return Math.ceil((record.lockedUntil - now) / 1000);
    }

    if (now > record.resetAt) return 0;

    return Math.ceil((record.resetAt - now) / 1000);
}

/**
 * Marca IP como suspeito para monitoramento
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
 * Limpa registro de rate limit (ex: após login bem-sucedido)
 */
export function clearRateLimit(key: string): void {
    attempts.delete(key);
}

/**
 * Limpa lockout (para uso administrativo)
 */
export function clearLockout(key: string): void {
    const record = attempts.get(key);
    if (record) {
        record.lockedUntil = undefined;
        record.isBlocked = false;
        record.count = 0;
    }
}

