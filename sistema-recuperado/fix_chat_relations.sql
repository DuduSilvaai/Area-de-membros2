-- FIX: Add Foreign Keys to profiles table to enable joins in the UI 
-- Run this in Supabase SQL Editor

-- 1. Add FK from conversations.student_id to profiles.id
ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_student_id_profiles_fkey
    FOREIGN KEY (student_id)
    REFERENCES public.profiles(id);

-- 2. Add FK from conversations.admin_id to profiles.id
ALTER TABLE public.conversations
    ADD CONSTRAINT conversations_admin_id_profiles_fkey
    FOREIGN KEY (admin_id)
    REFERENCES public.profiles(id);

-- 3. Add FK from messages.sender_id to profiles.id
ALTER TABLE public.messages
    ADD CONSTRAINT messages_sender_id_profiles_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.profiles(id);
