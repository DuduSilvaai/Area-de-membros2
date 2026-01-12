-- Add enrolled_by column to enrollments table
-- This column stores the ID of the admin user who enrolled the student

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES auth.users(id);

-- Update existing records to have a default enrolled_by value (optional)
-- You can set this to a specific admin user ID if needed
-- UPDATE enrollments SET enrolled_by = 'admin-user-id-here' WHERE enrolled_by IS NULL;