import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
export const ACCEPTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(',');
export const MAX_SIZE_BYTES = 2 * 1024 * 1024;
export const MAX_BATCH = 20;
export const MAX_BATCH_TOTAL_BYTES = 20 * 1024 * 1024;

export interface TaskAttachment {
  id: string;
  tarefa_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string | null;
  created_at: string;
  url?: string;
}

export interface AttachmentHistory {
  id: string;
  tarefa_id: string;
  anexo_id: string | null;
  acao: 'upload' | 'remocao';
  file_name: string;
  user_id: string | null;
  created_at: string;
}

export interface AttachmentSummary {
  count: number;
  lastUpdatedAt: string | null;
  lastAuthor: string | null;
}

export function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateImageFile(file: File): { ok: boolean; error?: string } {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: `Formato não suportado (${file.type || ext}). Use JPG, PNG, WEBP, GIF ou SVG.` };
  }
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { ok: false, error: `Extensão não suportada: ${ext}.` };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, error: `Arquivo excede 2MB (${formatBytes(file.size)}).` };
  }
  if (file.size === 0) {
    return { ok: false, error: 'Arquivo vazio.' };
  }
  return { ok: true };
}

async function signUrl(path: string) {
  const { data } = await (supabase.storage as any)
    .from('task-attachments')
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl;
}

export function useTaskAttachments(tarefaId: string | undefined | null) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [history, setHistory] = useState<AttachmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<
    { id: string; name: string; size: number; progress: number; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]
  >([]);

  const load = useCallback(async () => {
    if (!tarefaId) return;
    setLoading(true);
    const [a, h] = await Promise.all([
      (supabase as any).from('tarefa_anexos').select('*').eq('tarefa_id', tarefaId).order('created_at', { ascending: false }),
      (supabase as any).from('tarefa_anexos_historico').select('*').eq('tarefa_id', tarefaId).order('created_at', { ascending: false }),
    ]);
    const items: TaskAttachment[] = a.data || [];
    const withUrls = await Promise.all(
      items.map(async (it) => ({ ...it, url: await signUrl(it.storage_path) }))
    );
    setAttachments(withUrls);
    setHistory(h.data || []);
    setLoading(false);
  }, [tarefaId]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadMany = useCallback(
    async (files: File[]) => {
      if (!tarefaId) return;
      const batch = files.slice(0, MAX_BATCH);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      const queue = batch.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        progress: 0,
        status: 'pending' as const,
      }));
      setUploadQueue(queue);

      for (let i = 0; i < batch.length; i++) {
        const file = batch[i];
        const qid = queue[i].id;
        const validation = validateImageFile(file);
        if (!validation.ok) {
          setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, status: 'error', error: validation.error } : x)));
          continue;
        }
        setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, status: 'uploading', progress: 10 } : x)));
        const ext = file.name.split('.').pop();
        const path = `${tarefaId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
        const up = await (supabase.storage as any)
          .from('task-attachments')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) {
          setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, status: 'error', error: up.error.message } : x)));
          continue;
        }
        setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, progress: 70 } : x)));
        const ins = await (supabase as any).from('tarefa_anexos').insert({
          tarefa_id: tarefaId,
          storage_path: path,
          file_name: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: userId,
        });
        if (ins.error) {
          await (supabase.storage as any).from('task-attachments').remove([path]);
          setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, status: 'error', error: ins.error.message } : x)));
          continue;
        }
        setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, progress: 100, status: 'done' } : x)));
      }
      await load();
    },
    [tarefaId, load]
  );

  const remove = useCallback(
    async (anexo: TaskAttachment) => {
      await (supabase.storage as any).from('task-attachments').remove([anexo.storage_path]);
      await (supabase as any).from('tarefa_anexos').delete().eq('id', anexo.id);
      await load();
    },
    [load]
  );

  const totalProgress =
    uploadQueue.length > 0
      ? Math.round(uploadQueue.reduce((s, x) => s + x.progress, 0) / uploadQueue.length)
      : 0;
  const doneCount = uploadQueue.filter((x) => x.status === 'done').length;

  return {
    attachments,
    history,
    loading,
    uploadQueue,
    totalProgress,
    doneCount,
    uploadMany,
    remove,
    reload: load,
    clearQueue: () => setUploadQueue([]),
  };
}

export function useTaskAttachmentsSummary(tarefaIds: string[]) {
  const [summary, setSummary] = useState<Record<string, AttachmentSummary>>({});

  useEffect(() => {
    if (!tarefaIds.length) {
      setSummary({});
      return;
    }
    let canceled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('tarefa_anexos')
        .select('tarefa_id, created_at, uploaded_by')
        .in('tarefa_id', tarefaIds);
      if (canceled || !data) return;
      const map: Record<string, AttachmentSummary> = {};
      for (const row of data as any[]) {
        const cur = map[row.tarefa_id] || { count: 0, lastUpdatedAt: null, lastAuthor: null };
        cur.count += 1;
        if (!cur.lastUpdatedAt || row.created_at > cur.lastUpdatedAt) {
          cur.lastUpdatedAt = row.created_at;
          cur.lastAuthor = row.uploaded_by;
        }
        map[row.tarefa_id] = cur;
      }
      setSummary(map);
    })();
    return () => {
      canceled = true;
    };
  }, [tarefaIds.join(',')]);

  return summary;
}
