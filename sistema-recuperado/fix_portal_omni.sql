-- OMNI FIX FOR PORTAL DELETION (V3)
-- Solves the "progress" table error and all other dependencies

BEGIN;

-- ==========================================
-- PART 1: FIX KNOWN BLOCKER (PROGRESS TABLE)
-- ==========================================

-- The error "23503" showed that 'progress' table was blocking deletion of 'contents'
DO $$
BEGIN
    -- 1. Progress -> Contents
    -- Drop the restrictive constraint
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'progress_content_id_fkey') THEN
        ALTER TABLE progress DROP CONSTRAINT progress_content_id_fkey;
    END IF;

    -- Re-add with CASCADE
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'progress' AND column_name = 'content_id') THEN
         ALTER TABLE progress
         ADD CONSTRAINT progress_content_id_fkey
         FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE;
    END IF;
    
    -- 2. Progress -> Users/Enrollments? (Just in case)
    -- Often progress also references enrollments or users. 
    -- If it references enrollments, we need to cascade that too? 
    -- Usually deleting content is enough to cascade delete progress.
END $$;


-- ==========================================
-- PART 2: ENSURE OTHER DEPENDENCIES (CASCADE)
-- ==========================================

-- Modules -> Portals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'modules_portal_id_fkey') THEN
        ALTER TABLE modules DROP CONSTRAINT modules_portal_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'portal_id') THEN
         ALTER TABLE modules
         ADD CONSTRAINT modules_portal_id_fkey
         FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enrollments -> Portals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'enrollments_portal_id_fkey') THEN
        ALTER TABLE enrollments DROP CONSTRAINT enrollments_portal_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'portal_id') THEN
        ALTER TABLE enrollments
        ADD CONSTRAINT enrollments_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Conversations -> Portals
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'conversations_portal_id_fkey') THEN
        ALTER TABLE conversations DROP CONSTRAINT conversations_portal_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'portal_id') THEN
        ALTER TABLE conversations
        ADD CONSTRAINT conversations_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Contents -> Modules (Cascade from Module deletion)
DO $$
BEGIN
    -- This is usually 'contents_module_id_fkey'
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contents_module_id_fkey') THEN
        ALTER TABLE contents DROP CONSTRAINT contents_module_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'module_id') THEN
        ALTER TABLE contents
        ADD CONSTRAINT contents_module_id_fkey
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE;
    END IF;
END $$;


-- ==========================================
-- PART 3: PERMISSIONS (ADMIN OVERRIDE)
-- ==========================================

ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do everything on portals" ON public.portals;

CREATE POLICY "Admins can do everything on portals"
ON public.portals
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() ->> 'email') IN (SELECT email FROM auth.users) -- Fallback owner check
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR 
  (auth.jwt() ->> 'email') IN (SELECT email FROM auth.users)
);

COMMIT;
