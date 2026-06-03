# Login com Google + Reset de Senha — Diagnóstico e Setup

> Atualizado: 2026-06-03 · Projeto Supabase: `fgosozxvhbdhqigwzqih`

## Estado atual (via logs de auth)

| Item | Status |
|---|---|
| Provider Google habilitado | ✅ **Sim** (logs `Redirecting to external provider provider=google` + `/callback 302`). Antes das 10:56 dava `provider is not enabled`; foi habilitado durante o dia. |
| Usuários criados via Google | ❌ **Zero** — o callback completa (302) mas **nenhum usuário é criado**. |
| Erro observado | `400: OAuth state parameter missing` em `/callback` com referer `pixelsystem.online` (apex, **sem** `totum.`). |

**Conclusão:** o provider está ligado, mas o login social **não conclui**. Duas causas prováveis:

1. **"Allow new users to sign up" desabilitado** no Supabase → o usuário Google novo não pode ser criado
   → callback redireciona de volta com erro, sem sessão.
2. **Site URL / domínio inconsistente** (`pixelsystem.online` vs `totum.pixelsystem.online`): o code
   verifier (PKCE) é guardado no `localStorage` da origem que iniciou o fluxo; se o callback volta para
   outra origem, o "state" não bate → `OAuth state parameter missing` → nenhuma sessão.

## Correções já feitas no código

- ✅ Trigger `handle_new_user`: signups sem org (caso do Google) agora caem na org Totum com status
  `pendente` (antes ficavam com `organization_id` NULL e travados). Migration `20260603130000`.
- ✅ `AuthPage`: passa a **exibir** o erro de OAuth que volta na URL (`?error` / `#error`) em vez de
  falhar silenciosamente ("não acontecia nada"). — `src/pages/AuthPage.tsx`

## O que falta no painel (não dá para fazer por código)

### Supabase → Authentication
1. **Providers → Google**: confirmar habilitado, com **Client ID + Secret** válidos (do Google Console).
2. **Sign In / Providers → "Allow new users to sign up"**: **ativar** (senão Google de e-mail novo falha).
3. **URL Configuration**:
   - **Site URL**: `https://totum.pixelsystem.online` (use o subdomínio canônico, **não** o apex).
   - **Redirect URLs**: `https://totum.pixelsystem.online/**` e cada subdomínio de tenant em uso.
4. (Opcional) **Allow linking** se quiser que um e-mail já cadastrado por senha possa entrar via Google.

### Google Cloud Console → Credentials (OAuth client Web)
- **Authorized JavaScript origins**: `https://totum.pixelsystem.online` (+ subdomínios de tenant).
- **Authorized redirect URI**: `https://fgosozxvhbdhqigwzqih.supabase.co/auth/v1/callback`.

> **Hands-off:** me envie o **Client ID + Secret** do Google que eu valido a config / passo o checklist
> exato. Não consigo abrir esses painéis a partir do código.

## Comportamento esperado após config

1. `/login` → "Entrar com Google" → autentica no Google → volta para `totum.pixelsystem.online`.
2. Novo usuário aparece em `/usuarios` como **pendente** (admin recebe notificação).
3. Admin aprova (status `ativo`) → usuário entra normalmente.

## Reset de senha ("Esqueci a senha")

Código correto (`ForgotPassword` → `resetPasswordForEmail` → `/reset-password` → `updateUser`).
Os logs mostram chamadas `/recover 200` — o endpoint responde. Para o **e-mail chegar de fato**:
configurar **SMTP próprio** (Resend/SendGrid/SES) em Authentication → Emails, pois o SMTP padrão do
Supabase tem limite baixíssimo e cai em spam. Depois testar com um e-mail real.
