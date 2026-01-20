-- Ensure ratings table exists
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stars INT NOT NULL CHECK (stars >= 1 AND stars <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id, user_id)
);

-- Indices for ratings
CREATE INDEX IF NOT EXISTS idx_ratings_content_id ON public.ratings(content_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

-- RLS for Ratings
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'Anyone can view ratings'
    ) THEN
        CREATE POLICY "Anyone can view ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'Users can insert their own ratings'
    ) THEN
        CREATE POLICY "Users can insert their own ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ratings' AND policyname = 'Users can update their own ratings'
    ) THEN
        CREATE POLICY "Users can update their own ratings" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    END IF;
END
$$;


-- Ensure feedback table exists
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rating_id UUID NOT NULL REFERENCES public.ratings(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_rating_id ON public.feedback(rating_id);

-- RLS for Feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Admins can view all feedback'
    ) THEN
        CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can view their own feedback'
    ) THEN
        CREATE POLICY "Users can view their own feedback" ON public.feedback FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.ratings r WHERE r.id = rating_id AND r.user_id = auth.uid()));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'Users can insert feedback for their own ratings'
    ) THEN
        CREATE POLICY "Users can insert feedback for their own ratings" ON public.feedback FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.ratings r WHERE r.id = rating_id AND r.user_id = auth.uid()));
    END IF;
END
$$;

-- Ensure access_logs table exists
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    content_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Access Logs
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'access_logs' AND policyname = 'Admins can view all access_logs'
    ) THEN
        CREATE POLICY "Admins can view all access_logs" ON public.access_logs FOR SELECT TO authenticated USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    END IF;

    -- Allow service role (full access) is default, but for specific usage we rely on policies
    -- Admin execution uses service role which bypasses RLS.
    
    -- If we wanted users to insert logs (e.g. client side errors):
    -- CREATE POLICY "Authenticated can insert logs" ON public.access_logs FOR INSERT TO authenticated WITH CHECK (true);
    -- But we are doing it server-side with Admin Client, so strict RLS is fine.
END
$$;
