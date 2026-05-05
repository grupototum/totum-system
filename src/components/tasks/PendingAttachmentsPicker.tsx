import { useCallback, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import {
  PendingFile,
  FileUploadState,
  validateAttachmentFile,
  createPendingFile,
  revokePendingFile,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
} from '@/hooks/useTaskAttachments';

interface PendingAttachmentsPickerProps {
  files: PendingFile[];
  uploadStates?: Record<string, FileUploadState>;
  onFilesChange: (files: PendingFile[]) => void;
  onRetry?: (ids: string[]) => void;
  isUploading?: boolean;
  isDone?: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ProgressBar({ value, status }: { value: number; status: FileUploadState['status'] }) {
  const colors: Record<FileUploadState['status'], string> = {
    pending: 'bg-stone-300',
    uploading: 'bg-amber-400',
    success: 'bg-emerald-500',
    error: 'bg-red-500',
  };
  return (
    <div className="h-1 w-full rounded-full bg-stone-200 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colors[status]} ${status === 'uploading' ? 'animate-pulse' : ''}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function PendingAttachmentsPicker({
  files,
  uploadStates,
  onFilesChange,
  onRetry,
  isUploading,
  isDone,
}: PendingAttachmentsPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const addFiles = useCallback(
    (raw: FileList | File[]) => {
      const arr = Array.from(raw);
      const valid: PendingFile[] = [];
      const errors: string[] = [];

      for (const f of arr) {
        const err = validateAttachmentFile(f);
        if (err) {
          errors.push(`${f.name}: ${err}`);
          continue;
        }
        // skip duplicates by name + size
        const isDupe = files.some((p) => p.file.name === f.name && p.file.size === f.size);
        if (isDupe) continue;
        valid.push(createPendingFile(f));
      }

      if (errors.length) toast.error(errors.join('\n'), { duration: 5000 });
      if (valid.length) onFilesChange([...files, ...valid]);
    },
    [files, onFilesChange],
  );

  const removeFile = (id: string) => {
    const pf = files.find((f) => f.id === id);
    if (pf) revokePendingFile(pf);
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...files];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onFilesChange(next);
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    const next = [...files];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onFilesChange(next);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const failedIds = uploadStates
    ? Object.values(uploadStates)
        .filter((s) => s.status === 'error')
        .map((s) => s.id)
    : [];

  const isPhaseActive = isUploading || isDone;

  return (
    <div className="space-y-3">
      {/* Drop zone — hidden during upload phase */}
      {!isPhaseActive && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-stone-500 bg-stone-100'
              : 'border-stone-300 bg-stone-50/50 hover:bg-stone-100/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(',')}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <Icon icon="solar:upload-linear" className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          <p className="text-sm font-medium text-stone-600">
            Arraste imagens aqui ou <span className="text-stone-900 underline">clique para selecionar</span>
          </p>
          <p className="text-xs text-stone-400 mt-1">
            {ALLOWED_EXTENSIONS.join(', ').toUpperCase()} · Máx. {formatBytes(MAX_FILE_SIZE_BYTES)} por arquivo
          </p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((pf, index) => {
            const state = uploadStates?.[pf.id];
            const status = state?.status ?? 'pending';
            const progress = state?.progress ?? 0;

            return (
              <li
                key={pf.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 bg-white"
              >
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-md overflow-hidden bg-stone-100 flex-shrink-0 flex items-center justify-center">
                  {pf.preview ? (
                    <img src={pf.preview} alt={pf.file.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon icon="solar:gallery-linear" className="w-5 h-5 text-stone-400" />
                  )}
                </div>

                {/* Info + progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-stone-800 truncate">{pf.file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-stone-400">{formatBytes(pf.file.size)}</span>
                    {status === 'error' && state?.error && (
                      <span className="text-[10px] text-red-500 truncate">{state.error}</span>
                    )}
                    {status === 'success' && (
                      <span className="text-[10px] text-emerald-600">Enviado</span>
                    )}
                  </div>
                  {isPhaseActive && (
                    <div className="mt-1.5">
                      <ProgressBar value={progress} status={status} />
                    </div>
                  )}
                </div>

                {/* Status icon during phase */}
                {isPhaseActive && (
                  <div className="flex-shrink-0">
                    {status === 'uploading' && (
                      <Icon icon="solar:refresh-bold" className="w-4 h-4 text-amber-500 animate-spin" />
                    )}
                    {status === 'success' && (
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-emerald-500" />
                    )}
                    {status === 'error' && (
                      <Icon icon="solar:close-circle-bold" className="w-4 h-4 text-red-500" />
                    )}
                    {status === 'pending' && (
                      <Icon icon="solar:clock-circle-linear" className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                )}

                {/* Reorder + remove — only before upload */}
                {!isPhaseActive && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Mover para cima"
                    >
                      <Icon icon="solar:arrow-up-linear" className="w-3.5 h-3.5 text-stone-500" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === files.length - 1}
                      className="p-1 rounded hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Mover para baixo"
                    >
                      <Icon icon="solar:arrow-down-linear" className="w-3.5 h-3.5 text-stone-500" />
                    </button>
                    <button
                      onClick={() => removeFile(pf.id)}
                      className="p-1 rounded hover:bg-red-50 transition-colors ml-0.5"
                      title="Remover"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Retry button for failed files */}
      {isDone && failedIds.length > 0 && onRetry && (
        <button
          onClick={() => onRetry(failedIds)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <Icon icon="solar:refresh-bold" className="w-4 h-4" />
          Reenviar {failedIds.length} arquivo{failedIds.length > 1 ? 's' : ''} com falha
        </button>
      )}

      {/* Empty state */}
      {!isPhaseActive && files.length === 0 && (
        <p className="text-xs text-stone-400 text-center py-1">Nenhum arquivo adicionado</p>
      )}
    </div>
  );
}
