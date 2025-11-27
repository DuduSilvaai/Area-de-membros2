-- =====================================================
-- SCRIPT SQL: Sistema LMS Core com Controle Granular
-- =====================================================
-- Descrição: Cria estrutura completa para plataforma de área de membros
-- com portais, módulos hierárquicos, conteúdos e sistema de matrículas
-- com permissões granulares via JSONB.
--
-- Ordem de Execução:
-- 1. Tabelas
-- 2. Índices
-- 3. Triggers
-- 4. Functions
-- 5. Row-Level Security (RLS)
--
-- ATENÇÃO: Execute este script no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CRIAÇÃO DE TABELAS
-- =====================================================

-- ----------------------------------------------------
-- 1.1 Tabela: portals
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 3),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.portals IS 'Portais/Cursos principais da plataforma';
COMMENT ON COLUMN public.portals.settings IS 'Configurações customizadas do portal (tema, logo, etc)';

-- ----------------------------------------------------
-- 1.2 Atualização: modules (adicionar portal_id e hierarquia)
-- ----------------------------------------------------
-- Verificar se as colunas já existem antes de adicionar
DO $$
BEGIN
  -- Adicionar portal_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'modules' AND column_name = 'portal_id'
  ) THEN
    ALTER TABLE public.modules ADD COLUMN portal_id UUID REFERENCES public.portals(id) ON DELETE CASCADE;
  END IF;

  -- Adicionar parent_module_id se não existir (auto-referência para hierarquia)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'modules' AND column_name = 'parent_module_id'
  ) THEN
    ALTER TABLE public.modules ADD COLUMN parent_module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE;
  END IF;

  -- Adicionar is_active se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'modules' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.modules ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.modules.portal_id IS 'Portal ao qual o módulo pertence';
COMMENT ON COLUMN public.modules.parent_module_id IS 'Módulo pai (NULL = módulo raiz)';

-- ----------------------------------------------------
-- 1.3 Atualização: contents (garantir estrutura correta)
-- ----------------------------------------------------
DO $$
BEGIN
  -- Adicionar order_index se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contents' AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.contents ADD COLUMN order_index INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- Adicionar content_type se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contents' AND column_name = 'content_type'
  ) THEN
    ALTER TABLE public.contents ADD COLUMN content_type TEXT DEFAULT 'video' CHECK (content_type IN ('video', 'text', 'pdf', 'quiz', 'external'));
  END IF;

  -- Adicionar is_active se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contents' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.contents ADD COLUMN is_active BOOLEAN DEFAULT TRUE NOT NULL;
  END IF;
END $$;

-- ----------------------------------------------------
-- 1.4 Tabela CRÍTICA: enrollments (Matrículas)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  portal_id UUID NOT NULL REFERENCES public.portals(id) ON DELETE CASCADE,
  
  -- Campo CRÍTICO: Permissões em JSONB
  permissions JSONB DEFAULT '{"access_all": false, "allowed_modules": []}'::jsonb NOT NULL,
  
  enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  enrolled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Garante que um usuário não tenha matrículas duplicadas no mesmo portal
  CONSTRAINT unique_user_portal UNIQUE (user_id, portal_id)
);

COMMENT ON TABLE public.enrollments IS 'Matrículas de usuários em portais com permissões granulares';
COMMENT ON COLUMN public.enrollments.permissions IS 'Estrutura: {"access_all": boolean, "allowed_modules": ["uuid1", "uuid2"]}';

-- Exemplo de estrutura do JSONB permissions:
-- {
--   "access_all": false,
--   "allowed_modules": ["550e8400-e29b-41d4-a716-446655440000", "..."],
--   "access_granted_at": "2025-01-15T10:00:00Z",
--   "granted_by": "admin-uuid"
-- }

-- =====================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para portals
CREATE INDEX IF NOT EXISTS idx_portals_created_by ON public.portals(created_by);
CREATE INDEX IF NOT EXISTS idx_portals_is_active ON public.portals(is_active) WHERE is_active = TRUE;

