-- Índices em task_id (task_history, task_checklist_items, task_comments,
-- subtasks) e profiles.organization_id — nenhuma dessas colunas tinha
-- índice além da PK, confirmado via \d+ no banco vivo em 2026-07-19.
-- task_history/task_checklist_items/task_comments/subtasks são varridas
-- juntas em toda chamada de listTasksWithDetails() (src/data/tasks.repo.ts);
-- profiles.organization_id é o filtro da policy "Org scoped profiles select".
--
-- CONCURRENTLY não roda dentro de transação — este arquivo NÃO deve ser
-- envolvido em BEGIN/COMMIT. Aplicar via psql direto na VPS; o arquivo aqui
-- é o registro que mantém o repo espelhando produção (mesma prática do
-- rebaseline do Lote 3).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_history_task_id
  ON totum_system.task_history (task_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_checklist_items_task_id
  ON totum_system.task_checklist_items (task_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_task_comments_task_id
  ON totum_system.task_comments (task_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subtasks_task_id
  ON totum_system.subtasks (task_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_organization_id
  ON totum_system.profiles (organization_id);
