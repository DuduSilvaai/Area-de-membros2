-- Migration to add release scheduling columns to modules table

-- Add is_released column (defaults to true for existing modules)
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS is_released BOOLEAN DEFAULT true;

-- Add release_date column (nullable, for scheduled releases)
ALTER TABLE modules 
ADD COLUMN IF NOT EXISTS release_date TIMESTAMPTZ DEFAULT NULL;

-- Comment on columns for documentation
COMMENT ON COLUMN modules.is_released IS 'Whether the module is published and visible to students';
COMMENT ON COLUMN modules.release_date IS 'Scheduled release date/time. If NULL, module is released immediately when is_released is true';
