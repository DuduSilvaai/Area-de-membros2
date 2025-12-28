-- Add is_active column to modules table if it doesn't exist
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add is_active column to contents table if it doesn't exist
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing records to be active
UPDATE modules SET is_active = TRUE WHERE is_active IS NULL;
UPDATE contents SET is_active = TRUE WHERE is_active IS NULL;

-- Create indexes for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_modules_is_active ON modules(is_active);
CREATE INDEX IF NOT EXISTS idx_contents_is_active ON contents(is_active);
