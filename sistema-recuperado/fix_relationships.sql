-- ==============================================================================
-- FIX: Update Foreign Keys to reference public.profiles instead of auth.users
-- This is necessary for Supabase API to correctly expand 'profiles' in queries.
-- ==============================================================================

-- 1. Fix RATINGS foreign key
DO $$
BEGIN
    -- Check if the constraint exists and references auth.users (we can't easily check target, but we'll recreate it to be sure)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'ratings_user_id_fkey' AND table_name = 'ratings') THEN
        ALTER TABLE public.ratings DROP CONSTRAINT ratings_user_id_fkey;
    END IF;

    -- Add the correct constraint referencing public.profiles
    ALTER TABLE public.ratings
    ADD CONSTRAINT ratings_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;


-- 2. Fix ACCESS_LOGS foreign key (for reports page)
DO $$
BEGIN
    -- Drop existing if it implies auth.users or if we just want to ensure consistency
    -- Note: access_logs might rely on matching IDs. Explicit FK helps PostgREST.
    
    -- We need to check if access_logs exists first
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_logs') THEN
        
        -- Try to drop constraint if it exists automatically named or explicitly named
        -- (Names vary, so we attempt consistent naming)
        BEGIN
            ALTER TABLE public.access_logs DROP CONSTRAINT IF EXISTS access_logs_user_id_fkey;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignore if not found
        END;

        -- Add constraint to profiles
        ALTER TABLE public.access_logs
        ADD CONSTRAINT access_logs_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
        
    END IF;
END $$;
