/**
 * Headers de segurança recomendados para respostas HTTP
 * 
 * Estes headers implementam proteções contra ataques comuns
 * como XSS, clickjacking, MIME sniffing, etc.
 */

/**
 * Headers de segurança para páginas HTML
 */
export const SECURITY_HEADERS = {
    // Prevenir clickjacking - não permitir que a página seja embedada em iframes
    'X-Frame-Options': 'DENY',

    // Prevenir MIME type sniffing - forçar browser a respeitar Content-Type
    'X-Content-Type-Options': 'nosniff',

    // Proteção XSS para browsers legados (Chrome/Safari)
    'X-XSS-Protection': '1; mode=block',

    // Forçar HTTPS por 1 ano, incluindo subdomínios
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Controlar informação de referrer enviada em requests
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Desabilitar features de browser que podem ser exploradas
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',

    // Não cachear dados sensíveis
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
} as const;

/**
 * Headers específicos para respostas de API (JSON)
 */
export const API_SECURITY_HEADERS = {
    ...SECURITY_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
} as const;

/**
 * Headers para download de arquivos
 */
export const DOWNLOAD_SECURITY_HEADERS = {
    ...SECURITY_HEADERS,
    'Content-Disposition': 'attachment',
    'X-Download-Options': 'noopen',
} as const;

/**
 * Content Security Policy configurações
 */
export const CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", '*.youtube.com', '*.vimeo.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
    'font-src': ["'self'", 'fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'blob:', '*.supabase.co', '*.youtube.com', '*.vimeo.com', 'images.unsplash.com', 'api.dicebear.com', 'ui-avatars.com', 'i.ytimg.com'],
    'media-src': ["'self'", 'blob:', '*.supabase.co'],
    'connect-src': ["'self'", '*.supabase.co', 'wss://*.supabase.co'],
    'frame-src': ["'self'", '*.youtube.com', '*.youtube-nocookie.com', '*.vimeo.com', 'player.vimeo.com'],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
} as const;

/**
 * Gera string CSP a partir das diretivas
 */
export function buildCSP(directives: Record<string, readonly string[] | string[]> = CSP_DIRECTIVES): string {
    return Object.entries(directives)
        .map(([key, values]) => `${key} ${values.join(' ')}`)
        .join('; ');
}

/**
 * Aplica headers de segurança a um objeto Headers
 */
export function applySecurityHeaders(headers: Headers): void {
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        headers.set(key, value);
    });
}

/**
 * Cria uma Response com headers de segurança aplicados
 */
export function secureResponse(
    body: BodyInit | null,
    init?: ResponseInit
): Response {
    const response = new Response(body, init);
    applySecurityHeaders(response.headers);
    return response;
}

/**
 * Cria uma Response JSON segura
 */
export function secureJsonResponse(
    data: unknown,
    init?: ResponseInit
): Response {
    const body = JSON.stringify(data);
    const response = new Response(body, {
        ...init,
        headers: {
            ...API_SECURITY_HEADERS,
            ...(init?.headers || {}),
        },
    });
    return response;
}

/**
 * Headers para prevenir cache de dados sensíveis
 */
export function getNoCacheHeaders(): Record<string, string> {
    return {
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
    };
}

/**
 * Verifica se uma origem é permitida para CORS
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]): boolean {
    if (!origin) return false;

    return allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        if (allowed.startsWith('*.')) {
            const domain = allowed.slice(2);
            return origin.endsWith(domain) || origin.endsWith(`.${domain}`);
        }
        return origin === allowed;
    });
}

/**
 * Gera headers CORS seguros
 */
export function getCORSHeaders(
    origin: string | null,
    allowedOrigins: string[],
    allowCredentials = false
): Record<string, string> {
    if (!origin || !isAllowedOrigin(origin, allowedOrigins)) {
        return {};
    }

    const headers: Record<string, string> = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400', // 24 hours
    };

    if (allowCredentials) {
        headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return headers;
}
