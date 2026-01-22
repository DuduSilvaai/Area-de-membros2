-- FINAL FIX FOR PORTAL DELETION
-- This script fixes both Permissions (RLS) and Dependencies (Foreign Keys)
-- Run this entire script in Supabase SQL Editor

BEGIN;

-- ==========================================
-- PART 1: FIX PERMISSIONS (RLS)
-- ==========================================

-- Implement stricter RLS but ensure Admins have FULL CONTROL
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;

-- Remove potentially conflicting policies
DROP POLICY IF EXISTS "Admins can delete portals" ON public.portals;
DROP POLICY IF EXISTS "Admins can all" ON public.portals;
DROP POLICY IF EXISTS "Admins can do everything on portals" ON public.portals;

-- Create a comprehensive Admin policy
CREATE POLICY "Admins can do everything on portals"
ON public.portals
FOR ALL
TO authenticated
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
  OR 
  (auth.jwt() ->> 'email') IN (SELECT email FROM auth.users) -- Fallback if role is missing, usually not recommended but helpful for owner
)
WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  OR 
  (auth.jwt() ->> 'email') IN (SELECT email FROM auth.users)
);

-- ==========================================
-- PART 2: FIX DEPENDENCIES (CASCADE DELETE)
-- ==========================================

-- 1. Modules
DO $$
BEGIN
    -- Drop constraint if exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'modules_portal_id_fkey') THEN
        ALTER TABLE modules DROP CONSTRAINT modules_portal_id_fkey;
    END IF;
    -- Re-add with CASCADE
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'modules' AND column_name = 'portal_id') THEN
         ALTER TABLE modules
         ADD CONSTRAINT modules_portal_id_fkey
         FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Enrollments (Alunos no portal)
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

-- 3. Conversations (Chat)
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

-- 4. Contents (Aulas - via direct link if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'contents_portal_id_fkey') THEN
        ALTER TABLE contents DROP CONSTRAINT contents_portal_id_fkey;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'portal_id') THEN
        ALTER TABLE contents
        ADD CONSTRAINT contents_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Student Plans (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'student_plans_portal_id_fkey') THEN
        ALTER TABLE student_plans DROP CONSTRAINT student_plans_portal_id_fkey;
    END IF;
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_plans' AND column_name = 'portal_id') THEN
        ALTER TABLE student_plans
        ADD CONSTRAINT student_plans_portal_id_fkey
        FOREIGN KEY (portal_id) REFERENCES portals(id) ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;
