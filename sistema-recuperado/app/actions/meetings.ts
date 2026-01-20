'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Meeting {
    id: string;
    student_id: string;
    admin_id: string | null;
    title: string;
    description: string | null;
    link: string | null;
    created_at: string;
    updated_at: string;
}

export type CreateMeetingData = Pick<Meeting, 'student_id' | 'title' | 'description' | 'link'>;
export type UpdateMeetingData = Partial<Pick<Meeting, 'title' | 'description' | 'link'>>;

export async function getMeetings(studentId: string) {
    const supabase = await createClient();

    const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching meetings:', error);
        throw new Error('Failed to fetch meetings');
    }

    return meetings as Meeting[];
}

export async function createMeeting(data: CreateMeetingData) {
    const supabase = await createAdminClient();

    if (!data.title || !data.student_id) {
        return { error: 'Title and Student ID are required' };
    }

    const standardClient = await createClient();
    const { data: authData } = await standardClient.auth.getUser();

    if (!authData.user) {
        return { error: 'Unauthorized' };
    }

    const { data: newMeeting, error } = await supabase
        .from('meetings')
        .insert({
            ...data,
            admin_id: authData.user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating meeting:', error);
        return { error: error.message };
    }

    revalidatePath(`/chat`);
    revalidatePath(`/admin/chat`);
    return { data: newMeeting };
}

export async function updateMeeting(id: string, data: UpdateMeetingData) {
    const supabase = await createAdminClient();

    const { data: updatedMeeting, error } = await supabase
        .from('meetings')
        .update({
            ...data,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating meeting:', error);
        return { error: error.message };
    }

    revalidatePath(`/chat`);
    return { data: updatedMeeting };
}

// Generate Signed URL for client-side upload
// SIMPLIFIED VERSION: Assumes bucket exists (via SQL) and tries to use it directly
export async function getMeetingPresignedUrl(fileName: string, fileType: string, studentId: string) {
    console.log('[Upload] Starting presigned URL generation for:', fileName);
    try {
        const supabase = await createAdminClient();
        const bucketName = 'meeting-files';

        // Direct attempt to create signed URL
        // We assume the bucket exists because the user ran the SQL setup script.

        // Generate unique path
        const fileExt = fileName.split('.').pop() || 'bin';
        const filePath = `${studentId}/${Date.now()}.${fileExt}`;
        console.log('[Upload] Generating URL for path:', filePath, 'in bucket:', bucketName);

        // Create Signed Upload URL
        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUploadUrl(filePath);

        if (error) {
            console.error('[Upload] Error creating signed url:', error);

            // If meeting-files fails, try to use 'attachments' as a last resort backup
            if (error.message.includes('resource does not exist')) {
                console.log('[Upload] meeting-files not found, trying attachments bucket...');
                const { data: fallbackData, error: fallbackError } = await supabase.storage
                    .from('attachments')
                    .createSignedUploadUrl(filePath);

                if (fallbackError) {
                    return { error: `Erro grave: Bucket 'meeting-files' não encontrado mesmo após rodar o SQL. Verifique se o SQL rodou com sucesso no Supabase.` };
                }

                return {
                    signedUrl: fallbackData.signedUrl,
                    path: filePath,
                    token: fallbackData.token,
                    bucketName: 'attachments'
                };
            }
            return { error: `Erro no servidor: ${error.message}` };
        }

        console.log('[Upload] Success! URL generated.');

        return {
            signedUrl: data.signedUrl,
            path: filePath,
            token: data.token,
            bucketName
        };

    } catch (error: any) {
        console.error('[Upload] Config error:', error);
        return { error: error.message };
    }
}
