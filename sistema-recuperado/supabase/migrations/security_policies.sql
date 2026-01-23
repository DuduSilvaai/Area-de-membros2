-- =====================================================
-- POLÍTICAS DE SEGURANÇA RLS (Row Level Security)
-- Execute no Supabase SQL Editor
-- =====================================================
-- Este script implementa políticas de segurança para proteger
-- dados sensíveis e garantir que usuários só acessem o que
-- está autorizado.
-- =====================================================

-- =====================================================
-- HABILITAR RLS EM TODAS AS TABELAS CRÍTICAS
-- =====================================================

ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCTION: Verificar se usuário é admin
-- =====================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PROFILES
-- =====================================================

-- Remover políticas existentes (se existirem)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

-- Usuários podem atualizar próprio perfil (exceto role)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        -- Não permitir que usuário mude próprio role
        AND (role IS NOT DISTINCT FROM (SELECT role FROM profiles WHERE id = auth.uid()))
    );

-- =====================================================
-- ENROLLMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins have full enrollment access" ON enrollments;

-- Usuários podem ver suas próprias matrículas ativas
CREATE POLICY "Users can view own enrollments"
    ON enrollments FOR SELECT
    USING (user_id = auth.uid() AND is_active = true);

-- Admins têm acesso total a enrollments
CREATE POLICY "Admins have full enrollment access"
    ON enrollments FOR ALL
    USING (is_admin());

-- =====================================================
-- COMMENTS
-- =====================================================

DROP POLICY IF EXISTS "Users can view comments on accessible lessons" ON comments;
DROP POLICY IF EXISTS "Users can create comments on accessible lessons" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Admins have full comment access" ON comments;

-- Usuários podem ver comentários de lições que têm acesso
CREATE POLICY "Users can view comments on accessible lessons"
    ON comments FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM contents c
            JOIN modules m ON c.module_id = m.id
            JOIN enrollments e ON e.portal_id = m.portal_id
            WHERE c.id = comments.content_id
            AND e.user_id = auth.uid()
            AND e.is_active = true
        )
    );

-- Usuários podem criar comentários em lições que têm acesso
CREATE POLICY "Users can create comments on accessible lessons"
    ON comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM contents c
            JOIN modules m ON c.module_id = m.id
            JOIN enrollments e ON e.portal_id = m.portal_id
            WHERE c.id = content_id
            AND e.user_id = auth.uid()
            AND e.is_active = true
        )
    );

-- Usuários podem editar/deletar próprios comentários
CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins têm acesso total
CREATE POLICY "Admins have full comment access"
    ON comments FOR ALL
    USING (is_admin());

-- =====================================================
-- MESSAGES
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;

-- Usuários podem ver mensagens de suas conversas
CREATE POLICY "Users can view messages in their conversations"
    ON messages FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM conversations
            WHERE id = messages.conversation_id
            AND (student_id = auth.uid() OR admin_id = auth.uid())
        )
    );

-- Usuários podem enviar mensagens em suas conversas
CREATE POLICY "Users can send messages in their conversations"
    ON messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM conversations
            WHERE id = conversation_id
            AND (student_id = auth.uid() OR admin_id = auth.uid())
        )
    );

-- =====================================================
-- CONVERSATIONS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Admins have full conversation access" ON conversations;

-- Usuários podem ver suas próprias conversas
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (student_id = auth.uid() OR admin_id = auth.uid());

-- Admins têm acesso total
CREATE POLICY "Admins have full conversation access"
    ON conversations FOR ALL
    USING (is_admin());

-- =====================================================
-- PROGRESS
-- =====================================================

DROP POLICY IF EXISTS "Users can view own progress" ON progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON progress;
DROP POLICY IF EXISTS "Users can update own progress" ON progress;

-- Usuários podem ver próprio progresso
CREATE POLICY "Users can view own progress"
    ON progress FOR SELECT
    USING (user_id = auth.uid() OR is_admin());

-- Usuários podem registrar próprio progresso
CREATE POLICY "Users can insert own progress"
    ON progress FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar próprio progresso
