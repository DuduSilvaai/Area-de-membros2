-- Migration: Lesson Persistence & Attachments

-- 1. Create lesson_attachments table
CREATE TABLE IF NOT EXISTS lesson_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
    portal_id UUID NOT NULL REFERENCES portals(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('file', 'link')),
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    file_size INTEGER, -- Optional, mostly for files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster retrieval by lesson
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson ON lesson_attachments(lesson_id);

-- RLS Policies for lesson_attachments
ALTER TABLE lesson_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Admin Access (Full Control) - Assuming admins can do everything
CREATE POLICY "Admins can manage attachments" ON lesson_attachments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role::text IN ('admin', 'manager') -- Cast to text to avoid enum errors if value doesn't exist
        )
    );

-- Policy: Members Read Access (Only for their portal)
CREATE POLICY "Members can view attachments" ON lesson_attachments
    FOR SELECT
    USING (
        portal_id IN (
            SELECT portal_id FROM enrollments 
            WHERE user_id = auth.uid() 
            AND is_active = true
        )
    );

-- 2. Add 'config' and update 'contents' table
-- Add config column if not exists
ALTER TABLE contents ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- Ensure RLS policies on contents are robust (Existing ones likely suffice, but good to verify parent_module_id checks if needed)
-- (No specific change needed here unless requested, assuming contents RLS is already set up)
