-- ==============================================================================
-- MIGRATION: UNIFY CHAT CONVERSATIONS (Remove portal_id dependency)
-- ==============================================================================

-- 1. Consolidate duplicate conversations for each student
-- We will merge all conversations of a student into a single one (the most recently updated).
DO $$
DECLARE
    r RECORD;
    primary_id UUID;
BEGIN
    -- Loop through students who have more than 1 conversation
    FOR r IN (
        SELECT student_id
        FROM public.conversations
        GROUP BY student_id
        HAVING COUNT(*) > 1
    ) LOOP
        -- Select the primary conversation (the one with the most recent message/update)
        -- This ensures we keep the most relevant metadata (unread counts, etc.)
        SELECT id INTO primary_id
        FROM public.conversations
        WHERE student_id = r.student_id
        ORDER BY last_message_at DESC NULLS LAST, created_at DESC
        LIMIT 1;

        RAISE NOTICE 'Merging conversations for student % into conversation %', r.student_id, primary_id;

        -- Move all messages from other conversations to the primary one
        UPDATE public.messages
        SET conversation_id = primary_id
        WHERE conversation_id IN (
            SELECT id 
            FROM public.conversations 
            WHERE student_id = r.student_id AND id != primary_id
        );

        -- Delete the redundant conversations
        DELETE FROM public.conversations
        WHERE student_id = r.student_id AND id != primary_id;
    END LOOP;
END $$;

-- 2. Alter structure
-- Now that every student has at most 1 conversation, we can safely enforce it.

-- Drop the old unique constraint (student_id + portal_id)
ALTER TABLE public.conversations 
DROP CONSTRAINT IF EXISTS unique_student_portal_conversation;

-- Create a new unique constraint on student_id only
ALTER TABLE public.conversations
ADD CONSTRAINT unique_student_conversation UNIQUE (student_id);

-- Drop the portal_id column as it is no longer needed (Chat is global)
ALTER TABLE public.conversations
DROP COLUMN IF EXISTS portal_id;

-- 3. Notify
-- 3. Notify
-- Chat unification complete.

