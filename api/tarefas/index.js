import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

// ============================================================
// /api/tarefas — CRUD de agentes externos sobre public.tasks.
// Autenticado por API key (Authorization: Bearer totum_sk_...),
// mesmo padrão de hash/escopo usado em supabase/functions/api-v1.
// ============================================================

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const STATUS_VALUES = ['pendente', 'em_andamento', 'pausado', 'concluido', 'arquivado']
const PRIORITY_VALUES = ['baixa', 'media', 'alta', 'urgente']
const TASK_TYPE_VALUES = ['conteudo', 'trafego', 'reuniao', 'relatorio', 'design', 'desenvolvimento', 'outro']
const ORDERABLE_COLUMNS = ['created_at', 'updated_at', 'due_date', 'start_date', 'priority', 'status', 'title']

// Campos que um agente pode enviar em POST/PATCH. organization_id nunca vem do
// body — é sempre derivado da API key, para não permitir escrever fora da org.
const WRITABLE_FIELDS = [
  'title', 'description', 'client_id', 'contract_id', 'project_id', 'responsible_id',
  'priority', 'status', 'task_type', 'start_date', 'due_date',
  'estimated_minutes', 'actual_minutes',
  'is_recurring', 'recurrence_type', 'recurrence_config', 'recurrence_end_date', 'parent_task_id',
  'last_generated_at', 'pop_id', 'sla_id', 'sla_response_deadline', 'sla_resolution_deadline',
]

function reply(res, status, body) {
  return res.status(status).json(body)
}

function fail(res, status, error, message) {
  return reply(res, status, { success: false, data: null, error, message })
}

function ok(res, status, data, message = null) {
  return reply(res, status, { success: true, data, error: null, message })
}

async function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex')
}

function pick(obj, keys) {
  const out = {}
  for (const k of keys) if (k in obj) out[k] = obj[k]
  return out
}

// Valida os campos permitidos; retorna string de erro ou null se ok.
function validateFields(fields) {
  if ('title' in fields && (typeof fields.title !== 'string' || !fields.title.trim())) {
    return 'title deve ser uma string não vazia'
  }
  if ('status' in fields && fields.status !== null && !STATUS_VALUES.includes(fields.status)) {
    return `status deve ser um de: ${STATUS_VALUES.join(', ')}`
  }
  if ('priority' in fields && fields.priority !== null && !PRIORITY_VALUES.includes(fields.priority)) {
    return `priority deve ser um de: ${PRIORITY_VALUES.join(', ')}`
  }
  if ('task_type' in fields && fields.task_type !== null && !TASK_TYPE_VALUES.includes(fields.task_type)) {
    return `task_type deve ser um de: ${TASK_TYPE_VALUES.join(', ')}`
  }
  const uuidFields = ['client_id', 'contract_id', 'project_id', 'responsible_id', 'parent_task_id', 'pop_id', 'sla_id']
  for (const f of uuidFields) {
    if (f in fields && fields[f] !== null && !UUID_RE.test(String(fields[f]))) {
      return `${f} deve ser um UUID válido`
    }
  }
  const intFields = ['estimated_minutes', 'actual_minutes']
  for (const f of intFields) {
    if (f in fields && fields[f] !== null && !Number.isInteger(fields[f])) {
      return `${f} deve ser um número inteiro`
    }
  }
  return null
}

async function authenticate(req) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token.startsWith('totum_sk_')) {
    return { error: { status: 401, code: 'unauthorized', message: 'Forneça uma API key válida no header Authorization: Bearer totum_sk_...' } }
  }

  const keyHash = await sha256Hex(token)
  const { data: key } = await supabase
    .from('api_keys')
    .select('id, organization_id, scopes, is_active, expires_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (!key || !key.is_active) {
    return { error: { status: 401, code: 'unauthorized', message: 'API key inválida ou revogada' } }
  }
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return { error: { status: 401, code: 'unauthorized', message: 'API key expirada' } }
  }

  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id).then(() => {})

  return { key }
}

function requireWrite(key, res) {
  if ((key.scopes || []).includes('write')) return null
  fail(res, 403, 'forbidden', "Esta API key não possui o escopo 'write'")
  return true
}

