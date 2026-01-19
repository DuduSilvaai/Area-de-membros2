# Database Migration Instructions

> [!IMPORTANT]
> These instructions were previously accessible via `/run-migration`, which has been removed for security reasons.

## Adding `updated_at` column to `enrollments` table

Run this SQL in your Supabase SQL Editor:

```sql
-- Add updated_at column to enrollments table
ALTER TABLE enrollments 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_enrollments_updated_at 
    BEFORE UPDATE ON enrollments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Update existing records to have updated_at = enrolled_at
UPDATE enrollments 
SET updated_at = enrolled_at 
WHERE updated_at IS NULL;
```
