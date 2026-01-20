import { z } from 'zod';

/**
 * Schema de validação para criação de usuário
 */
export const createUserSchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(100, 'Nome muito longo')
        .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome contém caracteres inválidos'),

    email: z
        .string()
        .email('Email inválido')
        .min(1, 'Email é obrigatório')
        .max(255, 'Email muito longo')
        .trim()
        .toLowerCase(),

    password: z
        .string()
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
        .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),

    role: z.enum(['admin', 'member'], { message: 'Role deve ser admin ou member' }),
});

/**
 * Schema de validação para enrollment
 */
export const enrollmentSchema = z.object({
    userId: z.string().uuid('ID do usuário deve ser um UUID válido'),
    portalId: z.string().uuid('ID do portal deve ser um UUID válido'),
    permissions: z.object({
        access_all: z.boolean({ message: 'access_all é obrigatório' }),
        allowed_modules: z.array(z.string().uuid('ID de módulo inválido')).optional(),
    }, { message: 'Permissões são obrigatórias' }),
});

/**
 * Schema de validação para login
 */
export const loginSchema = z.object({
    email: z
        .string()
        .email('Email inválido')
        .min(1, 'Email é obrigatório')
        .trim()
        .toLowerCase(),

    password: z
        .string()
        .min(1, 'Senha é obrigatória'),
});

/**
 * Schema de validação para criação de portal
 */
export const createPortalSchema = z.object({
    name: z
        .string()
        .min(2, 'Nome deve ter no mínimo 2 caracteres')
        .max(100, 'Nome muito longo'),

    description: z
        .string()
        .max(500, 'Descrição muito longa')
        .optional(),

    image_url: z
        .string()
        .url('URL de imagem inválida')
        .optional()
        .nullable(),

    support_email: z.string().email('Email de suporte inválido').optional(),
    support_external_url: z.string().url('URL inválida').optional().nullable(),
    theme: z.string().optional(),
    is_external_domain: z.number().optional(), // 0 or 1
    theme_settings: z.object({
        default_color: z.string().optional(),
        light_logo_url: z.string().optional().nullable(),
        dark_logo_url: z.string().optional().nullable(),
    }).optional(),

    comments_settings: z.object({
        day_limit: z.number().min(0).max(200).optional(),
        character_limit: z.number().min(10).max(999).optional(),
        automatically_publish: z.boolean().optional(),
    }).optional(),

    is_active: z.boolean().default(true),
});

/**
 * Schema de validação para comentários
 */
export const commentSchema = z.object({
    text: z
        .string()
        .min(1, 'Comentário não pode estar vazio')
        .max(5000, 'Comentário muito longo'),

    lessonId: z
        .string()
        .uuid('ID da aula inválido'),

    parentId: z.string().uuid('ID do comentário pai inválido').optional().nullable(),
});

/**
 * Schema de validação para upload de arquivo
 */
export const fileUploadSchema = z.object({
    filename: z
        .string()
        .max(255, 'Nome do arquivo muito longo')
        .min(1, 'Nome do arquivo é obrigatório'),

    contentType: z.enum([
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'application/zip',
    ], { message: 'Tipo de arquivo não permitido' }),

    size: z
        .number()
        .max(100 * 1024 * 1024, 'Arquivo muito grande (máximo 100MB)'),
});

/**
 * Schema de validação para criação de módulos
 */
export const createModuleSchema = z.object({
    title: z.string().min(2).max(150),
    description: z.string().max(500).optional().nullable(),
    portal_id: z.string().uuid('ID do portal inválido'),
    parent_module_id: z.string().uuid('ID do módulo pai inválido').optional().nullable(),
    order_index: z.number().int().default(0),
    is_released: z.boolean().default(true),
    release_date: z.string().optional().nullable(),
    image_url: z.string().url('URL inválida').optional().nullable(),
});

/**
 * Schema de validação para criação de conteúdo (aulas)
 */
export const createContentSchema = z.object({
    title: z.string().min(2).max(150),
    module_id: z.string().uuid('ID do módulo inválido'),
    content_type: z.enum(['video', 'text', 'quiz', 'file', 'pdf', 'external'], { message: 'Tipo de conteúdo obrigatório' }),
    video_url: z.string().url('URL de vídeo inválida').optional().nullable(),
    content_url: z.string().url('URL de conteúdo inválida').optional().nullable(),
    duration: z.number().min(0).optional(),
    is_preview: z.boolean().default(false),
    order_index: z.number().int().default(0),
});

// Types exportados
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePortalInput = z.infer<typeof createPortalSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
