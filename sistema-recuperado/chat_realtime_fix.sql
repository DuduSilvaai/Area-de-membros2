-- ==============================================================================
-- CHAT REALTIME FIX
-- Run this in your Supabase SQL Editor to ensure realtime is properly configured
-- ==============================================================================

-- Ensure messages and conversations tables are added to realtime publication
-- Note: If tables are already in publication, this will show a notice (not an error)

DO $$
BEGIN
    -- Check if messages table is in supabase_realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
        RAISE NOTICE 'Added messages table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'messages table already in supabase_realtime publication';
    END IF;

    -- Check if conversations table is in supabase_realtime publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
        RAISE NOTICE 'Added conversations table to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'conversations table already in supabase_realtime publication';
    END IF;
END $$;

-- Verify the publication includes the tables
SELECT 
    schemaname,
    tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;
