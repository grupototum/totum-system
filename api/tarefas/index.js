import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    switch (req.method) {
      case 'GET':
        const { data: tarefas, error: getError } = await supabase
          .from('tarefas')
          .select('*')
          .order('created_at', { ascending: false })

        if (getError) throw getError
        return res.status(200).json(tarefas)

      case 'POST':
        const { data: novaTarefa, error: postError } = await supabase
          .from('tarefas')
          .insert(req.body)
          .select()

        if (postError) throw postError
        return res.status(201).json(novaTarefa)

      case 'PATCH':
        const { id, ...updates } = req.body
        const { data: tarefaAtualizada, error: patchError } = await supabase
          .from('tarefas')
          .update(updates)
          .eq('id', id)
          .select()

        if (patchError) throw patchError
        return res.status(200).json(tarefaAtualizada)

      case 'DELETE':
        const { id: deleteId } = req.body
        const { error: deleteError } = await supabase
          .from('tarefas')
          .delete()
          .eq('id', deleteId)

        if (deleteError) throw deleteError
        return res.status(204).end()

      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: error.message })
  }
}
