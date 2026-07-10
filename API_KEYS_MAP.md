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
| TELEGRAM_TOKEN | Telegram Bot (script Python) | Sim* | local/staging/prod | *Nenhum código TS/JS lê essa var hoje; consumidor real é o script Python `bot_atendente_totum.py` (token hardcoded lá, ver Nota Crítica) |
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
| Token Telegram exposto | Revogar no BotFather e gerar novo |
| Supabase key pública | Usar RLS + policies restritas |
| TikTok secrets no frontend | Mover para backend/Edge Function |
| Ollama exposto | Rodar apenas em localhost, não expor porta |

## ⚠️ NOTA CRÍTICA — token Telegram comprometido

**Status:** token tratado como comprometido desde ~abril/2026 (exposto no histórico do git). Ainda **não revogado no @BotFather** — a rotação real do valor continua pendente de autorização externa.

**Onde o valor real aparecia na árvore atual (sem reproduzir o valor aqui):**
1. `.env.example` linha 1 — ✅ **corrigido** (placeholder).
2. `src/shared/bot_atendente_totum.py` linha 58 — ✅ **corrigido em 2026-07-10**: agora lê `os.getenv("TELEGRAM_TOKEN")` e falha com `SystemExit` (mensagem clara, sem imprimir segredo) se a env var não estiver definida. **Importante:** isso só sanitiza a árvore de trabalho atual — o valor antigo continua legível no histórico do git (commits anteriores a esta correção). Rotacionar o token de verdade no @BotFather continua sendo a única forma de neutralizar o vazamento.

**Consumidores mapeados (quem quebra se o token for trocado sem atualizar):**
- `src/shared/bot_atendente_totum.py` — bot Python via `python-telegram-bot`, hoje sem nenhum caller no app (script standalone/órfão). Agora exige `TELEGRAM_TOKEN` no ambiente para rodar; sem essa env var o script não sobe (antes rodava com o token hardcoded, sem esse guard).
- `src/services/telegramService.ts` → `src/hooks/useTelegramNotification.ts` → `src/components/workspace/TelegramNotification.tsx` → `src/pages/workspace/TaskRecurrence.tsx` — cadeia frontend que usa `VITE_TELEGRAM_BOT_TOKEN` (variável diferente, ver tabela acima). `TaskRecurrence.tsx` está em uma subpasta não roteada em `App.tsx` hoje, então provavelmente não está no bundle de produção — **precisa confirmação via build**, não presumir.
- Nenhum uso encontrado em `stark-api/`, `supabase/functions/`, docs de n8n, ou scripts `.sh`.
- Configuração real de produção (Vercel env vars) **não é visível a partir do repo** — checar manualmente no dashboard da Vercel antes de rotacionar.

**Plano de rotação coordenada (não executar sem autorização explícita, ordem sugerida):**
1. **Mapear consumidores** — ✅ feito nesta auditoria (lista acima).
2. **Preparar novo token no @BotFather** — gerar um novo token para o bot, sem revogar o antigo ainda (evita downtime).
3. **Atualizar ambientes** — colocar o novo valor em `.env` local (nunca commitar) e nas envs de staging/produção (Vercel dashboard, e onde `bot_atendente_totum.py` roda, se for reativado).
4. **Reiniciar apenas os serviços necessários** — se o script Python estiver rodando em algum servidor/PM2, reiniciar só esse processo; frontend não precisa de restart, só novo build/deploy quando o env mudar.
5. **Testar envio/recebimento** — enviar uma mensagem de teste via `sendTelegramMessage`/`sendTelegramNotification` (ou diretamente `curl https://api.telegram.org/bot<NOVO_TOKEN>/getMe`) antes de considerar concluído.
6. **Monitorar erros** — checar logs do bot Python (se ativo) e o `console.warn('[Telegram] BOT_TOKEN não configurado')` do frontend por um tempo após a troca.
7. **Só depois disso**, considerar revogar o token antigo no @BotFather e avaliar limpeza de histórico do git (ação separada, destrutiva, precisa aprovação explícita à parte).

**Riscos:**
- Revogar o token antes de atualizar todos os consumidores quebra silenciosamente o bot Python (se estiver ativo em produção) e o fluxo `TaskRecurrence`/notificações (se estiver de fato em uso).
- `VITE_TELEGRAM_BOT_TOKEN` sendo lido direto no browser é um risco arquitetural à parte da rotação — mesmo com token novo, se essa página entrar em produção o token fica público no bundle. Considerar mover para uma Edge Function antes de reativar essa página.
- Sem acesso ao dashboard da Vercel não dá para confirmar se há uma cópia do token configurada lá também.

**Comandos seguros de validação (não destrutivos):**
```bash
# Confirmar que o .env.example atual não tem valor real
grep -n "^TELEGRAM_TOKEN=" .env.example

# Confirmar que o .env real (se existir localmente) está ignorado pelo git
git check-ignore -v .env

# Testar um token novo sem afetar o antigo (rodar manualmente, fora do repo)
curl -s "https://api.telegram.org/bot<NOVO_TOKEN>/getMe"

# Depois de atualizar bot_atendente_totum.py para ler de env var (mudança separada, fora deste escopo):
grep -n "TELEGRAM_TOKEN" src/shared/bot_atendente_totum.py
```

---

*Última atualização: 2026-07-10 (sanitização do hardcode em `bot_atendente_totum.py`, sem revogar nada — nota: manteve o nome `TELEGRAM_TOKEN` já existente no `.env.example`/tabela acima, em vez de introduzir `TELEGRAM_BOT_TOKEN`, para não criar uma terceira variante de nome para o mesmo segredo)*
