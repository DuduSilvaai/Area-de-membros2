-- ==============================================================================
-- MIGRATION: Comment Editing History & Rating System
-- ==============================================================================

-- 1. COMMENT EDITS - Track edit history
CREATE TABLE IF NOT EXISTS public.comment_edits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    edited_at TIMESTAMPTZ DEFAULT NOW(),
    edited_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_comment_edits_comment_id ON public.comment_edits(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_edits_edited_at ON public.comment_edits(edited_at DESC);

-- RLS for Comment Edits
ALTER TABLE public.comment_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all comment edits"
ON public.comment_edits FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Users can insert edits for their own comments"
ON public.comment_edits FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.comments c
        WHERE c.id = comment_id AND c.user_id = auth.uid()
    )
);

-- ==============================================================================
-- 2. RATINGS SYSTEM - 5 Star Ratings
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_content_id ON public.ratings(content_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

-- RLS for Ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ratings"
ON public.ratings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own ratings"
ON public.ratings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
ON public.ratings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- ==============================================================================
-- 3. FEEDBACK - Optional text feedback after rating
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_rating_id ON public.feedback(rating_id);

-- RLS for Feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Users can view their own feedback"
ON public.feedback FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.ratings r
        WHERE r.id = rating_id AND r.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert feedback for their own ratings"
ON public.feedback FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.ratings r
        WHERE r.id = rating_id AND r.user_id = auth.uid()
    )
);

-- ==============================================================================
-- 4. UPDATE COMMENTS RLS - Remove DELETE for non-admins
-- ==============================================================================

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- Create admin-only delete policy
CREATE POLICY "Only admins can delete comments"
ON public.comments FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==============================================================================
-- 5. REALTIME - Enable for new tables
-- ==============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_edits;
