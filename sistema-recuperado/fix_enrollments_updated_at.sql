-- Fix enrollments table to support proper realtime synchronization
-- This adds the updated_at column and trigger if they don't exist

DO $$ 
BEGIN
    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE enrollments 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        RAISE NOTICE 'Added updated_at column to enrollments table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in enrollments table';
    END IF;

    -- Create or replace the trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_enrollments_updated_at ON enrollments;

    -- Create the trigger
    CREATE TRIGGER update_enrollments_updated_at 
        BEFORE UPDATE ON enrollments 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
        
    -- Update existing records to have updated_at = enrolled_at where updated_at is null
    UPDATE enrollments 
    SET updated_at = enrolled_at 
    WHERE updated_at IS NULL;
    
    RAISE NOTICE 'Updated enrollments table with updated_at trigger and populated existing records';
END $$;