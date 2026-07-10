# API_KEYS_MAP

## Variáveis detectadas

| Variável | Serviço provável | Obrigatória? | Ambiente | Observação |
|---|---|---|---|---|
| VITE_SUPABASE_URL | Supabase | Sim | local/staging/prod | URL do projeto Supabase |
| VITE_SUPABASE_ANON_KEY | Supabase | Sim | local/staging/prod | Chave anônima (pública) |
| VITE_TIKTOK_CLIENT_ID | TikTok API | Não | local/staging/prod | Para integração social |
| VITE_TIKTOK_CLIENT_SECRET | TikTok API | Não | local/staging/prod | Nunca expor no frontend |
| VITE_TIKTOK_ACCESS_TOKEN | TikTok API | Não | local/staging/prod | Token de acesso |
| VITE_TIKTOK_REDIRECT_URI | TikTok API | Não | local/staging/prod | URI de callback OAuth |
| VITE_TIKTOK_MODE | TikTok API | Não | local/staging/prod | sandbox ou production |
| VITE_TIKTOK_REFRESH_TOKEN | TikTok API | Não | local/staging/prod | Renovação automática |
| TELEGRAM_TOKEN | Telegram Bot (script Python) — **bot descontinuado** | Não | local/staging/prod | Consumidor é `bot_atendente_totum.py`. Bot antigo não existe mais (confirmado 2026-07-10) — não preencher com token novo, ver Nota Crítica |
| VITE_TELEGRAM_BOT_TOKEN | Telegram Bot (frontend) | Não | local/staging/prod | Lida em `src/services/telegramService.ts`, chama `api.telegram.org` direto do browser — variável `VITE_` vai pro bundle público |
| OLLAMA_URL | Ollama (IA local) | Não | local | API local de LLM |
| OLLAMA_MODEL | Ollama | Não | local | Modelo padrão |
| TELEGRAM_ID_SUPORTE | Telegram | Não | local/staging/prod | ID do responsável (lido em `bot_atendente_totum.py`) |
| TELEGRAM_ID_COMERCIAL | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_TECNICO | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_FINANCEIRO | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_DIRECAO | Telegram | Não | local/staging/prod | ID do responsável |
| telegram_chat_id (coluna Supabase, não é env var) | Telegram (por operador) | Não | prod | Usado em `src/types/operador.ts` e `src/pages/settings/Operadores.tsx` — é um ID de destinatário, não uma credencial |

## Regras

- **Nunca commitar `.env`** — está no `.gitignore`, mas verifique sempre
- **Manter `.env.example` atualizado** — sem valores reais, apenas nomes de variáveis
- **Separar local, staging e produção** — use `.env.local`, `.env.staging`, `.env.production`
- **Não expor chaves no frontend** — variáveis `VITE_` são públicas, cuidado com secrets
- **Validar `NEXT_PUBLIC_` / `VITE_`** — prefixo indica que a variável vai pro bundle público

## Segurança

| Risco | Mitigação |
|---|---|
| Token Telegram exposto (bot `@totum_agents_bot`, descontinuado) | Não gerar token novo — confirmar e remover envs antigas em Vercel/VPS/n8n, se existirem |
| Supabase key pública | Usar RLS + policies restritas |
| TikTok secrets no frontend | Mover para backend/Edge Function |
| Ollama exposto | Rodar apenas em localhost, não expor porta |

## ⚠️ NOTA CRÍTICA — token Telegram exposto, bot DESCONTINUADO

**Status: 🟢 ENCERRADO como incidente ativo.** O token real foi exposto no histórico do git desde ~abril/2026, mas o bot ao qual ele pertencia (provavelmente `@totum_agents_bot`) **não existe mais**, segundo confirmação humana em 2026-07-10. Trata-se de credencial antiga/descomissionada — não há rotação ativa a fazer, porque não há serviço vivo para reapontar.

**Onde o valor real aparecia na árvore atual (sem reproduzir o valor aqui) — todos sanitizados:**
1. `.env.example` linha 1 — ✅ placeholder.
2. `src/shared/bot_atendente_totum.py` linha 58 — ✅ lê `os.getenv("TELEGRAM_TOKEN")`, falha com `SystemExit` sem env var (sem imprimir segredo).
3. `TAREFAS_PENDENTES.md` — ✅ valor literal removido, substituído por referência a este arquivo.

**Nota permanente:** o valor antigo continua legível no histórico do git (commits anteriores às correções acima). Como o bot está descontinuado, isso não representa mais um caminho de exploração ativo — não há API viva por trás desse token para um invasor usar. Reescrita de histórico do git é uma ação separada, destrutiva, e não foi feita.

**Consumidores mapeados (histórico, mantido para rastreabilidade):**
- `src/shared/bot_atendente_totum.py` — bot Python via `python-telegram-bot`, script órfão sem caller no app. Agora exige `TELEGRAM_TOKEN` no ambiente para rodar; como o bot está descontinuado, não há necessidade de fornecer essa env var em lugar nenhum.
- `src/services/telegramService.ts` → `src/hooks/useTelegramNotification.ts` → `src/components/workspace/TelegramNotification.tsx` → `src/pages/workspace/TaskRecurrence.tsx` — cadeia frontend que usa `VITE_TELEGRAM_BOT_TOKEN` (variável diferente). Página não roteada em `App.tsx` hoje. Se esse fluxo for reaproveitado no futuro, precisa de um bot novo e de mover a chamada para backend/Edge Function — não reaproveitar o token antigo.
- Nenhum uso encontrado em `stark-api/`, `supabase/functions/`, docs de n8n, ou scripts `.sh`.

**Ações restantes (não é rotação — é limpeza de resíduos de uma credencial morta):**
1. Confirmar se existe alguma env `TELEGRAM_TOKEN` / `VITE_TELEGRAM_BOT_TOKEN` ainda configurada no dashboard da Vercel, em algum VPS, ou em workflow n8n.
2. Se existir, **remover** essa env (não substituir por token novo — o bot não existe mais).
3. **Não gerar token novo** e **não acessar o @BotFather** para esse bot — não há para onde rotacionar.
4. Se no futuro um bot novo for criado para o mesmo propósito, tratar como credencial nova (nome de variável novo, mapeamento novo), não como "renovação" desta.

**Comandos seguros de validação (não destrutivos):**
```bash
# Confirmar que o .env.example atual não tem valor real
grep -n "^TELEGRAM_TOKEN=" .env.example

# Confirmar que o .env real (se existir localmente) está ignorado pelo git
git check-ignore -v .env

# Confirmar que o script exige a env var (sem token hardcoded)
grep -n "TELEGRAM_TOKEN" src/shared/bot_atendente_totum.py
```

---

*Última atualização: 2026-07-10 — bot antigo confirmado descontinuado pelo responsável do projeto; incidente fechado como credencial morta, sem rotação ativa.*
