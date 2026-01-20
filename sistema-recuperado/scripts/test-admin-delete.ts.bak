
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from local .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Environment Variables');
    console.error('URL:', supabaseUrl);
    console.error('Key:', supabaseServiceKey ? 'Found' : 'Missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDelete() {
    console.log('🚀 Starting Admin Delete Test...');

    // 1. Fetch a recent comment to use as a test target
    // ideally one that looks like a test comment "teste" or similar, but for now just the latest one
    const { data: comments, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (fetchError) {
        console.error('❌ Error fetching comments:', fetchError);
        return;
    }

    if (!comments || comments.length === 0) {
        console.log('⚠️ No comments found to test deletion on.');
        return;
    }

    const targetComment = comments[0];
    console.log(`🎯 Target Content Found: ID=${targetComment.id}, Text="${targetComment.text}"`);
    console.log(`❓ Do you want to delete this comment? (Simulation: Yes)`);

    // 2. Try Recursive Delete Logic (Copy-pasted logic from actions/comments.ts for verification)

    // 2.a Delete Children
    const { data: replies } = await supabase
        .from('comments')
        .select('id')
        .eq('parent_id', targetComment.id);

    console.log(`   found ${replies?.length || 0} replies.`);

    // 2.b Delete Likes
    const { error: likesError, count: likesCount } = await supabase
        .from('comment_likes')
        .delete({ count: 'exact' })
        .eq('comment_id', targetComment.id);

    if (likesError) console.error('   ❌ Error deleting likes:', likesError);
    else console.log(`   ✅ Deleted ${likesCount} likes.`);

    // 2.c Delete Comment
    const { error: deleteError, count: deleteCount } = await supabase
        .from('comments')
        .delete({ count: 'exact' })
        .eq('id', targetComment.id);

    if (deleteError) {
        console.error('   ❌ Error deleting comment:', deleteError);
    } else {
        console.log(`   ✅ Successfully deleted comment (Count: ${deleteCount})`);
    }

    // 3. Verify it's gone
    const { data: verification } = await supabase
        .from('comments')
        .select('id')
        .eq('id', targetComment.id)
        .single();

    if (!verification) {
        console.log('✨ Verification Passed: Comment no longer exists in DB.');
    } else {
        console.error('❌ Verification Failed: Comment STILL exists in DB.');
    }
}

testDelete();
