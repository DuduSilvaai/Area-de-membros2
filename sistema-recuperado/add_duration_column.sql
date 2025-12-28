-- Adicionar coluna duration_seconds se não existir
ALTER TABLE public.contents 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0;

-- Opcional: Atualizar linhas existentes para 0 se forem NULL (se a coluna já existia mas com nulos indesejados)
UPDATE public.contents SET duration_seconds = 0 WHERE duration_seconds IS NULL;
