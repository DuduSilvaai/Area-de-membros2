-- Add updated_at column to enrollments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'enrollments' 
        AND column_name = 'updated_at'
    ) THEN
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
        
        RAISE NOTICE 'Added updated_at column to enrollments table with trigger';
    ELSE
        RAISE NOTICE 'updated_at column already exists in enrollments table';
    END IF;
END $$;