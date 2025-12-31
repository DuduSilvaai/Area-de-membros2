-- Student Learning Cycle Migration
-- Adds last_position tracking for video resume functionality

-- Add last_position column to progress table (stores video position in seconds)
ALTER TABLE progress ADD COLUMN IF NOT EXISTS last_position integer DEFAULT 0;

-- Create index for faster lookups on user progress
CREATE INDEX IF NOT EXISTS idx_progress_user_content ON progress(user_id, content_id);

-- Create index on enrollments for faster portal filtering
CREATE INDEX IF NOT EXISTS idx_enrollments_user_active ON enrollments(user_id, is_active);

-- Add unique constraint for upsert operations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_content_progress'
    ) THEN
        ALTER TABLE progress ADD CONSTRAINT unique_user_content_progress UNIQUE (user_id, content_id);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
END $$;

-- Update RLS policy for progress to allow students to read/write their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON progress;
CREATE POLICY "Users can view own progress" ON progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own progress" ON progress;
CREATE POLICY "Users can insert own progress" ON progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON progress;
CREATE POLICY "Users can update own progress" ON progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Make sure enrollments table has proper RLS for students to read their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = user_id);
