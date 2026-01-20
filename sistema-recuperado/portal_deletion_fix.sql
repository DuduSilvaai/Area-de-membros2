-- Migration to fix Portal Deletion
-- This script adds CASCADE DELETE to foreign keys referencing the 'portals' table

-- 1. Verify and fix 'modules' table constraint
DO $$
BEGIN
    -- Drop existing constraint if it exists (to safe recreate)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'modules_portal_id_fkey') THEN
        ALTER TABLE modules DROP CONSTRAINT modules_portal_id_fkey;
    END IF;

    -- Add constraint with CASCADE
    ALTER TABLE modules
    ADD CONSTRAINT modules_portal_id_fkey
    FOREIGN KEY (portal_id)
    REFERENCES portals(id)
    ON DELETE CASCADE;
END $$;

-- 2. Verify and fix 'enrollments' table constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'enrollments_portal_id_fkey') THEN
        ALTER TABLE enrollments DROP CONSTRAINT enrollments_portal_id_fkey;
    END IF;

    ALTER TABLE enrollments
    ADD CONSTRAINT enrollments_portal_id_fkey
    FOREIGN KEY (portal_id)
    REFERENCES portals(id)
    ON DELETE CASCADE;
END $$;

-- 3. Verify and fix 'conversations' (chat) table constraint (from chat_migration.sql)
DO $$
BEGIN
    -- Usually better to Cascade delete conversations if portal is gone
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_portal_id_fkey') THEN
        ALTER TABLE conversations DROP CONSTRAINT conversations_portal_id_fkey;
    END IF;

    ALTER TABLE conversations
    ADD CONSTRAINT conversations_portal_id_fkey
    FOREIGN KEY (portal_id)
    REFERENCES portals(id)
    ON DELETE CASCADE;
END $$;

-- 4. Verify any other potential tables (e.g., student_portal_access from older pivots if exists, or others)
-- Based on grep search, 'modules' and 'enrollments' seem to be the main ones holding strong refs.

-- Ensure idempotency for safety
COMMIT;
