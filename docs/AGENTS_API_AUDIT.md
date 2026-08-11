# Auditoria — Integração de Agentes via API
> Auditoria em 2026-08-10 · Rodada 1 (item 6) · Documenta o estado atual — bugs viram entradas em `BUGS.md` (B-035 a B-037), não são corrigidos aqui.

## Resumo executivo

Existem **dois endpoints paralelos** oferecendo essencialmente o mesmo propósito ("API pra agentes/automações externas"), com contratos de resposta diferentes, superfícies diferentes e infraestruturas diferentes (edge function Supabase vs. serverless Vercel). **Nenhum dos ~20 agentes documentados em `src/agents/` consome nenhum dos dois** — são personas/prompts markdown, não clientes HTTP. A única referência real ao endpoint é a própria documentação (`docs/api-tarefas.md`), que descreve o uso como prospectivo ("se algum agente precisar...").

| | `api-v1` (edge function Supabase) | `api/tarefas` (serverless Vercel) |
|---|---|---|
| Recursos | `projects` + `tasks` | só `tasks` |
| Formato de erro | RFC 7807 (`application/problem+json`) | `{success, data, error, message}` custom |
| Rota por ID | `/v1/tasks/:id` (path param) | não existe — `id` vai no body/query |
| DELETE | não implementado | implementado (soft-delete → `status: arquivado`) |
| Validação de enum/UUID/inteiro | nenhuma | completa (`validateFields`) |
| Ordenação customizável | não (fixo `created_at desc`) | sim (`order_by`/`order_dir`, whitelist) |
| Update de `last_used_at` | `await` (bloqueante) | fire-and-forget |
| Vazamento de erro interno em 500 | sim (`String(e)` no `detail`) | não (`internal_error` genérico) |
| Documentação em `docs/` | **nenhuma** | `docs/api-tarefas.md` |
| Consumidor real identificado | nenhum | nenhum |

---

## 1. `supabase/functions/api-v1/index.ts`

**Autenticação:** header `Authorization: Bearer totum_sk_...`. Token com SHA-256 (`crypto.subtle`) comparado contra `api_keys.key_hash` via service role (bypassa RLS). Valida `is_active` e `expires_at`. `organization_id` sempre vem da chave (nunca do request). `scopes.includes("write")` gate para POST/PATCH. Atualiza `last_used_at` a cada request (bloqueante).

Sem rate limiting.

| Método | Rota | Auth extra | Campos aceitos | Resposta |
|---|---|---|---|---|
| GET | `/v1/projects` | — | — | `{data, meta:{limit,offset,totalCount}}` |
| POST | `/v1/projects` | scope `write` | `name`*, `client_id`* (validado contra org), `description`, `contract_id`, `responsible_id`, `status`, `start_date`, `due_date` | `data` (201) |
| GET | `/v1/projects/:id` | — | — | objeto ou 404 |
| PATCH | `/v1/projects/:id` | scope `write` | mesmos campos (parcial) | objeto ou 404 |
| GET | `/v1/tasks` | — | filtros `project_id`, `status` | `{data, meta}` |
| POST | `/v1/tasks` | scope `write` | `title`*, `client_id`* (validado), `description`, `project_id`, `contract_id`, `responsible_id`, `status`, `priority`, `task_type`, `start_date`, `due_date` | `data` (201) |
| GET | `/v1/tasks/:id` | — | — | objeto ou 404 |
| PATCH | `/v1/tasks/:id` | scope `write` | mesmos campos (parcial) | objeto ou 404 |

Paginação: `limit` clamp [1,100] default 50, `offset` ≥0 default 0, `count: 'exact'`. `client_id` enviado é validado contra a org via `assertClientInOrg` (422 se não pertencer). Erros em RFC 7807; catch global expõe `String(e)` no 500 (B-036). CORS `*`. `verify_jwt = false` no `config.toml` — correto, pois a auth é própria (não é JWT Supabase).

## 2. `api/tarefas/index.js`

**Autenticação:** mesmo padrão (`Bearer totum_sk_...`, SHA-256, mesma tabela `api_keys`), mas usa `node:crypto` em vez de `crypto.subtle`, e `last_used_at` é fire-and-forget (sem `await`).

Sem rate limiting.

| Método | Rota | Auth extra | Campos | Resposta |
|---|---|---|---|---|
| GET | `/api/tarefas` | — | query: `status`, `responsible_id`, `client_id`, `priority`, `task_type`, `limit`, `offset`, `order_by` (whitelist), `order_dir` | `{success,data,error:null,message:null,meta}` |
| POST | `/api/tarefas` | scope `write` | `WRITABLE_FIELDS` (23 campos, ver abaixo); obrigatório `title`+`client_id` | idem (201) |
| PATCH | `/api/tarefas` | scope `write` | `WRITABLE_FIELDS` + `id` obrigatório no body | idem (200) |
| DELETE | `/api/tarefas` | scope `write` | `id` (body ou query) → soft-delete (`status='arquivado'`) | idem (200) |

