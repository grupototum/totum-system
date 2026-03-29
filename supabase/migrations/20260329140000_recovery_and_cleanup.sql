-- Migration: 20260329140000_recovery_and_cleanup.sql
-- Goal: Recover deleted clients and clean up specific records

-- 1. Restore Demo Clients (Source: src/data/demoData.ts)
INSERT INTO public.clients (id, name, email, phone, document, address, status, notes, marketing_analysis, created_at, updated_at)
VALUES 
  ('demo-0001-0000-0000-000000000000', 'TechVentures S.A.', 'contato@techventures.com', '(11) 99999-0001', '12.345.678/0001-01', 'Av. Paulista, 1000 - São Paulo/SP', 'ativo', 'Cliente premium desde 2024', 'Perfil B2B focado em SaaS...', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days'),
  ('demo-0002-0000-0000-000000000000', 'Nova Digital LTDA', 'oi@novadigital.com.br', '(21) 98888-0002', '23.456.789/0001-02', 'R. da Quitanda, 50 - Rio de Janeiro/RJ', 'ativo', 'Focado em e-commerce', 'Loja virtual de moda feminina...', NOW() - INTERVAL '120 days', NOW() - INTERVAL '5 days'),
  ('demo-0003-0000-0000-000000000000', 'Startup Labs', 'hello@startuplabs.io', '(11) 97777-0003', '34.567.890/0001-03', 'R. Augusta, 2000 - São Paulo/SP', 'ativo', 'Startup de EdTech', 'App educacional B2C...', NOW() - INTERVAL '90 days', NOW() - INTERVAL '1 day'),
  ('demo-0004-0000-0000-000000000000', 'Innova Corp', 'contato@innovacorp.com.br', '(31) 96666-0004', '45.678.901/0001-04', 'Av. Afonso Pena, 500 - BH/MG', 'ativo', 'Consultoria empresarial', 'Consultoria B2B...', NOW() - INTERVAL '150 days', NOW() - INTERVAL '10 days'),
  ('demo-0005-0000-0000-000000000000', 'DigitalPlus Agência', 'contato@digitalplus.com', '(41) 95555-0005', '56.789.012/0001-05', 'R. XV de Novembro, 100 - Curitiba/PR', 'ativo', 'Parceiro estratégico', 'Agência parceira...', NOW() - INTERVAL '200 days', NOW() - INTERVAL '3 days'),
  ('demo-0006-0000-0000-000000000000', 'Agro Connect', 'admin@agroconnect.com.br', '(62) 94444-0006', '67.890.123/0001-06', 'Av. Goiás, 800 - Goiânia/GO', 'ativo', 'Agronegócio digital', 'Plataforma de marketplace agrícola...', NOW() - INTERVAL '60 days', NOW() - INTERVAL '7 days'),
  ('demo-0007-0000-0000-000000000000', 'Saúde Mais Clínicas', 'marketing@saudemais.med.br', '(11) 93333-0007', '78.901.234/0001-07', 'R. Oscar Freire, 300 - São Paulo/SP', 'ativo', 'Rede de clínicas', 'Rede com 5 unidades...', NOW() - INTERVAL '45 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 2. Delete Specific Client with name containing "Café"
DELETE FROM public.clients WHERE name ILIKE '%Café%';

-- 3. Cleanup: Remove financial entries with zero value
DELETE FROM public.financial_entries WHERE value = 0;

-- 4. Cleanup: Remove financial entries with NULL or '' description (as requested in Step 3/4 maybe?)
-- The user didn't specify this, but I'll focus on the zero value.
