-- Rodada 1, item 1 — Co-responsável e observador em tarefas.
-- Cria a tabela task_participants(task_id, user_id, role) com enum
-- co_responsible | observer, no schema totum_system (produção atual em
-- supa.grupototum.com — ver CLAUDE.md). Aplicado via patch, mesmo padrão
-- dos patches anteriores neste diretório.
--
-- Decisões de design (documentadas aqui pra quem revisar antes de aplicar):
--   - RLS segue o MESMO padrão já usado em task_checklist_items/subtasks:
--     acesso liberado pra qualquer membro da organização que já pode acessar
--     a tarefa (via can_access_task), SEM checagem de role no banco. Isso é
--     consistente com o resto do schema — nenhuma tabela hoje faz enforcement
--     de role em RLS, só isolamento por organização (ver B-028/B-029 em
--     BUGS.md). Mudar esse padrão pra `tasks` em si é um projeto à parte,
--     fora do escopo deste patch.
--   - A regra de negócio "observador só lê e comenta, não edita campos da
--     tarefa" é enforced no FRONTEND (formulário/UI), não no banco — mesma
--     situação de responsible_id hoje. task_comments já aceita comentário de
--     qualquer membro da org (sem checar role), então "observador pode
--     comentar" já funciona sem mudança nenhuma.
--   - user_id NÃO tem FK pra profiles — segue o mesmo padrão solto já usado
--     em tasks.responsible_id, task_comments.user_id, task_history.user_id
--     (nenhuma dessas colunas tem FK pra profiles no schema atual).
--   - UNIQUE(task_id, user_id): uma pessoa só pode ter UM papel por tarefa
--     (não dá pra ser co-responsável E observador da mesma tarefa ao mesmo
--     tempo). Não impede que o responsible_id principal também apareça como
--     participante — isso fica a cargo do frontend evitar, se quiser.

BEGIN;

DO $$ BEGIN
  CREATE TYPE totum_system.task_participant_role AS ENUM ('co_responsible', 'observer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS totum_system.task_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role totum_system.task_participant_role NOT NULL,
    organization_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT task_participants_pkey PRIMARY KEY (id),
    CONSTRAINT task_participants_task_id_fkey FOREIGN KEY (task_id)
      REFERENCES totum_system.tasks(id) ON DELETE CASCADE,
    CONSTRAINT task_participants_organization_id_fkey FOREIGN KEY (organization_id)
      REFERENCES totum_system.organizations(id) ON DELETE SET NULL,
    CONSTRAINT task_participants_task_user_unique UNIQUE (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_participants_task_id
  ON totum_system.task_participants (task_id);
CREATE INDEX IF NOT EXISTS idx_task_participants_user_id
  ON totum_system.task_participants (user_id);

ALTER TABLE totum_system.task_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org members can manage task participants" ON totum_system.task_participants;
CREATE POLICY "Org members can manage task participants"
  ON totum_system.task_participants FOR ALL TO authenticated
  USING (totum_system.can_access_task(task_id))
  WITH CHECK (totum_system.can_access_task(task_id));

NOTIFY pgrst, 'reload schema';

COMMIT;
