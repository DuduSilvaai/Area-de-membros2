-- ==============================================================================
-- MIGRATION: CHAT SYSTEM (1:1 Mentoria)
-- ==============================================================================

-- 1. Create CONVERSATIONS table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: Assign specific admin
    portal_id UUID REFERENCES public.portals(id) ON DELETE SET NULL,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_preview TEXT,
    unread_count_admin INT DEFAULT 0 CHECK (unread_count_admin >= 0),
    unread_count_student INT DEFAULT 0 CHECK (unread_count_student >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Ensure 1 conversation per student/portal pair
    CONSTRAINT unique_student_portal_conversation UNIQUE (student_id, portal_id)
);

-- 2. Create MESSAGES table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'file', 'video', 'meeting')),
    content JSONB NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document content structure
COMMENT ON COLUMN public.messages.content IS '
Structure based on type:
- text: { "text": "Hello!" }
- image: { "url": "...", "caption": "...", "width": 800, "height": 600 }
- video: { "url": "...", "thumbnail": "...", "duration": 120 }
- file: { "url": "...", "name": "doc.pdf", "size": 1024, "mimeType": "application/pdf" }
- meeting: { "title": "Mentorship", "description": "...", "date": "ISO8601", "link": "https://..." }
';

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- 4. Helper Function: Check if user is Admin
-- (Adjust this logic depending on how you store roles. Common patterns: metadata or profiles table)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- Example 1: Check user_metadata
    RETURN (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' 
           OR (auth.jwt() -> 'user_metadata' ->> 'is_admin') = 'true'
           -- Fallback for development (remove in production if strict)
           OR (SELECT email FROM auth.users WHERE id = auth.uid()) LIKE '%admin%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger: Update Conversation on New Message
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    v_student_id UUID;
BEGIN
    -- Get student_id from conversation to correctly increment unread counts
    SELECT student_id INTO v_student_id
    FROM public.conversations 
    WHERE id = NEW.conversation_id;

    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN NEW.type = 'text' THEN LEFT(NEW.content->>'text', 100)
            WHEN NEW.type = 'image' THEN '📷 Imagem'
            WHEN NEW.type = 'video' THEN '🎥 Vídeo'
            WHEN NEW.type = 'file' THEN '📎 ' || COALESCE(NEW.content->>'name', 'Arquivo')
            WHEN NEW.type = 'meeting' THEN '📅 ' || COALESCE(NEW.content->>'title', 'Reunião agendada')
            ELSE 'Nova mensagem'
        END,
        updated_at = NOW(),
        -- Increment unread count for the RECEIVER
        unread_count_admin = CASE 
            WHEN NEW.sender_id = v_student_id THEN unread_count_admin + 1 
            ELSE unread_count_admin 
        END,
        unread_count_student = CASE 
            WHEN NEW.sender_id != v_student_id THEN unread_count_student + 1 
            ELSE unread_count_student 
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_new_message();

-- 6. RPC Function: Mark Messages as Read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    v_is_student BOOLEAN;
BEGIN
    -- Check if user is the student owner of the conversation
    SELECT (student_id = p_user_id) INTO v_is_student
    FROM public.conversations WHERE id = p_conversation_id;
    
    -- Update is_read for messages sent by the OTHER party
    UPDATE public.messages
    SET is_read = TRUE
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_read = FALSE;
    
    -- Reset unread count
    IF v_is_student THEN
        UPDATE public.conversations
        SET unread_count_student = 0, updated_at = NOW()
        WHERE id = p_conversation_id;
    ELSE
        UPDATE public.conversations
        SET unread_count_admin = 0, updated_at = NOW()
        WHERE id = p_conversation_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security (RLS)

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for CONVERSATIONS
CREATE POLICY "Admins can view all conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Students can view their own conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can update conversations"
ON public.conversations FOR UPDATE
TO authenticated
USING (is_admin());

CREATE POLICY "Students can update their own conversations (read count)"
ON public.conversations FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

-- Policies for MESSAGES
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = messages.conversation_id
        AND (c.student_id = auth.uid() OR is_admin())
    )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR is_admin())
    )
);

CREATE POLICY "Users can update messages (mark as read)"
ON public.messages FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR is_admin())
    )
);

-- 8. Enable Realtime
-- Important: You must run this to receive live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ==============================================================================
-- STORAGE BUCKET CONFIGURATION (Run manually in Dashboard if needed)
-- ==============================================================================
-- Bucket Name: chat-attachments
-- Public: false
-- Allowed MIME types: image/*, video/*, application/pdf, etc.

-- Policies (template):
-- CREATE POLICY "Give users access to own folder 1u1g25_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Give users access to own folder 1u1g25_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
