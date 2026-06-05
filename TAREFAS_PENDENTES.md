# Tarefas Pendentes — Totum System

> Atualizado: 2026-06-04
> Por: Bulma (hands-off audit)

---

## ✅ Tarefas hands-off CONCLUÍDAS agora

| # | Tarefa | Status |
|---|---|---|
| 1 | Criar `.env` a partir de `.env.example` | ✅ Feito |
| 2 | Verificar `.env` está no `.gitignore` | ✅ Confirmado |
| 3 | Verificar `node_modules` instalado | ✅ Confirmado (367 pacotes) |
| 4 | Mapear arquivos duplicados com " 2" | ✅ Mapeado — 4 arquivos |

---

## 🔴 Tarefas que PRECISAM de aprovação/credenciais

### 1. Preencher `.env` com credenciais reais
**O que falta:**
- `VITE_SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — chave anônima
- `TELEGRAM_TOKEN` — novo token (atual está exposto)
- Demais variáveis conforme ambiente

**Você precisa:** Fornecer as credenciais ou me dar acesso ao Supabase dashboard

---

### 2. ⚠️ Arquivos duplicados com " 2" no nome
**Encontrados:** 4 arquivos duplicados/conflitantes

| Arquivo | Status |
|---|---|
| `src/components/admin-settings/ApiKeysTab 2.tsx` | 🟡 Duplicado — verificar qual é o correto |
| `supabase/migrations/20260401111038_* 2.sql` | 🟡 Diferente do original |
| `supabase/migrations/20260603120000_api_keys 2.sql` | 🟡 Diferente do original |
| `supabase/migrations/20260603130000_handle_new_user_org_default 2.sql` | 🟡 Diferente do original |

**Risco:** Arquivos com " 2" geralmente são criados por conflitos de merge ou cópias de backup. Podem causar confusão.

**Ação sugerida:** Revisar qual versão é a correta e remover as duplicatas.

**Você precisa:** Aprovar a remoção ou me indicar qual manter.

---

### 3. 🔴 Revogar token Telegram exposto
**Local:** `.env.example` linha 1
**Valor exposto:** `8675078490:AAHuWe-3CphyWn4vlYv-1tDKZofDS-mJScM`

**Ação necessária:**
1. Abrir @BotFather no Telegram
2. Revogar o token atual
3. Gerar novo token
4. Atualizar `.env` local (nunca commitar)
5. Atualizar `.env.example` com placeholder

**Você precisa:** Fazer isso manualmente (não tenho acesso ao Telegram)

---

### 4. 🟡 Configurar SMTP para reset de senha
**Status:** SMTP built-in do Supabase configurado, mas com limites baixos
**Recomendação:** Configurar SMTP próprio (Resend, SendGrid, Amazon SES)

**Você precisa:**
- Ter conta em um serviço de email
- Me passar as credenciais SMTP (host, port, user, password)
- Ou configurar no Supabase dashboard em `Authentication → Emails / SMTP`

---

### 5. 🟡 Commitar arquivos BuildOps no Git
**Arquivos criados (untracked):**
- `API_KEYS_MAP.md`
- `BUILDER_IO_NOTES.md`
- `DESIGN_HANDOFF.md`
- `RELATORIO_BUILDOPS.md`

**Você precisa:** Aprovar se quer commitar esses arquivos na branch atual

---

### 6. 🟡 Figma — link direto do arquivo "Totum Temp"
**Status:** Team mapeada, mas precisa do link direto do arquivo de design

**Você precisa:**
- Abrir o Figma
- Ir no arquivo "Totum Temp"
- Copiar o link de compartilhamento
- Me enviar o link

---

## 📋 Próxima ação recomendada

1. **Resolver arquivos duplicados** — é rápido e evita confusão
2. **Preencher `.env`** — para poder rodar `bun dev`
3. **Revogar token Telegram** — segurança crítica

---

*Bulma 🎀*
