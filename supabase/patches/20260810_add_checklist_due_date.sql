-- Rodada 1, item 11 — Data em item de checklist.
-- Adiciona due_date opcional em task_checklist_items (schema totum_system,
-- que é o que a produção atual em supa.grupototum.com usa — ver CLAUDE.md).
-- Aplicado via patch (não `supabase db push`) seguindo o mesmo padrão dos
-- patches anteriores neste diretório, já que o histórico de migrations
-- locais não é a fonte de verdade do banco remoto.
--
-- Depois de aplicar, o frontend precisa de (fora deste patch):
--   1. src/components/tasks/taskData.ts: ChecklistItem ganha due_date?: string | null
--   2. src/hooks/useSupabaseTasks.ts: incluir due_date no select/map de task_checklist_items
--   3. src/components/tasks/TaskDetailDialog.tsx: date picker inline + badge quando preenchida

BEGIN;

ALTER TABLE totum_system.task_checklist_items
  ADD COLUMN IF NOT EXISTS due_date date;

NOTIFY pgrst, 'reload schema';

COMMIT;
