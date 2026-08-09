# Handoff — Totum System — 2026-08-07

Sessão de diagnóstico e correção. Ponto de partida: *"o sistema está fora do ar?"*,
*"não consigo entrar"* e *"o login com Google não funciona"*.

Dois PRs foram mergeados em `main`. **O código está pronto; o login continua quebrado
até alguém executar os passos manuais da seção "Pendente".** Nenhuma das correções de
código tem efeito sem eles.

---

## Descoberta que reorganiza tudo

O banco **não é Supabase Cloud**. É **self-hosted em Coolify, em `supa.grupototum.com`**.

Isso explica sintomas que antes não fechavam:

- O projeto cloud `fgosozxvhbdhqigwzqih`, documentado no repo, está **desativado
  (NXDOMAIN)** desde o commit `11ba014` (15/jul). O `supabase/config.toml` ainda aponta
  para ele.
- Self-hosted **não tem painel de Auth**. Provedores OAuth se configuram por variável de
  ambiente no serviço `supabase-auth`, não por UI.
- O ref do projeto ativo não existe — e por isso nunca foi encontrado no repositório.

---

## O que foi feito

### PR #9 — schema do banco (mergeado, `29ff03a`)

4 arquivos, +19 −7.

| Arquivo | Mudança |
|---|---|
| `src/integrations/supabase/client.ts` | Default do schema: `'public'` → `'totum_system'` |
| `.env.example` | Corrige a documentação do default de `VITE_SUPABASE_SCHEMA` |
| `CLAUDE.md` | Marca o ref cloud como desativado; registra o schema `totum_system` |
| `docs/login-google-e-reset-senha.md` | Troca o host morto por `<PROJECT_REF>` no redirect URI |

**O bug:** o baseline de migrations cria as tabelas em `totum_system` e as 10 edge
functions cravam `db: { schema: "totum_system" }`. O client do front caía em
`|| 'public'` quando `VITE_SUPABASE_SCHEMA` faltava — schema sem as tabelas do app.
Falha silenciosa: o app sobe, o login passa, e tudo vem vazio, enquanto as edge
functions seguem normais.

### PR #10 — OAuth Google (mergeado, `2cb1356`)

5 arquivos, +94 −2.

| Arquivo | Mudança |
|---|---|
| `src/integrations/supabase/client.ts` | Adiciona `flowType: 'pkce'` |
| `src/pages/AuthPage.tsx` | `redirectTo` → `${origin}/auth/callback` (era a raiz) |
| `src/pages/AuthCallback.tsx` | **Novo.** Destino do redirect OAuth |
| `src/App.tsx` | Registra `/auth/callback` nos 3 branches do roteador multi-tenant |
| `.env.example` | Remove `VITE_GOOGLE_CLIENT_ID` |

**O bug:** o botão levava ao Google, o Google devolvia `?code=` na raiz do site, a raiz
é rota protegida e sem sessão redirecionava para `/login`. Voltava para a tela de login
sem erro nenhum — parecia que o botão "não fazia nada".

Detalhes das peças:

- **`flowType: 'pkce'`** — sem ele o supabase-js usa fluxo implícito, que o GoTrue
  self-hosted não entrega.
- **`AuthCallback.tsx`** — aguarda a troca que o `detectSessionInUrl` faz na
  inicialização do client. **Não** chama `exchangeCodeForSession`: o code é de uso único
  e o client já o consumiu. Trata recusa do provedor e timeout de 10s com mensagem.
- **Rota nos 3 branches** — o login existe em `PIXEL_HOST`, `AGENCY_HOST` e no default,
  então o callback precisa existir nos três, sempre antes do catch-all `/*`.
- **`VITE_GOOGLE_CLIENT_ID` removido** — não era lido em nenhum ponto do frontend e
  sugeria que credencial de OAuth entra no bundle público. Client ID e secret pertencem
  ao `supabase-auth`.

### Verificação de ambos os PRs

`tsc --noEmit` exit 0 · `npm run build` ✅ · `npm test` 27/27 ✅ · eslint sem problemas
novos · CI do GitHub verde · deploy de preview Vercel Ready.

