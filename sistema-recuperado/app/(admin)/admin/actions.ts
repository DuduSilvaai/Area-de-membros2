'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPortal(data: {
    name: string;
    description: string;
    support_email: string;
    support_external_url?: string | null;
    theme: string;
    is_external_domain: number;
    theme_settings: any;
    comments_settings: any;
}) {
    const adminSupabase = await createAdminClient();

    try {
        // Prepare settings JSON
        const settings = {
            support_email: data.support_email,
            support_external_url: data.support_external_url,
            theme: data.theme,
            is_external_domain: data.is_external_domain === 1,
            theme_settings: data.theme_settings,
            comments_settings: data.comments_settings
        };

        const { data: newPortal, error } = await adminSupabase
            .from('portals')
            .insert([{
                name: data.name,
                description: data.description
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating portal:', error);
            return { error: error.message };
        }

        revalidatePath('/admin');
        return { success: true, portal: newPortal };
    } catch (error) {
        console.error('Error in createPortal:', error);
        return { error: 'Erro ao criar portal' };
    }
}
