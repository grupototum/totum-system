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

type QueueStatus = 'pending' | 'uploading' | 'done' | 'error';
type ErrorCode = 'size' | 'type' | 'empty' | 'batch_limit' | 'storage' | 'db' | 'network' | 'unknown';

export interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: QueueStatus;
  error?: string;
  errorCode?: ErrorCode;
  file?: File;
}

function friendlyError(code: ErrorCode, raw?: string): string {
  const r = (raw || '').toLowerCase();
  switch (code) {
    case 'size':
      return raw || 'Arquivo excede o tamanho máximo permitido (2MB).';
    case 'type':
      return raw || 'Tipo de arquivo não suportado. Use JPG, PNG, WEBP, GIF ou SVG.';
    case 'empty':
      return 'Arquivo vazio ou ilegível.';
    case 'batch_limit':
      return 'Lote excede 20MB no total — clique em Repetir para enviar este arquivo isolado.';
    case 'storage':
      if (r.includes('duplicate')) return 'Já existe um arquivo com este nome no destino.';
      if (r.includes('payload') || r.includes('too large')) return 'Arquivo recusado pelo servidor por ser muito grande.';
      if (r.includes('mime')) return 'Tipo MIME bloqueado pelo servidor.';
      if (r.includes('permission') || r.includes('unauthorized') || r.includes('forbidden'))
        return 'Sem permissão para enviar para este destino.';
      return `Falha no upload: ${raw || 'erro desconhecido'}`;
    case 'db':
      return `Falha ao registrar o anexo no banco: ${raw || 'erro desconhecido'}`;
    case 'network':
      return 'Falha de rede. Verifique sua conexão e tente novamente.';
    default:
      return raw || 'Erro desconhecido durante o envio.';
  }
}

export function useTaskAttachments(tarefaId: string | undefined | null) {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [history, setHistory] = useState<AttachmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);

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

  const setItem = useCallback((qid: string, patch: Partial<UploadQueueItem>) => {
    setUploadQueue((q) => q.map((x) => (x.id === qid ? { ...x, ...patch } : x)));
  }, []);

  const uploadOne = useCallback(
    async (qid: string, file: File, userId?: string | null) => {
      const validation = validateImageFile(file);
      if (!validation.ok) {
        const code: ErrorCode = /excede/i.test(validation.error || '')
          ? 'size'
          : /vazio/i.test(validation.error || '')
          ? 'empty'
          : 'type';
        setItem(qid, { status: 'error', errorCode: code, error: friendlyError(code, validation.error) });
        return false;
      }
      setItem(qid, { status: 'uploading', progress: 10, error: undefined, errorCode: undefined });
      const ext = file.name.split('.').pop();
      const path = `${tarefaId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      try {
        const up = await (supabase.storage as any)
          .from('task-attachments')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (up.error) {
          setItem(qid, { status: 'error', errorCode: 'storage', error: friendlyError('storage', up.error.message) });
          return false;
        }
        setItem(qid, { progress: 70 });
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
          setItem(qid, { status: 'error', errorCode: 'db', error: friendlyError('db', ins.error.message) });
          return false;
        }
        setItem(qid, { progress: 100, status: 'done', error: undefined, errorCode: undefined });
        return true;
      } catch (e: any) {
        setItem(qid, { status: 'error', errorCode: 'network', error: friendlyError('network', e?.message) });
        return false;
      }
    },
    [tarefaId, setItem]
  );

  const uploadMany = useCallback(
    async (files: File[]) => {
      if (!tarefaId) return { accepted: 0, skippedTotalLimit: [] as string[] };
      const batch = files.slice(0, MAX_BATCH);
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      const accepted: File[] = [];
      const skipped: File[] = [];
      let running = 0;
      for (const f of batch) {
        if (running + f.size <= MAX_BATCH_TOTAL_BYTES) {
          accepted.push(f);
          running += f.size;
        } else {
          skipped.push(f);
        }
      }

      const queue: UploadQueueItem[] = accepted.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        progress: 0,
        status: 'pending',
        file: f,
      }));
      const skippedQueue: UploadQueueItem[] = skipped.map((f) => ({
        id: crypto.randomUUID(),
        name: f.name,
        size: f.size,
        progress: 0,
        status: 'error',
        errorCode: 'batch_limit',
        error: friendlyError('batch_limit'),
        file: f,
      }));
      setUploadQueue([...queue, ...skippedQueue]);

      let anySuccess = false;
      for (let i = 0; i < accepted.length; i++) {
        const ok = await uploadOne(queue[i].id, accepted[i], userId);
        if (ok) anySuccess = true;
      }
      if (anySuccess) await load();
      return { accepted: accepted.length, skippedTotalLimit: skipped.map((f) => f.name), totalBytes: running };
    },
    [tarefaId, load, uploadOne]
  );

  const retryOne = useCallback(
    async (qid: string) => {
      const item = uploadQueue.find((x) => x.id === qid);
      if (!item || !item.file) return;
      const { data: userData } = await supabase.auth.getUser();
      const ok = await uploadOne(qid, item.file, userData.user?.id);
      if (ok) await load();
    },
    [uploadQueue, uploadOne, load]
  );


  const remove = useCallback(
    async (anexo: TaskAttachment) => {
      await (supabase.storage as any).from('task-attachments').remove([anexo.storage_path]);
      await (supabase as any).from('tarefa_anexos').delete().eq('id', anexo.id);
      await load();
    },
    [load]
  );

  const removeMany = useCallback(
    async (anexos: TaskAttachment[]) => {
      if (!anexos.length) return { removed: 0, failed: 0 };
      const paths = anexos.map((a) => a.storage_path);
      const ids = anexos.map((a) => a.id);
      let failed = 0;
      const st = await (supabase.storage as any).from('task-attachments').remove(paths);
      if (st?.error) failed = anexos.length;
      const del = await (supabase as any).from('tarefa_anexos').delete().in('id', ids);
      if (del?.error) failed = Math.max(failed, anexos.length);
      await load();
      return { removed: anexos.length - failed, failed };
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
    removeMany,
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