-- Índices para modules
CREATE INDEX IF NOT EXISTS idx_modules_portal_id ON public.modules(portal_id);
CREATE INDEX IF NOT EXISTS idx_modules_parent_id ON public.modules(parent_module_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON public.modules(portal_id, order_index);

-- Índices para contents
CREATE INDEX IF NOT EXISTS idx_contents_module_id ON public.contents(module_id);
CREATE INDEX IF NOT EXISTS idx_contents_order ON public.contents(module_id, order_index);

-- Índices para enrollments (CRÍTICOS para performance de queries de permissão)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_portal_id ON public.enrollments(portal_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_portal ON public.enrollments(user_id, portal_id);

-- Índice GIN para queries em campo JSONB (permite buscar dentro do JSON)
CREATE INDEX IF NOT EXISTS idx_enrollments_permissions ON public.enrollments USING gin(permissions);

-- =====================================================
-- 3. TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para portals
DROP TRIGGER IF EXISTS update_portals_updated_at ON public.portals;
CREATE TRIGGER update_portals_updated_at
  BEFORE UPDATE ON public.portals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para modules
DROP TRIGGER IF EXISTS update_modules_updated_at ON public.modules;
CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para contents
DROP TRIGGER IF EXISTS update_contents_updated_at ON public.contents;
CREATE TRIGGER update_contents_updated_at
  BEFORE UPDATE ON public.contents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 4. FUNCTIONS HELPERS
-- =====================================================

-- ----------------------------------------------------
-- 4.1 Function: Buscar módulos acessíveis por usuário
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_accessible_modules(
  p_user_id UUID,
  p_portal_id UUID
)
RETURNS SETOF public.modules
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT m.*
  FROM public.modules m
  WHERE m.portal_id = p_portal_id
    AND m.is_active = TRUE
    AND EXISTS (
      SELECT 1
      FROM public.enrollments e
      WHERE e.user_id = p_user_id
        AND e.portal_id = p_portal_id
        AND e.is_active = TRUE
        AND (
          -- Acesso total ao portal
          (e.permissions->>'access_all')::boolean = TRUE
          OR
          -- Acesso granular ao módulo específico
          m.id::text = ANY(
            SELECT jsonb_array_elements_text(e.permissions->'allowed_modules')
          )
        )
    )
  ORDER BY m.order_index;
END;
$$;

COMMENT ON FUNCTION public.get_user_accessible_modules IS 'Retorna módulos que o usuário tem permissão de acessar';

-- ----------------------------------------------------
-- 4.2 Function: Verificar se usuário tem acesso ao portal
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_portal_access(
  p_user_id UUID,
  p_portal_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE user_id = p_user_id
      AND portal_id = p_portal_id
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- ----------------------------------------------------
-- 4.3 Function: Verificar se usuário tem acesso a módulo específico
-- ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_has_module_access(
  p_user_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_portal_id UUID;
BEGIN
  -- Buscar o portal_id do módulo
  SELECT portal_id INTO v_portal_id
  FROM public.modules
  WHERE id = p_module_id;

  IF v_portal_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.enrollments
    WHERE user_id = p_user_id
      AND portal_id = v_portal_id
      AND is_active = TRUE
      AND (
        (permissions->>'access_all')::boolean = TRUE
        OR
        p_module_id::text = ANY(
          SELECT jsonb_array_elements_text(permissions->'allowed_modules')
        )
      )
  );
END;
$$;

-- =====================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- CRÍTICO: Sem RLS, qualquer usuário autenticado poderia
-- acessar todos os dados. As policies garantem isolamento.

-- ----------------------------------------------------
-- 5.1 RLS para PORTALS
-- ----------------------------------------------------
ALTER TABLE public.portals ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins têm acesso total a portals" ON public.portals;
CREATE POLICY "Admins têm acesso total a portals"
  ON public.portals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role' = 'admin'
             OR auth.users.email LIKE '%@admin.%')  -- Ajustar lógica conforme sua autenticação
    )
  );

-- Policy: Alunos podem ver apenas portais onde estão matriculados
DROP POLICY IF EXISTS "Alunos veem portals onde têm enrollment" ON public.portals;
CREATE POLICY "Alunos veem portals onde têm enrollment"
  ON public.portals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.enrollments
      WHERE enrollments.portal_id = portals.id
        AND enrollments.user_id = auth.uid()
        AND enrollments.is_active = TRUE
    )
  );

