# Prompts para o agente de IA da VPS — Incidente Totum System
> Gerado em 2026-07-10. Contexto: produção (totum.pixelsystem.online, Vercel) aponta para
> o Supabase cloud antigo `fgosozxvhbdhqigwzqih.supabase.co`, que não existe mais (NXDOMAIN).
> O banco foi migrado para Supabase self-hosted em `https://supa.grupototum.com` (Coolify).
> Gateway Kong responde (401 sem apikey = saudável); `/functions/v1/*` retorna 500.

---

## PROMPT 1 — Diagnóstico (somente leitura, NÃO altere nada)

```
Você vai diagnosticar a stack Supabase self-hosted do Totum System que roda neste servidor
via Coolify, respondendo em https://supa.grupototum.com. NÃO altere nenhuma configuração,
NÃO reinicie serviços, NÃO rode UPDATE/INSERT/DELETE — apenas leitura. Me devolva um
relatório com os itens abaixo.

1. SAÚDE DA STACK
   - Liste os containers da stack Supabase no Coolify/Docker (db, kong, auth/gotrue,
     rest/postgrest, functions, studio) e o estado de cada um.
   - Últimas ~30 linhas de log do container de functions (o endpoint /functions/v1
     está retornando 500) e do gotrue (auth).

2. CHAVES (para reconectar o frontend)
   - Me informe a URL pública da API (deve ser https://supa.grupototum.com) e a chave
     ANON (a chave pública que vai no frontend). NÃO inclua a service_role key na
     resposta — ela fica só no servidor.

3. DADOS (rode no Postgres da stack, ex.: docker exec <container-db> psql -U postgres, só SELECTs)
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
   - GOTRUE_URI_ALLOW_LIST (deveria incluir https://totum.pixelsystem.online e subdomínios *.pixelsystem.online)
   - GOTRUE_EXTERNAL_GOOGLE_ENABLED / CLIENT_ID configurado? (login Google depende disso)
   - GOTRUE_DISABLE_SIGNUP
   - Os valores de GOTRUE_JWT_SECRET NÃO devem ser incluídos na resposta — apenas confirme
     que a chave ANON informada no item 2 foi assinada com o JWT secret atual da stack
     (ou seja, que a stack não teve o JWT secret trocado depois da geração das chaves).

5. FUNCTIONS
   - Liste quais edge functions estão deployadas no container de functions
     (esperadas: bootstrap-admin, admin-update-user, api-v1, asaas-proxy, asaas-webhook,
     archive-tasks, generate-api-key, generate-checklists, generate-recurring-tasks,
     generate-tasks, provision-subdomain).

Formato da resposta: um relatório em markdown com cada seção acima, incluindo os
resultados brutos das queries. Não execute nada além do que foi pedido.
```

---

## PROMPT 2 — Criação de usuários (SÓ rodar depois do relatório do Prompt 1, se os dados estiverem lá)

```
Contexto: mesma stack Supabase self-hosted (https://supa.grupototum.com). O diagnóstico
anterior confirmou que o banco do Totum System está íntegro nesta stack. Agora execute,
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

1. https://vercel.com → projeto do Totum System → **Settings → Environment Variables** (ambiente Production):
   - `VITE_SUPABASE_URL` = `https://supa.grupototum.com`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `<chave ANON devolvida pelo Prompt 1>`
2. **Deployments → Redeploy** no último deployment (as env vars só entram no bundle num build novo).
3. Testar em aba anônima: `https://totum.pixelsystem.online/login` deve mostrar o formulário
   e aceitar os logins antigos (os usuários migrados continuam com as senhas de sempre).

> Segurança: a senha compartilhada Totum@ADM2026 já apareceu em chats/docs — depois que
> o acesso voltar, recomendo cada usuário trocar a própria senha, e trocar a do admin.
