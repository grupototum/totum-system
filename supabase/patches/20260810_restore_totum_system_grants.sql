-- Production hotfix — 2026-08-10.
--
-- Sintoma: dashboard zerado / dados "sumidos" para todos os logins. O console do
-- app retornava, na resolução de tenant:
--     {code: 42501, message: "permission denied for schema totum_system"}
--
-- Causa raiz: o banco self-hosted foi migrado de uma VPS para outra via
-- pg_dump/restore. O baseline (00000000000000_baseline_totum_system.sql) é um
-- pg_dump SEM privilégios — não contém nenhum GRANT. Ao restaurar na instância
-- nova, o schema totum_system foi recriado, mas os papéis da API do PostgREST
-- (anon, authenticated, service_role) ficaram sem USAGE no schema e sem acesso
-- às tabelas. Os dados estavam intactos, apenas inacessíveis pela API.
--
-- Segurança: conceder acesso amplo a anon/authenticated é o padrão do Supabase —
-- quem filtra por linha/tenant é o RLS. As 65 tabelas do schema têm RLS
-- habilitado (65x ENABLE ROW LEVEL SECURITY, 96 policies no baseline).
-- PRÉ-CONDIÇÃO verificada antes de aplicar: nenhuma tabela com rowsecurity=false.
--
-- Aplicado manualmente por Israel (Rael) no SQL Editor do Supabase Studio.
-- Este arquivo registra o SQL exato executado, para rastreabilidade.

BEGIN;

-- Papéis da API podem usar o schema.
GRANT USAGE ON SCHEMA totum_system TO anon, authenticated, service_role;

-- Acesso às tabelas existentes (RLS continua sendo o filtro por linha/tenant).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA totum_system
  TO anon, authenticated, service_role;

-- Sequences (necessário para inserts).
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA totum_system
  TO anon, authenticated, service_role;

-- Funções/RPCs (ex: resolve_organization_by_host).
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA totum_system
  TO anon, authenticated, service_role;

-- Objetos FUTUROS herdam os grants (evita repetir isto a cada migration).
ALTER DEFAULT PRIVILEGES IN SCHEMA totum_system
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA totum_system
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA totum_system
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

COMMIT;
