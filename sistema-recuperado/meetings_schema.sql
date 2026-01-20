-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Creator or last editor
    title TEXT NOT NULL,
    description TEXT,
    link TEXT, -- URL or File Path
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_meetings_student_id ON public.meetings(student_id);

-- RLS
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Admin Policies (Full Access)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Admins can do everything with meetings'
    ) THEN
        CREATE POLICY "Admins can do everything with meetings" ON public.meetings 
        FOR ALL 
        TO authenticated 
        USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
        WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');
    END IF;

    -- Student Policies (Read Only their own)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Students can view their own meetings'
    ) THEN
        CREATE POLICY "Students can view their own meetings" ON public.meetings 
        FOR SELECT 
        TO authenticated 
        USING (student_id = auth.uid());
    END IF;
END
$$;
