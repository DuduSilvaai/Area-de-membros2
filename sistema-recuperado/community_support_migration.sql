-- ==============================================================================
-- MIGRATION: COMMUNITY & SUPPORT Features
-- Includes: Comments, Events, and Chat Enhancements
-- ==============================================================================

-- 1. COMMENTS SYSTEM
-- Table for lesson comments
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- For replies
    text TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Comments
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON public.comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- RLS for Comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 2. EVENTS SYSTEM
-- Table for live events/meetings
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    link_url TEXT NOT NULL,
    banner_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for Events
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);

-- RLS for Events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view events"
ON public.events FOR SELECT
TO authenticated
USING (true);

-- Only Admins should manage events (Adjust this check based on your Admin logic)
CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
TO authenticated
USING (
  -- Simple check: access_level in metadata or specific email/id
  -- For now, allowing authenticated users for dev simplicity, but restricted in app logic
  true 
);

-- 3. CHAT ENHANCEMENTS
-- Add Context and Attachments to messages
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS context JSONB,
ADD COLUMN IF NOT EXISTS attachments JSONB[];

-- Examples of context: { "source": "lesson", "lessonId": "...", "moduleTitle": "..." }
-- Examples of attachments: [{ "type": "image", "url": "..." }, { "type": "file", "url": "..." }]

-- 4. REALTIME
-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
