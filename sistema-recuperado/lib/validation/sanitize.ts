import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza HTML mantendo apenas tags seguras
 */
export function sanitizeHtml(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['href', 'target', 'rel'],
        ALLOW_DATA_ATTR: false,
    });
}

/**
 * Sanitiza nome de arquivo removendo caracteres perigosos
 */
export function sanitizeFileName(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Substitui caracteres especiais
        .replace(/_{2,}/g, '_') // Remove underscores duplicados
        .replace(/^\.+/, '') // Remove pontos no início
        .substring(0, 255); // Limita tamanho
}

/**
 * Sanitiza string removendo caracteres de controle
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove caracteres de controle
        .trim();
}

/**
 * Escapa caracteres especiais para uso em queries SQL
 * NOTA: Sempre prefira prepared statements ao invés desta função
 */
export function escapeSqlString(input: string): string {
    return input
        .replace(/'/g, "''")
        .replace(/\\/g, '\\\\')
        .replace(/\x00/g, '\\0')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\x1a/g, '\\Z');
}

/**
 * Valida se é uma URL segura
 */
export function isValidUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Sanitiza URL removendo javascript: e data: schemes
 */
export function sanitizeUrl(url: string): string {
    if (!url) return '';

    const trimmed = url.trim().toLowerCase();

    // Bloquear schemes perigosos
    if (
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('vbscript:')
    ) {
        return '';
    }

    return url.trim();
}

/**
 * Valida e sanitiza email
 */
export function sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Remove campos null/undefined de um objeto
 */
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
            result[key as keyof T] = value as T[keyof T];
        }
    }
    return result;
}

/**
 * Trunca string para um tamanho máximo
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}
