-- Comprehensive Fix for Portal Deletion
-- Ensures that deleting a portal cascades to all related data

BEGIN;

-- 1. Modules: Link to Portal
DO $$
BEGIN
    If EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'modules_portal_id_fkey') THEN
        ALTER TABLE modules DROP CONSTRAINT modules_portal_id_fkey;
    END IF;
    
    -- Ensure column exists first (it should)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'portal_id') THEN
         ALTER TABLE modules
         ADD CONSTRAINT modules_portal_id_fkey
         FOREIGN KEY (portal_id)
         REFERENCES portals(id)
         ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Enrollments: Link to Portal
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'enrollments_portal_id_fkey') THEN
        ALTER TABLE enrollments DROP CONSTRAINT enrollments_portal_id_fkey;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'portal_id') THEN
        ALTER TABLE enrollments
        ADD CONSTRAINT enrollments_portal_id_fkey
        FOREIGN KEY (portal_id)
        REFERENCES portals(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Conversations (Chat): Link to Portal
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_portal_id_fkey') THEN
        ALTER TABLE conversations DROP CONSTRAINT conversations_portal_id_fkey;
    END IF;
    
    -- Also check for unique constraint that might interfere? No, unique is fine.
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'portal_id') THEN
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_portal_id_fkey
        FOREIGN KEY (portal_id)
        REFERENCES portals(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Contents (Lessons): Indirectly via Modules (already handled), but do lessons reference portals directly?
-- Check if contents has portal_id (some schemas do)
DO $$
BEGIN
    -- Based on lesson_persistence_migration.sql, contents might rely on module_id, but check just in case
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'portal_id') THEN
        -- If it has portal_id, fix it too
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contents_portal_id_fkey') THEN
             ALTER TABLE contents DROP CONSTRAINT contents_portal_id_fkey;
        END IF;

        ALTER TABLE contents
        ADD CONSTRAINT contents_portal_id_fkey
        FOREIGN KEY (portal_id)
        REFERENCES portals(id)
        ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Lesson Attachments: Link to Portal (from lesson_persistence_migration.sql)
DO $$
BEGIN
    -- Usually foreign keys are named auto-generatedly if not specified, or something like "lesson_attachments_portal_id_fkey"
    -- We try to catch the standard one.
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lesson_attachments') THEN
         -- Check for the constraint name or drop by column?
         -- Best effort: re-add if we can find the name. 
         -- lesson_persistence_migration.sql set it as "portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE" explicitly.
         -- So it should be fine. But let's double check RLS.
         NULL;
    END IF;
END $$;

COMMIT;
