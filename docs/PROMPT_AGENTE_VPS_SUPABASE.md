# Prompts para o agente de IA da VPS — Incidente Totum System
> Gerado em 2026-07-10, revisado após leitura de RUNBOOK_MIGRACAO / AUDITORIA_TOTUM-SYSTEM (03/jul).
> Contexto: produção (totum.pixelsystem.online, Vercel) aponta para o Supabase Cloud antigo
> `fgosozxvhbdhqigwzqih.supabase.co`, que não existe mais (NXDOMAIN). O banco foi migrado para
> self-hosted na VPS (Coolify). Kong responde em `https://supa.grupototum.com` (401 sem apikey =
> saudável); `system/sistema/gestao.grupototum.com` retornam 421/503 (não servem).

## 🔴 ALERTA CRÍTICO — validar a IDENTIDADE da stack ANTES de repontar/criar usuário

O runbook de migração definia o destino como **`system.grupototum.com`** (stack Coolify
`supabase-sistema`, uuid `uoj4asr9z1div18acqrrf0tl`) — NÃO `supa.grupototum.com`. A auditoria
recomendou **NÃO mesclar o totum-system na `supa`**, que é a stack compartilhada com o uPixel
(tem tabelas de nome colidente: `tasks`, `profiles`, `organizations`, `notifications`, `audit_logs`).

Como o Kong vivo está em `supa`, há duas hipóteses e o diagnóstico precisa distinguir qual é:
- (H1) o cutover caiu na stack `supa` compartilhada → **risco de colisão com dados do uPixel**;
- (H2) `supa` na verdade é a stack dedicada do Totum (só o nome do domínio confunde).

**Impressão digital do totum-system, registrada pela auditoria de 03/jul (o banco certo bate com estes números):**
7 auth users · 65 tabelas · 20 funcs · 7 triggers · tasks **139** · task_history **247** ·
asaas_payments **51** · products **37** · clients **16** · contracts **13** · organizations **2** · 3 buckets storage.

Se os números do Prompt 1 (item 3) baterem com isso e NÃO houver dados do uPixel misturados,
seguimos. Se divergirem, ou se aparecerem tabelas/dados do uPixel na mesma base → **PARAR** e me
avisar antes de qualquer escrita (Prompt 2) ou repoint da Vercel.

### ⚠️ A seção 0 do Prompt 1 pode bifurcar em DOIS caminhos — não assuma que ela só libera o Prompt 2

- **Caminho H2 (stack dedicada, limpa):** counts batem com o baseline, sem tabelas do uPixel.
  → Segue o fluxo normal: chave ANON (seção 2) → Prompt 2 (usuários) → repoint da Vercel.

- **Caminho H1 (mesclada com o uPixel):** aparecem `leads`/`deals`/`pipelines`/`kommo_sync`, ou os
  counts do Totum divergem/estão contaminados. → **NÃO** é um fix de 5 minutos e **NÃO** se resolve
  rodando o Prompt 2. Como `system/sistema/gestao.grupototum.com` estão em 421/503 (a stack dedicada
  `supabase-sistema` que o runbook previa não está no ar), a saída correta passa a ser **provisionar
  do zero a stack dedicada** (subir `supabase-sistema`, restaurar o dump do Totum nela, redeploy das
  13 edge functions, repontar webhooks) — ou seja, retomar o RUNBOOK_MIGRACAO a partir do STEP 2,
  como um **projeto novo / segundo handoff**, não como continuação deste. Nesse caso, PARE aqui e
  escale — não crie usuário nem reaponte a Vercel para a stack mesclada.

---

## PROMPT 1 — Diagnóstico + identidade da stack (somente leitura, NÃO altere nada)

