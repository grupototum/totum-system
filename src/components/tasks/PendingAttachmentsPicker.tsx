import { useRef, useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ACCEPT_ATTR,
  MAX_BATCH,
  MAX_BATCH_TOTAL_BYTES,
  MAX_SIZE_BYTES,
  formatBytes,
  validateImageFile,
} from '@/hooks/useTaskAttachments';

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
}

/**
 * Picker for attachments before a task exists.
 * Holds a local File[] buffer that the parent uploads after task creation.
 */
export function PendingAttachmentsPicker({ files, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragOver, setDragOver] = useState(false);

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const usedPct = Math.min(100, (totalBytes / MAX_BATCH_TOTAL_BYTES) * 100);

  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types || []).includes('Files');

  const addFiles = (incoming: FileList | File[]) => {
    const arr = Array.from(incoming);
    if (!arr.length) return;
    const remainingSlots = Math.max(0, MAX_BATCH - files.length);
    if (arr.length > remainingSlots) {
      toast.warning(`Máximo de ${MAX_BATCH} arquivos. Apenas os primeiros ${remainingSlots} serão considerados.`);
    }
    const candidates = arr.slice(0, remainingSlots);
    const valid: File[] = [];
    let running = totalBytes;
    for (const f of candidates) {
      const v = validateImageFile(f);
      if (!v.ok) {
        toast.error(`${f.name}: ${v.error}`);
        continue;
      }
      if (running + f.size > MAX_BATCH_TOTAL_BYTES) {
        toast.error(`${f.name}: lote excede ${formatBytes(MAX_BATCH_TOTAL_BYTES)}.`);
        continue;
      }
      // Avoid duplicates by name+size
      if (files.some((x) => x.name === f.name && x.size === f.size)) continue;
      valid.push(f);
      running += f.size;
    }
    if (valid.length) onChange([...files, ...valid]);
  };

  const removeAt = (idx: number) => {
    const next = [...files];
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          dragDepth.current++;
          setDragOver(true);
        }}
        onDragOver={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
        }}
        onDragLeave={(e) => {
          if (!hasFiles(e)) return;
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragOver(false);
        }}
        onDrop={(e) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          dragDepth.current = 0;
          setDragOver(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-[#ff3b3b] bg-[#ff3b3b]/5' : 'border-stone-300 bg-white/40 hover:bg-white/60'
        }`}
      >
        <Icon name="solar:cloud-upload-linear" className="w-7 h-7 text-stone-500 mx-auto mb-2" />
        <div className="text-sm font-medium text-stone-700">
          Arraste imagens aqui ou clique para selecionar
        </div>
        <div className="text-xs text-stone-500 mt-1">
          Os anexos serão enviados ao salvar a tarefa · até {formatBytes(MAX_SIZE_BYTES)} por arquivo · máx {MAX_BATCH} · lote {formatBytes(MAX_BATCH_TOTAL_BYTES)}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <div className="bg-white/60 rounded-lg p-3 border border-stone-200 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-stone-600">
            <span>
              {files.length} arquivo(s) pendente(s)
            </span>
            <span className={totalBytes > MAX_BATCH_TOTAL_BYTES ? 'text-red-500 font-medium' : ''}>
              {formatBytes(totalBytes)} / {formatBytes(MAX_BATCH_TOTAL_BYTES)}
            </span>
          </div>
          <div className="h-1 w-full bg-stone-200 rounded overflow-hidden">
            <div
              className="h-full bg-[#ff3b3b] transition-all"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <ul className="space-y-1.5 max-h-44 overflow-y-auto">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 text-xs">
                <Icon name="solar:gallery-linear" className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span className="flex-1 truncate text-stone-700" title={f.name}>{f.name}</span>
                <span className="text-stone-500 tabular-nums shrink-0">{formatBytes(f.size)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAt(i)}
                  className="h-6 w-6 p-0 text-stone-500 hover:text-red-500"
                  aria-label={`Remover ${f.name}`}
                >
                  <Icon name="solar:close-circle-linear" className="w-3.5 h-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