CREATE POLICY "Users can update own progress"
    ON progress FOR UPDATE
    USING (user_id = auth.uid());

-- =====================================================
-- ACCESS LOGS
-- =====================================================

DROP POLICY IF EXISTS "Only admins can view logs" ON access_logs;
DROP POLICY IF EXISTS "Anyone can insert logs" ON access_logs;

-- Apenas admins podem ver logs
CREATE POLICY "Only admins can view logs"
    ON access_logs FOR SELECT
    USING (is_admin());

-- Qualquer um pode inserir logs (para logging de login, etc)
CREATE POLICY "Anyone can insert logs"
    ON access_logs FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- PORTALS
-- =====================================================

DROP POLICY IF EXISTS "Users can view enrolled portals" ON portals;
DROP POLICY IF EXISTS "Admins have full portal access" ON portals;

-- Usuários podem ver portais onde estão matriculados
CREATE POLICY "Users can view enrolled portals"
    ON portals FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE portal_id = portals.id
            AND user_id = auth.uid()
            AND is_active = true
        )
    );

-- Admins têm acesso total
CREATE POLICY "Admins have full portal access"
    ON portals FOR ALL
    USING (is_admin());

-- =====================================================
-- MODULES
-- =====================================================

DROP POLICY IF EXISTS "Users can view accessible modules" ON modules;
DROP POLICY IF EXISTS "Admins have full module access" ON modules;

-- Usuários podem ver módulos de portais onde estão matriculados
CREATE POLICY "Users can view accessible modules"
    ON modules FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM enrollments e
            WHERE e.portal_id = modules.portal_id
            AND e.user_id = auth.uid()
            AND e.is_active = true
            AND (
                (e.permissions->>'access_all')::boolean = true 
                OR modules.id::text = ANY(
                    SELECT jsonb_array_elements_text(e.permissions->'allowed_modules')
                )
            )
        )
    );

-- Admins têm acesso total
CREATE POLICY "Admins have full module access"
    ON modules FOR ALL
    USING (is_admin());

-- =====================================================
-- CONTENTS (Aulas)
-- =====================================================

DROP POLICY IF EXISTS "Users can view accessible contents" ON contents;
DROP POLICY IF EXISTS "Admins have full content access" ON contents;

-- Usuários podem ver conteúdos de módulos acessíveis
CREATE POLICY "Users can view accessible contents"
    ON contents FOR SELECT
    USING (
        is_admin() OR
        EXISTS (
            SELECT 1 FROM modules m
            JOIN enrollments e ON e.portal_id = m.portal_id
            WHERE m.id = contents.module_id
            AND e.user_id = auth.uid()
            AND e.is_active = true
            AND (
                (e.permissions->>'access_all')::boolean = true 
                OR m.id::text = ANY(
                    SELECT jsonb_array_elements_text(e.permissions->'allowed_modules')
                )
            )
        )
    );

-- Admins têm acesso total
CREATE POLICY "Admins have full content access"
    ON contents FOR ALL
    USING (is_admin());

-- =====================================================
-- ÍNDICES DE SEGURANÇA E PERFORMANCE
-- =====================================================

-- Índice para lookup rápido de role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Índice para verificação de enrollment
CREATE INDEX IF NOT EXISTS idx_enrollments_user_portal_active 
    ON enrollments(user_id, portal_id, is_active);

-- Índice para auditoria
CREATE INDEX IF NOT EXISTS idx_access_logs_user_action 
    ON access_logs(user_id, action, created_at DESC);

-- Índice para busca de comentários por conteúdo
CREATE INDEX IF NOT EXISTS idx_comments_content_id 
    ON comments(content_id);

-- Índice para busca de mensagens por conversa
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
    ON messages(conversation_id);

-- Índice para busca de progresso por usuário
CREATE INDEX IF NOT EXISTS idx_progress_user_id 
    ON progress(user_id);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Garantir que authenticated users podem usar a função is_admin
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- =====================================================
-- CONFIRMAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Políticas de segurança RLS aplicadas com sucesso!';
    RAISE NOTICE 'Lembre-se de testar as políticas com diferentes roles de usuário.';
END $$;
