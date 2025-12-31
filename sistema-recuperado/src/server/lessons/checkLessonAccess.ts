import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { differenceInDays, parseISO, isAfter, addDays, startOfDay } from 'date-fns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

export type AccessStatus = 'GRANTED' | 'DENIED_DRIP' | 'DENIED_PAYWALL' | 'DENIED_NO_ENROLLMENT' | 'ERROR';

export async function checkLessonAccess(lessonId: string, userId: string): Promise<AccessStatus> {
    try {
        // 1. Fetch Lesson Config & Module Info
        // We need to know which portal this lesson belongs to.
        // And the config.
        const { data: lesson, error: lessonError } = await supabase
            .from('contents')
            .select('id, module_id, config, modules!inner(portal_id)')
            .eq('id', lessonId)
            .single();

        if (lessonError || !lesson) {
            console.error('Lesson not found', lessonError);
            return 'ERROR';
        }

        const config = lesson.config as any; // Type assertion as JSON is generic
        const portalId = (lesson.modules as any).portal_id;

        // 2. Check Free Preview (Short circuit)
        if (config?.is_free_preview) {
            return 'GRANTED';
        }

        // 3. User Enrollment Check
        const { data: enrollment, error: enrollmentError } = await supabase
            .from('enrollments')
            .select('enrolled_at, is_active, expires_at')
            .eq('user_id', userId)
            .eq('portal_id', portalId)
            .single();

        if (enrollmentError || !enrollment || !enrollment.is_active) {
            return 'DENIED_NO_ENROLLMENT';
        }

        // Check if expired
        if (enrollment.expires_at) {
            const expiresAt = parseISO(enrollment.expires_at);
            if (isAfter(new Date(), expiresAt)) {
                return 'DENIED_PAYWALL'; // Or DENIED_EXPIRED
            }
        }

        // 4. Drip Content Logic
        if (config?.drip_enabled) {
            const now = startOfDay(new Date());

            if (config.drip_type === 'date' && config.release_date) {
                const releaseDate = startOfDay(parseISO(config.release_date));
                if (isAfter(releaseDate, now)) {
                    // Released in future
                    return 'DENIED_DRIP';
                }
            } else if (config.drip_type === 'days_after_enrollment' && config.days_after_enrollment) {
                const enrolledAt = startOfDay(parseISO(enrollment.enrolled_at));
                const unlockDate = addDays(enrolledAt, config.days_after_enrollment);

                if (isAfter(unlockDate, now)) {
                    return 'DENIED_DRIP';
                }
            }
        }

        return 'GRANTED';

    } catch (error) {
        console.error('Error checking lesson access:', error);
        return 'ERROR';
    }
}
