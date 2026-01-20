'use server';

import { createClient } from '@/lib/supabase/server';

export interface Evaluation {
    id: string;
    rating: number;
    comment?: string;
    created_at: string;
    user: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        email: string | null;
    };
    content: {
        id: string;
        title: string;
        module_title?: string;
    };
}

export async function getEvaluations(page = 1, limit = 10) {
    const supabase = await createClient();

    // Calculate range
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch ratings with relations
    // Note: We need to join with profiles (users), contents, and maybe feedback if it's separate
    // Based on comment_rating_migration.sql:
    // ratings table has stars, content_id, user_id
    // feedback table has rating_id, text

    // First get ratings
    const { data: ratingsData, error: ratingsError, count } = await supabase
        .from('ratings')
        .select(`
      *,
      profiles:user_id (id, full_name, avatar_url, email),
      contents:content_id (id, title, module_id),
      feedback:feedback(text)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (ratingsError) {
        console.error('Error fetching evaluations:', ratingsError);
        return { data: [], count: 0, error: ratingsError.message };
    }

    // Transform data to match interface
    // We need to fetch module titles separately or if we can deep join
    // Supabase deep join: contents(title, module_id, modules(title))

    // Let's try a second fetch for modules if needed, or optimize query
    // Optimizing query to include module title
    const { data: richRatingsData, error: richError } = await supabase
        .from('ratings')
        .select(`
      id,
      stars,
      created_at,
      user_id,
      content_id,
      profiles:user_id (id, full_name, avatar_url, email),
      contents:content_id (
        id, 
        title, 
        modules:module_id (title)
      ),
      feedback:feedback(text)
    `)
        .order('created_at', { ascending: false })
        .range(from, to);

    if (richError) {
        console.error('Error fetching rich evaluations:', richError);
        return { data: [], count: 0, error: richError.message };
    }

    const evaluations: Evaluation[] = (richRatingsData || []).map((dbItem: any) => ({
        id: dbItem.id,
        rating: dbItem.stars,
        comment: dbItem.feedback?.[0]?.text || null, // Assuming one feedback per rating or taking first
        created_at: dbItem.created_at,
        user: {
            id: dbItem.profiles?.id,
            full_name: dbItem.profiles?.full_name || 'Usuário Desconhecido',
            avatar_url: dbItem.profiles?.avatar_url,
            email: dbItem.profiles?.email
        },
        content: {
            id: dbItem.contents?.id,
            title: dbItem.contents?.title || 'Conteúdo Desconhecido',
            module_title: dbItem.contents?.modules?.title
        }
    }));

    return { data: evaluations, count: count || 0 };
}