async function clientBelongsToOrg(clientId, orgId) {
  const { data } = await supabase.from('clients').select('id').eq('id', clientId).eq('organization_id', orgId).maybeSingle()
  return !!data
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { key, error: authError } = await authenticate(req)
  if (authError) return fail(res, authError.status, authError.code, authError.message)
  const orgId = key.organization_id

  try {
    switch (req.method) {
      case 'GET': {
        const q = req.query || {}
        const limit = Math.min(Math.max(Number(q.limit) || 50, 1), 100)
        const offset = Math.max(Number(q.offset) || 0, 0)
        const orderBy = ORDERABLE_COLUMNS.includes(q.order_by) ? q.order_by : 'created_at'
        const ascending = q.order_dir === 'asc'

        let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('organization_id', orgId)
        if (q.status) query = query.eq('status', q.status)
        if (q.responsible_id) query = query.eq('responsible_id', q.responsible_id)
        if (q.client_id) query = query.eq('client_id', q.client_id)
        if (q.priority) query = query.eq('priority', q.priority)
        if (q.task_type) query = query.eq('task_type', q.task_type)

        const { data, count, error } = await query
          .order(orderBy, { ascending })
          .range(offset, offset + limit - 1)

        if (error) return fail(res, 400, 'bad_request', error.message)
        return reply(res, 200, { success: true, data, error: null, message: null, meta: { limit, offset, totalCount: count ?? 0 } })
      }

      case 'POST': {
        if (requireWrite(key, res)) return
        const body = req.body || {}
        const fields = pick(body, WRITABLE_FIELDS)

        if (!fields.title || !fields.client_id) {
          return fail(res, 400, 'validation_error', 'title e client_id são obrigatórios')
        }
        const validationError = validateFields(fields)
        if (validationError) return fail(res, 400, 'validation_error', validationError)
        if (!(await clientBelongsToOrg(fields.client_id, orgId))) {
          return fail(res, 400, 'validation_error', 'client_id não pertence à sua organização')
        }

        const { data, error } = await supabase
          .from('tasks')
          .insert({ ...fields, organization_id: orgId })
          .select()
          .single()

        if (error) return fail(res, 400, 'bad_request', error.message)
        return ok(res, 201, data, 'Tarefa criada com sucesso')
      }

      case 'PATCH': {
        if (requireWrite(key, res)) return
        const body = req.body || {}
        const { id } = body
        if (!id || !UUID_RE.test(String(id))) {
          return fail(res, 400, 'validation_error', 'id (UUID) é obrigatório no body')
        }
        const fields = pick(body, WRITABLE_FIELDS)
        const validationError = validateFields(fields)
        if (validationError) return fail(res, 400, 'validation_error', validationError)
        if (fields.client_id && !(await clientBelongsToOrg(fields.client_id, orgId))) {
          return fail(res, 400, 'validation_error', 'client_id não pertence à sua organização')
        }

        const { data, error } = await supabase
          .from('tasks')
          .update(fields)
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .maybeSingle()

        if (error) return fail(res, 400, 'bad_request', error.message)
        if (!data) return fail(res, 404, 'not_found', 'Tarefa não encontrada')
        return ok(res, 200, data, 'Tarefa atualizada com sucesso')
      }

      case 'DELETE': {
        if (requireWrite(key, res)) return
        const id = req.body?.id || req.query?.id
        if (!id || !UUID_RE.test(String(id))) {
          return fail(res, 400, 'validation_error', 'id (UUID) é obrigatório (no body ou query string)')
        }

        // Soft-delete: arquiva em vez de apagar a linha (histórico/relacionamentos preservados).
        const { data, error } = await supabase
          .from('tasks')
          .update({ status: 'arquivado' })
          .eq('id', id)
          .eq('organization_id', orgId)
          .select()
          .maybeSingle()

        if (error) return fail(res, 400, 'bad_request', error.message)
        if (!data) return fail(res, 404, 'not_found', 'Tarefa não encontrada')
        return ok(res, 200, data, 'Tarefa arquivada com sucesso')
      }

      default:
        return fail(res, 405, 'method_not_allowed', `Método ${req.method} não suportado`)
    }
  } catch (error) {
    console.error('[api/tarefas] erro inesperado:', error)
    return fail(res, 500, 'internal_error', 'Erro interno ao processar a requisição')
  }
}
