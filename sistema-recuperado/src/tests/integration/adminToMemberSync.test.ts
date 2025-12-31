import { createClient } from '@supabase/supabase-js';
import { LessonService, LessonData } from '../../server/lessons/saveLesson';
import { Database } from '@/types/supabase';

// This test requires environment variables to be set for SUPABASE_URL and KEY
// You might need to run this with `dotenv -e .env.local -- jest src/tests/integration` or similar.

const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function runIntegrationTest() {
    console.log('--- Starting Integration Test: Admin to Member Sync ---');

    // Setup: Create a test portal and module if needed, or use existing hardcoded ones for test
    // For this script to be standalone, we'll try to find an existing portal or fail gracefully.

    // 1. Get a portal
    const { data: portal } = await supabase.from('portals').select('id').limit(1).single();
    if (!portal) {
        console.error('No portals found. Please create a portal first.');
        return;
    }
    console.log('Using Portal:', portal.id);

    // 2. Get a module
    const { data: module } = await supabase.from('modules').select('id').eq('portal_id', portal.id).limit(1).single();
    if (!module) {
        console.error('No modules found in portal.');
        return;
    }
    console.log('Using Module:', module.id);

    // 3. Create Lesson Data
    const testLessonData: LessonData = {
        portal_id: portal.id,
        module_id: module.id,
        title: `Integration Test Lesson ${Date.now()}`,
        content_type: 'text',
        video_url: 'https://example.com/video.mp4',
        config: {
            drip_enabled: false,
            drip_type: 'none',
            is_free_preview: true
        },
        attachments: [
            {
                type: 'link',
                title: 'Test Link',
                url: 'https://google.com'
            }
        ]
    };

    try {
        // 4. Call Backend Function (Admin Action)
        const userId = 'test-admin-user'; // Mock user ID for the function's internal logging/checks
        const savedLesson = await LessonService.saveLesson(testLessonData, userId);
        console.log('Lesson Saved Successfully:', savedLesson.id);

        // 5. Verification (Member View)
        // We verify by directly querying Supabase as a "member" would (or checking the raw tables).
        // Check contents table
        const { data: fetchedLesson } = await supabase
            .from('contents')
            .select('*, lesson_attachments(*)')
            .eq('id', savedLesson.id!)
            .single();

        if (!fetchedLesson) {
            throw new Error('Lesson not found in DB after save!');
        }

        // Verify Config
        const savedConfig = fetchedLesson.config as any;
        if (savedConfig.is_free_preview !== true) {
            throw new Error('Config mismatch: is_free_preview should be true');
        }

        // Verify Attachments
        if (fetchedLesson.lesson_attachments.length !== 1) {
            throw new Error(`Attachments mismatch: expected 1, got ${fetchedLesson.lesson_attachments.length}`);
        }

        console.log('✅ TEST PASSED: Lesson created, config saved, attachments linked.');

        // Cleanup
        await supabase.from('contents').delete().eq('id', savedLesson.id!);
        console.log('Cleanup done.');

    } catch (error) {
        console.error('❌ TEST FAILED:', error);
    }
}

// Run if called directly (e.g. ts-node)
if (require.main === module) {
    runIntegrationTest();
}

export default runIntegrationTest;
