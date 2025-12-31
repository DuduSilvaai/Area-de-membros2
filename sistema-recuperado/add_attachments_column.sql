-- Add attachments JSONB column to contents table
ALTER TABLE contents ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Ensure config is there too (redundant but safe)
ALTER TABLE contents ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
