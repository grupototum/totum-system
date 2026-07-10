# API `/api/tarefas`

Endpoint HTTP (Vercel serverless, [api/tarefas/index.js](../api/tarefas/index.js)) para agentes
externos criarem, listarem, editarem e arquivarem tarefas em `public.tasks`. Não é a tela
`/tarefas` do produto (essa fala direto com Supabase via `useSupabaseTasks`) — é uma API separada
para automações/agentes.

## Autenticação

Toda requisição exige `Authorization: Bearer totum_sk_...`. A chave é gerada pela edge function
`generate-api-key` (ver aba de API Keys nas configurações) e determina a `organization_id` —
toda leitura e escrita é automaticamente restrita à organização dona da chave. Escrita
(POST/PATCH/DELETE) exige que a chave tenha o escopo `write`.

Resposta em caso de auth inválida: `401` (chave ausente/inválida/revogada/expirada) ou
`403` (chave válida mas sem escopo `write`).

## Formato de resposta

```json
{ "success": true, "data": { }, "error": null, "message": null }
```

Erros seguem o mesmo formato com `success: false`, `data: null`, `error` (código curto) e
`message` (descrição). Erros de validação retornam `400`, não `500`.

## GET /api/tarefas

Filtros opcionais via query string: `status`, `responsible_id`, `client_id`, `priority`,
`task_type`, `limit` (1–100, padrão 50), `offset` (padrão 0), `order_by` (`created_at`,
`updated_at`, `due_date`, `start_date`, `priority`, `status`, `title` — padrão `created_at`),
`order_dir` (`asc`/`desc`, padrão `desc`).

```bash
curl -s "https://totum.pixelsystem.online/api/tarefas?status=pendente&limit=20" \
  -H "Authorization: Bearer totum_sk_xxx"
```

## POST /api/tarefas

Campos obrigatórios: `title`, `client_id`. `organization_id` nunca é aceito do body — é sempre
derivado da API key.

```bash
curl -s -X POST "https://totum.pixelsystem.online/api/tarefas" \
  -H "Authorization: Bearer totum_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "[TESTE API] Validar endpoint",
    "description": "Tarefa de teste",
    "client_id": "00000000-0000-0000-0000-000000000000",
    "priority": "media",
    "status": "pendente",
    "task_type": "outro"
  }'
```

## PATCH /api/tarefas

`id` obrigatório no body; demais campos são opcionais e parciais.

```bash
curl -s -X PATCH "https://totum.pixelsystem.online/api/tarefas" \
  -H "Authorization: Bearer totum_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "11111111-1111-1111-1111-111111111111",
    "status": "em_andamento",
    "responsible_id": "22222222-2222-2222-2222-222222222222"
  }'
```

## DELETE /api/tarefas

Não apaga a linha — marca `status = 'arquivado'` (soft-delete, preserva histórico e
relacionamentos). `id` pode vir no body ou como query string.

```bash
curl -s -X DELETE "https://totum.pixelsystem.online/api/tarefas" \
  -H "Authorization: Bearer totum_sk_xxx" \
  -H "Content-Type: application/json" \
  -d '{ "id": "11111111-1111-1111-1111-111111111111" }'
```

## Campos aceitos em POST/PATCH

`title`, `description`, `client_id`, `contract_id`, `project_id`, `responsible_id`, `priority`
(`baixa|media|alta|urgente`), `status` (`pendente|em_andamento|pausado|concluido|arquivado`),
`task_type` (`conteudo|trafego|reuniao|relatorio|design|desenvolvimento|outro`), `start_date`,
`due_date`, `estimated_minutes`, `actual_minutes`, `is_recurring`, `recurrence_type`,
`recurrence_config`, `recurrence_end_date`, `parent_task_id`, `last_generated_at`, `pop_id`,
`sla_id`, `sla_response_deadline`, `sla_resolution_deadline`. Qualquer outro campo enviado é
ignorado.

## Pendência conhecida

Não existe rota dinâmica `PATCH /api/tarefas/:id` — use `PATCH /api/tarefas` com `id` no body.
Adicionar `api/tarefas/[id].js` é trivial se algum agente precisar do formato REST puro.
