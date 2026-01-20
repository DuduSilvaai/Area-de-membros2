/**
 * Rate Limiting em memória local
 * Para produção em escala, considere usar Upstash Redis
 */

interface RateLimitRecord {
    count: number;
    resetAt: number;
}

const attempts = new Map<string, RateLimitRecord>();

// Limpar registros expirados periodicamente
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
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
 * Rate limiter para login
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
 * Obtém tempo restante até reset do rate limit
 * @param key - Identificador único
 * @returns Tempo em segundos até reset, ou 0 se não existe limite
 */
export function getRateLimitResetTime(key: string): number {
    const record = attempts.get(key);
    if (!record) return 0;

    const now = Date.now();
    if (now > record.resetAt) return 0;

    return Math.ceil((record.resetAt - now) / 1000);
}