```
Você vai diagnosticar a stack Supabase self-hosted que responde em https://supa.grupototum.com
(rodando via Coolify neste servidor) e CONFIRMAR se ela é a stack dedicada do Totum System ou a
stack compartilhada com o uPixel. NÃO altere config, NÃO reinicie serviços, NÃO rode
UPDATE/INSERT/DELETE — apenas leitura. Relatório em markdown com todas as seções abaixo.

0. IDENTIDADE DA STACK (decisivo — rode primeiro)
   - No Coolify/Docker, diga o NOME e UUID da stack a que pertence o container de Postgres que
     atende https://supa.grupototum.com (esperado pelo runbook: `supabase-sistema`,
     uuid uoj4asr9z1div18acqrrf0tl — confirme se é este mesmo ou outro).
   - Quantos bancos/stacks Supabase existem neste servidor? Liste nome + domínio de cada um
     (procuro saber se `supa`, `system`, `sistema`, `gestao` são a MESMA stack ou stacks distintas).
   - No Postgres desta stack, rode (só SELECT) para detectar contaminação com uPixel:
       select current_database();
       -- marcadores de que é o banco do TOTUM (devem existir):
       select to_regclass('public.asaas_payments') as tem_asaas,
              to_regclass('public.contracts')       as tem_contracts,
              to_regclass('public.company_settings') as tem_company_settings;
       -- marcadores de que seria o banco do uPixel/CRM (NÃO deveriam existir aqui):
       select to_regclass('public.leads')     as tem_leads,
              to_regclass('public.deals')     as tem_deals,
              to_regclass('public.pipelines') as tem_pipelines,
              to_regclass('public.kommo_sync') as tem_kommo;
   - Compare as CONTAGENS abaixo com o baseline da auditoria (tasks 139, task_history 247,
     asaas_payments 51, products 37, clients 16, contracts 13, organizations 2):
       select 'tasks' t, count(*) from public.tasks
       union all select 'task_history', count(*) from public.task_history
       union all select 'asaas_payments', count(*) from public.asaas_payments
       union all select 'products', count(*) from public.products
       union all select 'clients', count(*) from public.clients
       union all select 'contracts', count(*) from public.contracts
       union all select 'organizations', count(*) from public.organizations;
   → Se `tem_leads/deals/pipelines/kommo` vierem preenchidos (tabela existe) E os counts do Totum
     divergirem muito do baseline, é a stack ERRADA (uPixel) — PARE e me avise.

1. SAÚDE DA STACK
   - Containers da stack (db, kong, auth/gotrue, rest/postgrest, functions/edge-runtime, storage,
     studio) e estado de cada um.
   - Últimas ~30 linhas de log do container de functions (o /functions/v1 retorna 500 — quero a causa)
     e do gotrue (auth).

2. CHAVES (para reconectar o frontend) — só se a seção 0 confirmar que é o banco do Totum
   - URL pública da API e a chave ANON (pública, vai no frontend). NÃO inclua a service_role key.

3. DADOS
   select count(*) as usuarios_auth from auth.users;
   select count(*) as perfis from public.profiles;
   select count(*) filter (where organization_id is null) as perfis_orfaos from public.profiles;
   select count(*) as admins from public.user_roles where role = 'admin';
   select public.has_any_admin();
   select email, created_at from auth.users order by created_at desc limit 10;
   select exists(select 1 from auth.users where email = 'dev@grupototum.com') as admin_antigo_existe;
   select exists(select 1 from auth.users where email = 'israelassislemos@gmail.com') as israel_gmail_existe;
   select enum_range(null::public.user_status) as valores_enum_status;
   select table_name from information_schema.tables where table_schema='public'
     and table_name in ('organizations','organization_memberships','organization_domains','organization_settings');
   select proname, proacl from pg_proc where proname in ('has_any_admin','resolve_organization_by_host');
   select id, name, slug from public.organizations limit 5;

4. CONFIG DO AUTH (GoTrue) — só ler variáveis de ambiente do container auth:
   - GOTRUE_SITE_URL (deveria ser https://totum.pixelsystem.online)
   - GOTRUE_URI_ALLOW_LIST (deveria incluir https://totum.pixelsystem.online e *.pixelsystem.online)
   - GOTRUE_EXTERNAL_GOOGLE_ENABLED / CLIENT_ID configurado? (login Google depende disso)
   - GOTRUE_DISABLE_SIGNUP
   - NÃO inclua GOTRUE_JWT_SECRET na resposta — apenas confirme que a chave ANON do item 2 foi
     assinada com o JWT secret atual da stack (stack não teve o secret trocado após gerar as chaves).

5. FUNCTIONS
   - Quais edge functions estão deployadas (esperadas 13: bootstrap-admin, admin-update-user,
     generate-api-key, api-v1, asaas-proxy, asaas-webhook, whatsapp-webhook, provision-subdomain,
     generate-tasks, generate-checklists, archive-tasks, generate-recurring-tasks).

Formato: relatório markdown com cada seção, resultados brutos das queries. Nada além do pedido.
```

