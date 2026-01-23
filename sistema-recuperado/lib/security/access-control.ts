'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth, getCurrentUser } from '@/lib/auth-guard';
import { log } from '@/lib/logger';

/**
 * Verifica se o usuário tem acesso a um portal específico
 * Previne IDOR (Insecure Direct Object Reference)
 */
export async function canAccessPortal(portalId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // Admins têm acesso a tudo
    if (user.user_metadata?.role === 'admin') return true;

    const supabase = await createClient();

    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('portal_id', portalId)
        .eq('is_active', true)
        .single();

    return !!enrollment;
}

/**
 * Verifica se o usuário tem acesso a uma lição específica
 */
export async function canAccessLesson(lessonId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // Admins têm acesso a tudo
    if (user.user_metadata?.role === 'admin') return true;

    const supabase = await createClient();

    // Buscar o módulo da lição e o portal associado
    const { data: content } = await supabase
        .from('contents')
        .select(`
            module_id,
            modules!inner (
                id,
                portal_id
            )
        `)
        .eq('id', lessonId)
        .single();

    if (!content) return false;

    const module = (content as any).modules;
    if (!module) return false;

    // Verificar enrollment no portal
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('permissions')
        .eq('user_id', user.id)
        .eq('portal_id', module.portal_id)
        .eq('is_active', true)
        .single();

    if (!enrollment) return false;

    // Verificar se tem acesso ao módulo específico
    const permissions = enrollment.permissions as {
        access_all?: boolean;
        allowed_modules?: string[];
    } | null;

    // Se não tem permissões definidas, negar acesso
    if (!permissions) return false;

    // Se tem acesso total, permitir
    if (permissions.access_all) return true;

    // Verificar se o módulo está na lista de permitidos
    return permissions.allowed_modules?.includes(content.module_id) || false;
}

/**
 * Verifica se o usuário é dono de um recurso específico
 */
export async function isResourceOwner(
    resourceType: 'comment' | 'message' | 'progress',
    resourceId: string
): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    const supabase = await createClient();

    const tableMap = {
        comment: 'comments',
        message: 'messages',
        progress: 'progress'
    } as const;

    const userIdField = resourceType === 'message' ? 'sender_id' : 'user_id';

    const { data } = await supabase
        .from(tableMap[resourceType])
        .select('id')
        .eq('id', resourceId)
        .eq(userIdField, user.id)
        .single();

    return !!data;
}

/**
 * Verifica se o usuário pode interagir em uma conversa
 */
export async function canAccessConversation(conversationId: string): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;

    // Admins podem ver todas as conversas
    if (user.user_metadata?.role === 'admin') return true;

    const supabase = await createClient();

    const { data } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .or(`student_id.eq.${user.id},admin_id.eq.${user.id}`)
        .single();

    return !!data;
}

/**
 * Wrapper para operações que requerem acesso a portal
 * Lança erro se o usuário não tiver permissão
 */
export async function requirePortalAccess(portalId: string): Promise<void> {
    const user = await getCurrentUser();

    if (!(await canAccessPortal(portalId))) {
        log.warn({
            portalId,
            userId: user?.id
        }, 'Unauthorized portal access attempt');
        throw new Error('Acesso não autorizado a este portal');
    }
}

/**
 * Wrapper para operações que requerem acesso a lição
 * Lança erro se o usuário não tiver permissão
 */
export async function requireLessonAccess(lessonId: string): Promise<void> {
    const user = await getCurrentUser();

    if (!(await canAccessLesson(lessonId))) {
        log.warn({
            lessonId,
            userId: user?.id
        }, 'Unauthorized lesson access attempt');
        throw new Error('Acesso não autorizado a esta aula');
    }
}

/**
 * Wrapper para operações que requerem propriedade do recurso
 */
export async function requireResourceOwnership(
    resourceType: 'comment' | 'message' | 'progress',
    resourceId: string
): Promise<void> {
    const user = await getCurrentUser();
    const isAdmin = user?.user_metadata?.role === 'admin';

    // Admins podem modificar qualquer recurso
    if (isAdmin) return;

    if (!(await isResourceOwner(resourceType, resourceId))) {
        log.warn({
            resourceType,
            resourceId,
            userId: user?.id
        }, 'Unauthorized resource modification attempt');
        throw new Error('Você não tem permissão para modificar este recurso');
    }
}

/**
 * Verifica se um módulo pertence a um portal específico
 */
export async function modulesBelongToPortal(
    moduleIds: string[],
    portalId: string
): Promise<boolean> {
    if (moduleIds.length === 0) return true;

    const supabase = await createClient();

    const { data: modules, error } = await supabase
        .from('modules')
        .select('id')
        .in('id', moduleIds)
        .eq('portal_id', portalId);

    if (error || !modules) return false;

    // Verificar se todos os módulos foram encontrados
    return modules.length === moduleIds.length;
}