> O erro `@typescript-eslint/no-explicit-any` em `App.tsx:80` é **pré-existente**, fora
> do diff das duas mudanças.

Nenhum PR alterou schema, migrations, políticas RLS, `db.schema` do client ou
dependências.

---

## Pendente — passos manuais

Nada disso é alcançável pelo repositório. **Sem estes passos, o login continua quebrado.**

### 🔴 A. Vercel → totum-system → Environment Variables (Production)

```
VITE_SUPABASE_URL              = https://supa.grupototum.com
VITE_SUPABASE_PUBLISHABLE_KEY  = <anon key do self-hosted>
VITE_SUPABASE_SCHEMA           = totum_system
```

Redeploy após qualquer alteração.

> **Atenção ao nome da env.** O código lê **`VITE_SUPABASE_PUBLISHABLE_KEY`**
> (`client.ts:6`, `asaasService.ts:160`, `.env.example:16`) — **não** `VITE_SUPABASE_ANON_KEY`.
> Com o nome errado o client recebe `undefined` e **nenhuma autenticação funciona**, nem
> Google nem e-mail/senha. Se existir um `VITE_SUPABASE_ANON_KEY` órfão, remova.

### 🔴 B. Coolify → serviço `supabase-auth` → Environment Variables

```
GOTRUE_EXTERNAL_GOOGLE_ENABLED       = true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID     = <Google Cloud Console>
GOTRUE_EXTERNAL_GOOGLE_SECRET        = <Google Cloud Console>
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI  = https://supa.grupototum.com/auth/v1/callback
GOTRUE_SITE_URL                      = https://totum.pixelsystem.online
GOTRUE_URI_ALLOW_LIST                = https://totum.pixelsystem.online/**,https://*.pixelsystem.online/**
API_EXTERNAL_URL                     = https://supa.grupototum.com
```

Reiniciar o serviço depois.

> **`GOTRUE_URI_ALLOW_LIST` não é opcional aqui.** O GoTrue valida o `redirectTo` contra
> essa lista e **ignora em silêncio** o que não estiver nela. O app é multi-tenant por
> subdomínio, então `GOTRUE_SITE_URL` sozinho não cobre.

> **Domínio de produção é `totum.pixelsystem.online`**, confirmado no `CLAUDE.md` e no
> DNS (aponta para Vercel). Não use `totum-system.vercel.app` no `SITE_URL`.

### 🟡 C. Google Cloud Console → OAuth 2.0 Client ID

- **Authorized redirect URI:** `https://supa.grupototum.com/auth/v1/callback`
- **Remover** qualquer URI contendo `fgosozxvhbdhqigwzqih` (ref morto)
- Authorized JavaScript origins: `https://totum.pixelsystem.online`

> O redirect é server-side pelo GoTrue, então o que quebra o fluxo é o **redirect URI**.
> Ele precisa bater caractere por caractere com `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI`.

---

## Perguntas em aberto

### 1. `supabase/config.toml` — `project_id` de um projeto cloud morto

`project_id = "fgosozxvhbdhqigwzqih"` (linha 1). Num setup self-hosted isso não é apenas
desatualizado, é conceitualmente errado.

**Foi deixado de propósito.** Com o ref morto, `supabase db push` / `functions deploy`
falham alto (`Project not found`) — modo de falha seguro. Um valor chutado faria o
comando acertar o banco errado.

**Pergunta que destrava:** *o time usa o Supabase CLI contra o self-hosted?* Se sim, o
arquivo precisa de tratamento específico (o CLI aponta para self-hosted por outra via, não
por `project_id`); se não, o arquivo pode ser simplificado. Não decidir isso às cegas.

### 2. `supa.grupototum.com` resolve para um IP que destoa da infra