-- ----------------------------------------------------
-- 5.2 RLS para MODULES
-- ----------------------------------------------------
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins têm acesso total a modules" ON public.modules;
CREATE POLICY "Admins têm acesso total a modules"
  ON public.modules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role' = 'admin'
             OR auth.users.email LIKE '%@admin.%')
    )
  );

-- Policy: Alunos veem apenas módulos permitidos
DROP POLICY IF EXISTS "Alunos veem apenas modules permitidos" ON public.modules;
CREATE POLICY "Alunos veem apenas modules permitidos"
  ON public.modules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.enrollments e
      WHERE e.user_id = auth.uid()
        AND e.portal_id = modules.portal_id
        AND e.is_active = TRUE
        AND (
          (e.permissions->>'access_all')::boolean = TRUE
          OR
          modules.id::text = ANY(
            SELECT jsonb_array_elements_text(e.permissions->'allowed_modules')
          )
        )
    )
  );

-- ----------------------------------------------------
-- 5.3 RLS para CONTENTS
-- ----------------------------------------------------
ALTER TABLE public.contents ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins têm acesso total a contents" ON public.contents;
CREATE POLICY "Admins têm acesso total a contents"
  ON public.contents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role' = 'admin'
             OR auth.users.email LIKE '%@admin.%')
    )
  );

-- Policy: Alunos veem contents de módulos permitidos
DROP POLICY IF EXISTS "Alunos veem contents de modules permitidos" ON public.contents;
CREATE POLICY "Alunos veem contents de modules permitidos"
  ON public.contents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.modules m
      INNER JOIN public.enrollments e ON e.portal_id = m.portal_id
      WHERE m.id = contents.module_id
        AND e.user_id = auth.uid()
        AND e.is_active = TRUE
        AND (
          (e.permissions->>'access_all')::boolean = TRUE
          OR
          m.id::text = ANY(
            SELECT jsonb_array_elements_text(e.permissions->'allowed_modules')
          )
        )
    )
  );

-- ----------------------------------------------------
-- 5.4 RLS para ENROLLMENTS
-- ----------------------------------------------------
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Admins podem fazer tudo
DROP POLICY IF EXISTS "Admins têm acesso total a enrollments" ON public.enrollments;
CREATE POLICY "Admins têm acesso total a enrollments"
  ON public.enrollments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
        AND (auth.users.raw_user_meta_data->>'role' = 'admin'
             OR auth.users.email LIKE '%@admin.%')
    )
  );

-- Policy: Usuários podem ver suas próprias matrículas
DROP POLICY IF EXISTS "Usuários veem suas próprias enrollments" ON public.enrollments;
CREATE POLICY "Usuários veem suas próprias enrollments"
  ON public.enrollments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 6. DADOS DE TESTE (OPCIONAL)
-- =====================================================
-- Descomentar para inserir dados de exemplo

/*
-- Inserir portal de exemplo
INSERT INTO public.portals (name, description, image_url)
VALUES 
  ('Curso de Next.js Avançado', 'Aprenda Next.js do zero ao avançado', 'https://example.com/nextjs.png'),
  ('Masterclass de TypeScript', 'Domine TypeScript com projetos práticos', 'https://example.com/ts.png')
ON CONFLICT DO NOTHING;

-- Importante: Substituir os UUIDs abaixo pelos IDs reais gerados
-- Para obter os IDs: SELECT id, name FROM public.portals;
*/

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
  missing_tables TEXT[];
BEGIN
  SELECT array_agg(table_name)
  INTO missing_tables
  FROM (VALUES ('portals'), ('modules'), ('contents'), ('enrollments')) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = expected.table_name
  );

  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Tabelas ausentes: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE '✅ Todas as tabelas foram criadas com sucesso!';
  END IF;
END $$;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
-- Para próximos passos:
-- 1. Executar: `npx supabase gen types typescript --project-id <PROJECT_ID> > types/supabase.ts`
-- 2. Atualizar types no front-end
-- 3. Implementar interfaces admin
-- 4. Implementar hook useStudentAccess
-- =====================================================
