-- Migration for Portal Engine Features

-- 1. Updates to 'portals' table
-- Add 'settings' column for branding configuration
ALTER TABLE portals 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"primary_color": "#4f46e5", "secondary_color": "#1f2937", "logo_url": "", "favicon_url": "", "support_email": ""}'::jsonb;

-- 2. Updates to 'modules' table
-- Add hierarchy support and release settings
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS parent_module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS release_date TIMESTAMP WITH TIME ZONE;

-- 3. Updates to 'contents' table
-- Add content type details and preview option
-- First check if type exists, if not just use text check constraint or rely on application level enums if postgres enum not used.
-- Assuming 'content_type' might already exist or we are adding it. The prompt says "Add duration, content_type...".
-- If content_type exists, we might need to modify it. Let's assume it might not exist or needs update.
-- Ideally we check if column exists.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'duration') THEN
        ALTER TABLE contents ADD COLUMN duration INTEGER DEFAULT 0; -- Duration in seconds
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'content_type') THEN
        ALTER TABLE contents ADD COLUMN content_type TEXT DEFAULT 'video'; -- video, pdf, text, link, quiz
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'is_preview') THEN
        ALTER TABLE contents ADD COLUMN is_preview BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add video_url and content_url if they don't exist (just to be safe based on previous code usage seen)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'video_url') THEN
        ALTER TABLE contents ADD COLUMN video_url TEXT;
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contents' AND column_name = 'content_url') THEN
        ALTER TABLE contents ADD COLUMN content_url TEXT;
    END IF;

END $$;

-- Policies update (ensure new columns are accessible)
-- Usually existing policies cover "select *", so adding columns should be fine.
-- But if RLS is strict on columns, might need attention. Assuming standard row-level policies.

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_modules_release_date ON modules(release_date);
