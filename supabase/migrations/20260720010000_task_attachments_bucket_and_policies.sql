-- Provisiona o bucket task-attachments e as 4 policies de storage.objects
-- que o patch de 13/05 previa mas nunca chegou a criar (bucket nunca
-- existiu — confirmado via storage.buckets em 2026-07-19). A função
-- can_access_task_attachment_path() já existe viva em totum_system,
-- só faltava o bucket e as policies que a usam.
--
-- Bucket PRIVADO (public=false): anexo de tarefa é potencialmente dado
-- sensível de cliente de agência; bucket público no Storage do Supabase
-- permite leitura via URL sem checar RLS nenhuma. file_size_limit é
-- default de partida (25MB), ajustável depois, não requisito coletado.
--
-- Referencia totum_system.can_access_task_attachment_path e
-- totum_system.is_master_user explicitamente (não public.*) — são as
-- versões vivas confirmadas via pg_get_functiondef; o schema public tem
-- cópias órfãs do split-brain antigo que não devem ser usadas aqui.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('task-attachments', 'task-attachments', false, 26214400)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Org members can read task attachment objects" ON storage.objects;
CREATE POLICY "Org members can read task attachment objects"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND totum_system.can_access_task_attachment_path(name)
  );

DROP POLICY IF EXISTS "Org members can upload task attachment objects" ON storage.objects;
CREATE POLICY "Org members can upload task attachment objects"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND totum_system.can_access_task_attachment_path(name)
  );

DROP POLICY IF EXISTS "Org members can update task attachment objects" ON storage.objects;
CREATE POLICY "Org members can update task attachment objects"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND totum_system.can_access_task_attachment_path(name)
  )
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND totum_system.can_access_task_attachment_path(name)
  );

DROP POLICY IF EXISTS "Org members can delete task attachment objects" ON storage.objects;
CREATE POLICY "Org members can delete task attachment objects"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND (owner = auth.uid() OR totum_system.is_master_user())
  );

COMMIT;
