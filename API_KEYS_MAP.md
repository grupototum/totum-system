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
| TELEGRAM_TOKEN | Telegram Bot | Sim | local/staging/prod | Bot de notificações |
| OLLAMA_URL | Ollama (IA local) | Não | local | API local de LLM |
| OLLAMA_MODEL | Ollama | Não | local | Modelo padrão |
| TELEGRAM_ID_SUPORTE | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_COMERCIAL | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_TECNICO | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_FINANCEIRO | Telegram | Não | local/staging/prod | ID do responsável |
| TELEGRAM_ID_DIRECAO | Telegram | Não | local/staging/prod | ID do responsável |

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

## ⚠️ NOTA CRÍTICA

O `.env.example` atual contém **token Telegram real** (`8675078490:AAHuWe-3CphyWn4vlYv-1tDKZofDS-mJScM`).

**Ação necessária:**
1. Revogar token no @BotFather (Telegram)
2. Gerar novo token
3. Atualizar `.env` local (nunca commitar)
4. Atualizar `.env.example` com placeholder: `TELEGRAM_TOKEN=seu_token_aqui`

---

*Última atualização: 2026-06-03*
