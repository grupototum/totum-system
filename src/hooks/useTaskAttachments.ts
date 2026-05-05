import { supabase } from '@/integrations/supabase/client';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
];

export const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface PendingFile {
  id: string;
  file: File;
  preview?: string;
}

export interface FileUploadState {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function validateAttachmentFile(file: File): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return `Extensão .${ext} não permitida. Use: ${ALLOWED_EXTENSIONS.join(', ')}`;
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Tipo de arquivo não suportado (${file.type || 'desconhecido'})`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Arquivo muito grande. Máximo permitido: 5 MB`;
  }
  return null;
}

export function createPendingFile(file: File): PendingFile {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    file,
    preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
  };
}

export function revokePendingFile(pf: PendingFile) {
  if (pf.preview) URL.revokeObjectURL(pf.preview);
}

export async function uploadTaskAttachmentFile(
  tarefaId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${tarefaId}/${uniqueName}`;

  const { error } = await supabase.storage
    .from('task-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) return { error: error.message };

  const { data } = supabase.storage.from('task-attachments').getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function uploadTaskAttachmentFiles(
  tarefaId: string,
  files: PendingFile[],
  onFileUpdate: (id: string, update: Partial<FileUploadState>) => void,
): Promise<{ succeeded: string[]; failed: string[] }> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const pending of files) {
    onFileUpdate(pending.id, { status: 'uploading', progress: 40 });
    const result = await uploadTaskAttachmentFile(tarefaId, pending.file);
    if ('error' in result) {
      failed.push(pending.id);
      onFileUpdate(pending.id, { status: 'error', progress: 0, error: result.error });
    } else {
      succeeded.push(pending.id);
      onFileUpdate(pending.id, { status: 'success', progress: 100 });
    }
  }

  return { succeeded, failed };
}

export interface StoredAttachment {
  name: string;
  url: string;
  createdAt?: string;
}

export async function listTaskAttachments(tarefaId: string): Promise<StoredAttachment[]> {
  const { data, error } = await supabase.storage
    .from('task-attachments')
    .list(tarefaId, { sortBy: { column: 'created_at', order: 'asc' } });

  if (error || !data) return [];

  return data.map((item) => {
    const { data: pub } = supabase.storage
      .from('task-attachments')
      .getPublicUrl(`${tarefaId}/${item.name}`);
    return { name: item.name, url: pub.publicUrl, createdAt: item.created_at };
  });
}

export async function deleteTaskAttachment(tarefaId: string, fileName: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from('task-attachments')
    .remove([`${tarefaId}/${fileName}`]);
  return !error;
}