| Host | IP | Bate com |
|---|---|---|
| `supa.grupototum.com` | `2.24.206.161` | **nada mais** |
| `grupototum.com` | `185.158.133.1` | faixa de hospedagem |
| `www.grupototum.com` | `2606:4700:…` | Cloudflare |
| `totum.pixelsystem.online` | `216.150.1.129` | Vercel |
| `pixelsystem.online` | `76.76.21.21` | Vercel |

O registro **existe** (não é NXDOMAIN como o ref cloud antigo). Mas `2.24.x` é faixa
típica de CDN/ISP, não de VPS — e não conversa com nenhum outro host do grupo.

**Não verificado.** A sessão não tinha `whois` nem `dig`, e o egress para
`supa.grupototum.com` estava bloqueado por política da organização (403 no CONNECT do
proxy — restrição de ambiente, não evidência de que o servidor caiu).

Se o banco continuar inacessível depois dos passos manuais, **confirmar se esse IP é
mesmo o do servidor** é o primeiro lugar a olhar.

### 3. Auditoria de RLS nunca rodou

A conta Supabase conectada à sessão só enxergava um projeto cloud não relacionado; a conta
Vercel dava 403 no team. Sem acesso ao banco de produção, não foi possível checar policies
RLS, advisors de segurança/performance ou logs do Postgres. **Num multi-tenant, é onde
moram os problemas sérios.** Fica como dívida.

---

## Próxima ação exata

**Abrir a Vercel → projeto `totum-system` → Settings → Environment Variables → Production
e conferir se existe uma variável chamada exatamente `VITE_SUPABASE_PUBLISHABLE_KEY`.**

- Se estiver ausente, ou nomeada `VITE_SUPABASE_ANON_KEY`: corrigir o nome, colar a anon
  key do self-hosted, redeploy.
- Conferir também `VITE_SUPABASE_URL = https://supa.grupototum.com` e
  `VITE_SUPABASE_SCHEMA = totum_system`.

Depois do redeploy, **testar login por e-mail e senha** (não Google). Se voltar a
funcionar, o acesso está recuperado e o OAuth vira tarefa tranquila em vez de urgência —
siga então para os passos B e C.

Se o login por senha **ainda** falhar após isso, a senha foi de fato alterada. No
self-hosted não há painel de Auth; o caminho é a admin API do GoTrue:

```bash
# 1. achar o usuário
curl "https://supa.grupototum.com/auth/v1/admin/users" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>"

# 2. redefinir a senha
curl -X PUT "https://supa.grupototum.com/auth/v1/admin/users/<USER_ID>" \
  -H "apikey: <SERVICE_ROLE_KEY>" \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"password":"<NOVA_SENHA>"}'
```

A `SERVICE_ROLE_KEY` está nas envs do Coolify. **Ela é chave de administrador total —
nunca colocar em variável `VITE_*`,** que vai para o bundle público.

> Senhas de usuário **não são recuperáveis**: o GoTrue guarda hash bcrypt, via de mão
> única. Só existe redefinir. A credencial de admin documentada está no `CLAUDE.md`,
> seção "Credenciais de Acesso".

---

## Plano de teste do OAuth (após A, B e C)

1. Abrir o app em aba anônima
2. Clicar em "Entrar com Google" → deve ir à tela de consentimento do Google
3. Escolher a conta → deve voltar em `/auth/callback` e entrar logado
4. DevTools → Application → LocalStorage → `supabase.auth.token` presente
5. F5 → a sessão precisa persistir

| Falha em | Causa provável |
|---|---|
| Passo 2 | Envs do Google no `supabase-auth`. Ver logs do serviço no Coolify |
| Passo 3 | `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI` diverge do Google Cloud Console |
| Erro *"requested path is invalid"* | Origem fora da `GOTRUE_URI_ALLOW_LIST` |

---

## Referências

| | |
|---|---|
| PR #9 | https://github.com/grupototum/totum-system/pull/9 (mergeado) |
| PR #10 | https://github.com/grupototum/totum-system/pull/10 (mergeado) |
| `main` na conclusão | `2cb1356` |
| App (produção) | https://totum.pixelsystem.online |
| Banco (self-hosted) | https://supa.grupototum.com |
