-- Add enrolled_at column to enrollments table
-- The code expects this column to store the timestamp of when the user was enrolled.
-- Error PGRST204 indicated it was missing.

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