---

## PROMPT 2 — Criação de usuários (SÓ rodar se o Prompt 1 seção 0 confirmar que É o banco do Totum, sem contaminação uPixel)

```
Contexto: a stack self-hosted foi CONFIRMADA como o banco do Totum System (seção 0 do diagnóstico
bateu com o baseline da auditoria e sem tabelas/dados do uPixel misturados). Use o host que o
diagnóstico apontou como correto. Agora execute,
usando a service_role key LOCALMENTE (sem expô-la na resposta):

1. Criar/garantir o usuário master:
   - Email: israelassislemos@gmail.com | Senha: Totum@ADM2026 | email_confirm: true
   - Via API admin do GoTrue: POST https://supa.grupototum.com/auth/v1/admin/users
     com Authorization: Bearer <service_role> e apikey: <service_role>.
   - Se o usuário já existir, apenas atualize a senha via PUT /auth/v1/admin/users/<id>.
   - Depois, no Postgres:
     update public.profiles set is_master = true, status = 'ativo',
       organization_id = coalesce(organization_id, (select id from public.organizations where slug='totum' limit 1))
       where user_id = (select id from auth.users where email='israelassislemos@gmail.com');
     insert into public.user_roles (user_id, role)
       select id, 'admin' from auth.users where email='israelassislemos@gmail.com'
       on conflict do nothing;

2. Criar os usuários Mylena e Felipe (mesma senha Totum@ADM2026, email_confirm true):
   - Emails: use os emails reais se o Israel informar; caso contrário pergunte antes de inventar emails.
   - Depois de criados, no Postgres: garanta status='ativo' e organization_id preenchido
     (mesmo UPDATE do item 1, trocando o email).

3. Verificação final (me devolva o resultado):
   select u.email, p.status, p.is_master, p.organization_id is not null as tem_org,
          exists(select 1 from public.user_roles r where r.user_id=u.id and r.role='admin') as is_admin
     from auth.users u join public.profiles p on p.user_id = u.id
    where u.email in ('israelassislemos@gmail.com');

Não altere mais nada além do descrito. Não exponha a service_role key nem senhas no relatório.
```

---

## Depois disso — passos na Vercel (Israel, manual, ~2 min)

**Só execute após o Prompt 1 confirmar a identidade da stack.** Use como `VITE_SUPABASE_URL` o
host que o diagnóstico apontou como o banco DEDICADO do Totum — provavelmente `https://supa.grupototum.com`
se a seção 0 confirmar que não há contaminação com uPixel; senão, o host da stack `supabase-sistema`
(o runbook previa `https://system.grupototum.com`, que hoje não está servindo — pode precisar ser
levantada/repontada antes).

1. https://vercel.com → projeto do Totum System → **Settings → Environment Variables** (ambiente Production):
   - `VITE_SUPABASE_URL` = `<host confirmado pelo diagnóstico>`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `<chave ANON devolvida pelo Prompt 1>`
2. **Deployments → Redeploy** no último deployment (as env vars só entram no bundle num build novo).
3. Testar em aba anônima: `https://totum.pixelsystem.online/login` deve mostrar o formulário
   e aceitar os logins antigos (os usuários migrados continuam com as senhas de sempre).

> Nota: os fixes de código desta branch (`useHasAdmin` falha-seguro + visibilidade de órfãos) já
> ajudam mesmo antes do repoint — mas o login só volta de fato quando `VITE_SUPABASE_URL` apontar
> para um banco vivo e correto. O repoint da env é o passo que resolve o incidente.

> Segurança: a senha compartilhada Totum@ADM2026 já apareceu em chats/docs — depois que
> o acesso voltar, cada usuário deve trocar a própria senha, e a do admin deve ser rotacionada.
