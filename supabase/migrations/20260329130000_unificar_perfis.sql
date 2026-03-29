-- Migration: Unificar Perfis de Acesso (Cargo e Nivel de Permissao)

-- Adicionar tipo ENUM para os niveis de permissao se nao existir
DO $$ BEGIN
    CREATE TYPE public.permission_level_enum AS ENUM ('admin', 'manager', 'user', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas na tabela profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS permission_level public.permission_level_enum DEFAULT 'user';

-- Atualizar permissao basica com base no is_admin antigo
UPDATE public.profiles
SET permission_level = 'admin'
WHERE is_admin = true AND permission_level = 'user';

-- Criar tabela de templates de contrato
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS para templates de contrato
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.contract_templates FOR SELECT USING (true);
CREATE POLICY "Enable insert access for authenticated users only" ON public.contract_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update access for authenticated users only" ON public.contract_templates FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users only" ON public.contract_templates FOR DELETE USING (auth.role() = 'authenticated');