`WRITABLE_FIELDS`: `title, description, client_id, contract_id, project_id, responsible_id, priority, status, task_type, start_date, due_date, estimated_minutes, actual_minutes, is_recurring, recurrence_type, recurrence_config, recurrence_end_date, parent_task_id, last_generated_at, pop_id, sla_id, sla_response_deadline, sla_resolution_deadline`. `organization_id` nunca aceito do body.

Validação server-side (`validateFields`) que `api-v1` **não tem**: `title` não vazio; `status`/`priority`/`task_type` contra whitelists; campos UUID contra regex; campos inteiros com `Number.isInteger`. `client_id` validado contra org via `clientBelongsToOrg`. Paginação idêntica a `api-v1` em limites, mas com `order_by`/`order_dir` customizáveis. Erro 500 não vaza detalhe interno (B-036 não se aplica aqui).

## 3. Emissão de chaves — `generate-api-key/index.ts`

Quem gera precisa ser `is_admin(uid)` OU `is_master` (403 caso contrário). Só `is_master` pode emitir chave para org diferente da própria. Chave: `totum_sk_` + 16 bytes aleatórios (`crypto.getRandomValues`) em hex. Armazena só o hash (SHA-256) + `key_prefix` (primeiros 16 chars, pra exibição). **A chave completa só é retornada uma vez**, na criação — não é recuperável depois. Scopes: `read`/`write`, default `["read"]`. `verify_jwt = true` — correto, pois exige JWT de usuário autenticado (chamada pela UI, não por agente externo).

## 4. Schema `api_keys`

```sql
CREATE TABLE totum_system.api_keys (
    id uuid, organization_id uuid NOT NULL, name text NOT NULL,
    key_prefix text NOT NULL, key_hash text NOT NULL UNIQUE,
    scopes text[] DEFAULT ARRAY['read'] NOT NULL,
    is_active boolean DEFAULT true, last_used_at timestamptz,
    expires_at timestamptz, created_by uuid, created_at/updated_at timestamptz
);
-- CHECK: scopes ⊆ {read,write} e não vazio
-- FK: organization_id → organizations(id) ON DELETE CASCADE
-- RLS: "Org admins manage api_keys" (is_admin OR is_master) AND (mesma org OU master)
```

**Nota de auditoria:** essa RLS só protege acesso via cliente autenticado com JWT (a UI de gestão, `ApiKeysTab.tsx`). Tanto `api-v1` quanto `api/tarefas` leem `api_keys` com a **service role key**, que bypassa RLS inteiramente — a policy acima não afeta a validação de API key feita pelos dois endpoints (isso é esperado/correto para esse desenho, só documentando).

## 5. Consumidores reais — grep em `src/agents/`, `src/tars-central/`, `docs/`, raiz

| Padrão buscado | Ocorrências |
|---|---|
| `totum_sk_` | Só em `docs/api-tarefas.md` (exemplos de curl com placeholder) |
| `api-v1` | **Zero** em `src/agents/`, `src/tars-central/`, `docs/`, `.md` da raiz |
| `api/tarefas` | Só na própria `docs/api-tarefas.md` |
| `X-API-Key` | Zero |
| `Authorization.*Bearer` | Só os exemplos de curl acima + `HANDOFF-TOTUM-SYSTEM-2026-08-07.md` (mas é `Bearer <SERVICE_ROLE_KEY>` direto na REST do Supabase, não relacionado) |

`src/agents/` tem 18 arquivos `.md` (personas: analista, chandler, chaplin, data, dona-clawdete, giles, git, guardiao, miguel, monk, pablo-marcal(-checklist), radar, sabia, transcritor, watson, yoda) + `imagens/`, `pops/`. **Nenhum menciona `totum_sk_`, `api-v1` ou `api/tarefas`.** `src/tars-central/` só tem `README.md` + memórias, também sem referência.

`docs/api-tarefas.md` documenta `api/tarefas` corretamente (bate com o código), mas na linha 95-98 admite explicitamente: adicionar rota dinâmica por ID "seria trivial se algum agente precisar do formato REST puro" — frase que confirma que, até a data da doc, **nenhum agente real consome o endpoint**. `api-v1` não tem doc equivalente em `docs/`.

## 6. Conclusão e bugs registrados

- Duplicação de propósito entre `api-v1` e `api/tarefas` sem consumidor real de nenhum dos dois → B-035.
- Vazamento de erro interno no 500 do `api-v1` → B-036.
- Ausência de rate limiting nos dois → B-037.

Nada foi corrigido nesta rodada — conforme escopo, esta auditoria só documenta. Decisão de produto pendente (fora do escopo desta rodada): consolidar os dois endpoints em um só, decidir qual documentar/manter, ou aposentar o que não tiver uso real.
