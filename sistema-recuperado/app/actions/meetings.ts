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
    const supabase = await createClient(); // Use regular client to enforce RLS (Student sees own, Admin sees all/based on policy)
    // Actually, for Admin accessing a specific student, they should see that student's meetings.
    // If AuthContext is admin, RLS allows.

    // However, if we are in AdminChatPage, we are using createAdminClient typically to bypass some things, 
    // but meetings RLS is set up. Let's stick to createClient for standard access or createAdminClient 
    // if we need to bypass (e.g. if the admin is not "authenticated" in the same way RLS expects).
    // In this project, admins seem to have the role in metadata.

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
    const supabase = await createAdminClient(); // Use Admin Client to ensure write access regardless of tricky RLS context if needed, though policies allow admin.

    // Validation could go here
    if (!data.title || !data.student_id) {
        return { error: 'Title and Student ID are required' };
    }

    const { data: user } = await supabase.auth.getUser(); // This might return null with Admin Client if we don't pass cookies? 
    // actually createAdminClient uses service role, so auth.uid() is not traditional.
    // We should probably pass the admin_id manually from the UI or get it from standard client session.

    // Better approach:
    // Use standard client to get current user (admin), then use that ID.
    // Use Admin Client to INSERT if we want to be safe, or standard if RLS works.
    // Let's use standard client for AUTH check.
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
    revalidatePath(`/admin/chat`); // Adjust paths as needed
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
export async function getMeetingPresignedUrl(fileName: string, fileType: string, studentId: string) {
    try {
        const supabase = await createAdminClient();
        const bucketName = 'meeting-files';

        // Check bucket and create if needed (Idempotent check)
        // Note: listBuckets() is cheaper than failing an upload
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(b => b.name === bucketName);

        if (!bucketExists) {
            await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 524288000, // 500MB
                allowedMimeTypes: [
                    'video/*',
                    'audio/*',
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-powerpoint',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                ]
            });
        }

        // Generate unique path
        const fileExt = fileName.split('.').pop() || 'bin';
        const filePath = `${studentId}/${Date.now()}.${fileExt}`;

        // Create Signed Upload URL
        const { data, error } = await supabase.storage
            .from(bucketName)
            .createSignedUploadUrl(filePath);

        if (error) {
            console.error('Error creating signed url:', error);
            return { error: error.message };
        }

        return {
            signedUrl: data.signedUrl,
            path: filePath,
            token: data.token,
            bucketName
        };

    } catch (error: any) {
        console.error('Config error:', error);
        return { error: error.message };
    }
}
