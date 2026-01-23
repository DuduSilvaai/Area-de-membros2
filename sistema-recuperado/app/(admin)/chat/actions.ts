'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth-guard';

export interface ChatUser {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    role: string;
}

export async function getUsersForChat(search: string = '') {
    try {
        await requireAdmin();
        const adminSupabase = createAdminClient();

        let query = adminSupabase
            .from('profiles')
            .select('id, full_name, email, avatar_url, role')
            .neq('role', 'admin') // Exclude other admins
            .order('full_name');

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data, error } = await query.limit(50);

        if (error) {
            console.error('Error fetching users for chat:', error);
            return { error: 'Erro ao buscar usuários' };
        }

        return { data: data as ChatUser[] };
    } catch (error: any) {
        console.error('Error in getUsersForChat:', error);
        return { error: error.message };
    }
}

export async function getOrCreateConversation(studentId: string) {
    try {
        await requireAdmin();
        const adminSupabase = createAdminClient();

        // 1. Check for existing conversation
        const { data: existing, error: fetchError } = await adminSupabase
            .from('conversations')
            .select(`
                *,
                student:profiles!conversations_student_id_profiles_fkey(id, full_name, avatar_url)
            `)
            .eq('student_id', studentId)
            .maybeSingle();

        if (fetchError) {
            // If unique constraint error (multiple rows), usually means data integrity issue if we expect only one.
            // But maybeSingle handles 0 or 1.
            console.error('Error fetching conversation:', fetchError);
        }

        if (existing) {
            // Transform to match ConversationWithStudent type
            const conversation = {
                ...existing,
                student: Array.isArray(existing.student) ? existing.student[0] : existing.student
            };
            return { data: conversation };
        }

        // 2. Create new conversation
        const { data: newConv, error: createError } = await adminSupabase
            .from('conversations')
            .insert({
                student_id: studentId,
                unread_count_admin: 0,
                unread_count_student: 0
            })
            .select(`
                *,
                student:profiles!conversations_student_id_profiles_fkey(id, full_name, avatar_url)
            `)
            .single();

        if (createError) {
            console.error('Error creating conversation:', createError);
            return { error: 'Erro ao criar conversa' };
        }

        const conversation = {
            ...newConv,
            student: Array.isArray(newConv.student) ? newConv.student[0] : newConv.student
        };

        return { data: conversation };

    } catch (error: any) {
        console.error('Error in getOrCreateConversation:', error);
        return { error: error.message };
    }
}
