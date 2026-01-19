-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('success', 'info', 'alert', 'warning')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE -- Optional: to auto-hide old notifications
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Allow reading notifications for authenticated users
CREATE POLICY "Everyone can read notifications" ON public.notifications
    FOR SELECT
    TO authenticated
    USING (true);

-- Create notification_reads table to track read status per user
CREATE TABLE IF NOT EXISTS public.notification_reads (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_id UUID REFERENCES public.notifications(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, notification_id)
);

-- Enable RLS on notification_reads
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;

-- Allow users to insert/select their own read status
CREATE POLICY "Users can manage their own read status" ON public.notification_reads
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Initial Mock Data
INSERT INTO public.notifications (title, message, type, created_at)
VALUES 
    ('Nova aula disponível', 'O módulo avançado está liberado.', 'success', NOW() - INTERVAL '2 minutes'),
    ('Resposta do instrutor', 'O instrutor respondeu sua dúvida.', 'info', NOW() - INTERVAL '1 hour'),
    ('Manutenção', 'Manutenção programada para esta noite.', 'alert', NOW() - INTERVAL '5 hours');
