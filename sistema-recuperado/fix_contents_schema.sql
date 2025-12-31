-- Fix contents table schema
-- 1. Add updated_at if missing
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Add config if missing
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;

-- 3. Add attachments if missing (just in case)
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 4. Ensure is_active exists (mapped from is_published)
ALTER TABLE contents 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 5. Force schema cache reload (usually automatic, but good to know)
NOTIFY pgrst, 'reload schema';
