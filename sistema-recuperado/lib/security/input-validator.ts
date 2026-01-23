import { z } from 'zod';

/**
 * Validadores de UUID reutilizáveis
 */
export const uuidSchema = z.string().uuid('ID inválido');

/**
 * Validador de email seguro
 * Previne caracteres especiais que podem ser usados para injeção
 */
export const safeEmailSchema = z
    .string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .regex(/^[^\s<>'"&]+$/, 'Email contém caracteres inválidos')
    .transform(email => email.toLowerCase().trim());

/**
 * Validador de texto seguro (sem HTML)
 */
export const safeTextSchema = z
    .string()
    .transform(text => text.trim())
    .refine(text => !/<[^>]*>/g.test(text), {
        message: 'HTML não é permitido neste campo'
    });

/**
 * Validador de texto com limite de tamanho
 */
export function safeLimitedTextSchema(maxLength: number) {
    return safeTextSchema.refine(text => text.length <= maxLength, {
        message: `Texto deve ter no máximo ${maxLength} caracteres`
    });
}

/**
 * Validador de URL segura
 * Apenas permite HTTP/HTTPS e bloqueia URLs perigosas
 */
export const safeUrlSchema = z
    .string()
    .url('URL inválida')
    .refine(url => {
        try {
            const parsed = new URL(url);
            // Apenas HTTP/HTTPS permitidos
            if (!['http:', 'https:'].includes(parsed.protocol)) return false;

            // Bloquear localhost e IPs privados em produção
            if (process.env.NODE_ENV === 'production') {
                const hostname = parsed.hostname.toLowerCase();
                if (hostname === 'localhost' ||
                    hostname === '127.0.0.1' ||
                    hostname.startsWith('192.168.') ||
                    hostname.startsWith('10.') ||
                    hostname.startsWith('172.')) {
                    return false;
                }
            }

            return true;
        } catch {
            return false;
        }
    }, { message: 'URL não permitida' });

/**
 * Validador de URL opcional (pode ser null/undefined)
 */
export const optionalSafeUrlSchema = z
    .string()
    .url('URL inválida')
    .nullable()
    .optional()
    .transform(url => {
        if (!url) return null;
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) return null;
            return url;
        } catch {
            return null;
        }
    });

/**
 * Validador de nome de arquivo seguro
 * Previne path traversal e caracteres perigosos
 */
export const safeFilenameSchema = z
    .string()
    .max(255, 'Nome de arquivo muito longo')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Nome de arquivo contém caracteres inválidos')
    .refine(name => !name.startsWith('.'), { message: 'Nome não pode começar com ponto' })
    .refine(name => !name.includes('..'), { message: 'Nome não pode conter ..' })
    .refine(name => !/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(name.split('.')[0]), {
        message: 'Nome de arquivo reservado pelo sistema'
    });

/**
 * Valida array de UUIDs
 */
export const uuidArraySchema = z.array(uuidSchema);

/**
 * Validador de paginação segura
 */
export const paginationSchema = z.object({
    page: z.number().int().min(1).max(10000).default(1),
    pageSize: z.number().int().min(1).max(100).default(20),
});

/**
 * Validador de busca segura
 */
export const searchQuerySchema = z
    .string()
    .max(200, 'Busca muito longa')
    .transform(query => query.trim())
    .refine(query => !/<[^>]*>/g.test(query), { message: 'Caracteres inválidos na busca' });

/**
 * Valida e sanitiza um ID (retorna null se inválido)
 */
export function validateId(id: unknown): string | null {
    const result = uuidSchema.safeParse(id);
    return result.success ? result.data : null;
}

/**
 * Valida múltiplos IDs (retorna null se algum for inválido)
 */
export function validateIds(ids: unknown): string[] | null {
    const result = uuidArraySchema.safeParse(ids);
    return result.success ? result.data : null;
}

/**
 * Valida e retorna erro formatado
 */
export function validateWithError<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Pegar primeira mensagem de erro
    const firstError = result.error.issues[0];
    const fieldPath = firstError.path.length > 0 ? `${firstError.path.join('.')}: ` : '';

    return {
        success: false,
        error: `${fieldPath}${firstError.message}`
    };
}

/**
 * Schema para validar ordem de itens (drag-and-drop)
 */
export const orderSchema = z.object({
    id: uuidSchema,
    order: z.number().int().min(0).max(10000)
});

export const orderArraySchema = z.array(orderSchema);

/**
 * Schema para validar JSON genérico (com limite de profundidade)
 */
export const safeJsonSchema = z.unknown().refine(
    (val) => {
        try {
            const str = JSON.stringify(val);
            return str.length <= 100000; // Max 100KB de JSON
        } catch {
            return false;
        }
    },
    { message: 'JSON inválido ou muito grande' }
);
