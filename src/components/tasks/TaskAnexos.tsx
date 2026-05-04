import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useTaskAttachments,
  ACCEPT_ATTR,
  MAX_BATCH,
  MAX_SIZE_BYTES,
  MAX_BATCH_TOTAL_BYTES,
  formatBytes,
  validateImageFile,
} from '@/hooks/useTaskAttachments';
import { AttachmentLightbox } from './AttachmentLightbox';

interface Props {
  tarefaId: string;
}

type SortKey = 'recent' | 'oldest' | 'name_asc' | 'name_desc';

export function TaskAnexos({ tarefaId }: Props) {
  const {
    attachments,
    history,
    loading,
    uploadQueue,
    totalProgress,
    doneCount,
    uploadMany,
    retryOne,
    remove,
    removeMany,
    clearQueue,
  } = useTaskAttachments(tarefaId);

  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const hasFiles = (e: React.DragEvent) =>
    Array.from(e.dataTransfer?.types || []).includes('Files');

  const [sortBy, setSortBy] = useState<SortKey>(() => {
    if (typeof window === 'undefined') return 'recent';
    const v = window.localStorage.getItem('task-anexos-sort');
    return (v === 'recent' || v === 'oldest' || v === 'name_asc' || v === 'name_desc') ? v : 'recent';
  });
  useEffect(() => {
    try { window.localStorage.setItem('task-anexos-sort', sortBy); } catch {}
  }, [sortBy]);

  const filtered = useMemo(() => {
    const list = attachments.filter((a) =>
      a.file_name.toLowerCase().includes(search.toLowerCase())
    );
    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return a.created_at.localeCompare(b.created_at);
        case 'name_asc':
          return a.file_name.localeCompare(b.file_name, 'pt-BR', { numeric: true, sensitivity: 'base' });
        case 'name_desc':
          return b.file_name.localeCompare(a.file_name, 'pt-BR', { numeric: true, sensitivity: 'base' });
        case 'recent':
        default:
          return b.created_at.localeCompare(a.created_at);
      }
    });
    return sorted;
  }, [attachments, search, sortBy]);

  const selectionMode = selected.size > 0;
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const toggleAll = () => {
    if (allFilteredSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
  };

  const handleBulkDelete = async () => {
    const items = attachments.filter((a) => selected.has(a.id));
    if (!items.length) return;
    setBulkDeleting(true);
    const res = await removeMany(items);
    setBulkDeleting(false);
    setConfirmOpen(false);
    setSelected(new Set());
    if (res.removed > 0) toast.success(`${res.removed} anexo(s) excluído(s).`);
    if (res.failed > 0) toast.error(`${res.failed} anexo(s) não puderam ser excluídos.`);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    if (arr.length > MAX_BATCH) {
      toast.warning(`Máximo de ${MAX_BATCH} arquivos por vez. Apenas os primeiros ${MAX_BATCH} serão processados.`);
    }
    const invalid = arr.slice(0, MAX_BATCH).map((f) => ({ f, v: validateImageFile(f) }));
    const errors = invalid.filter((x) => !x.v.ok);
    if (errors.length) {
      errors.forEach((e) => toast.error(`${e.f.name}: ${e.v.error}`));
    }
    const valid = invalid.filter((x) => x.v.ok).map((x) => x.f);
    if (!valid.length) return;
    const result = await uploadMany(valid);
    const ok = result?.accepted ?? 0;
    const skipped = result?.skippedTotalLimit ?? [];
    if (ok > 0) toast.success(`${ok} ${ok === 1 ? 'imagem enviada' : 'imagens enviadas'} com sucesso.`);
    if (skipped.length) {
      toast.error(`${skipped.length} arquivo(s) ignorado(s): lote excede ${(MAX_BATCH_TOTAL_BYTES / 1024 / 1024).toFixed(0)}MB.`);
    }
  };

  const errorCount = uploadQueue.filter((q) => q.status === 'error').length;
  const allDone =
    uploadQueue.length > 0 && uploadQueue.every((q) => q.status === 'done');

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => clearQueue(), 1500);
      return () => clearTimeout(t);
    }
  }, [allDone, clearQueue]);

  const retryAllErrors = async () => {
    const ids = uploadQueue.filter((q) => q.status === 'error' && q.file).map((q) => q.id);
    for (const id of ids) {
      await retryOne(id);
    }
  };

  return (
    <div
      className="relative p-6 space-y-5"
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
        handleFiles(e.dataTransfer.files);
      }}
    >
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-[#ff3b3b] bg-[#ff3b3b]/5' : 'border-stone-300 bg-white/40 hover:bg-white/60'
        }`}
      >
        <Icon name="solar:cloud-upload-linear" className="w-8 h-8 text-stone-500 mx-auto mb-2" />
        <div className="text-sm font-medium text-stone-700">
          Arraste imagens aqui ou clique para selecionar
        </div>
        <div className="text-xs text-stone-500 mt-1">
          JPG, PNG, WEBP, GIF, SVG · até {formatBytes(MAX_SIZE_BYTES)} por arquivo · máx {MAX_BATCH} por lote · lote total até {formatBytes(MAX_BATCH_TOTAL_BYTES)}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Upload queue */}
      {uploadQueue.length > 0 && (() => {
        const usedBytes = uploadQueue.reduce((s, x) => s + x.size, 0);
        const usedPct = Math.min(100, (usedBytes / MAX_BATCH_TOTAL_BYTES) * 100);
        return (
        <div className="space-y-2 bg-white/60 rounded-lg p-3 border border-stone-200">
          <div className="flex items-center justify-between text-[11px] text-stone-600">
            <span>Tamanho do lote</span>
            <span className={usedBytes > MAX_BATCH_TOTAL_BYTES ? 'text-red-500 font-medium' : ''}>
              {formatBytes(usedBytes)} / {formatBytes(MAX_BATCH_TOTAL_BYTES)}
            </span>
          </div>
          <Progress value={usedPct} className="h-1" />
          <div className="flex items-center justify-between text-xs text-stone-600 pt-1">
            <span>
              {doneCount}/{uploadQueue.length} concluídos
              {errorCount > 0 && (
                <span className="ml-2 text-red-500 font-medium">· {errorCount} falha(s)</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {errorCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryAllErrors}
                  className="h-6 px-2 text-xs gap-1 text-[#ff3b3b] hover:text-[#ff3b3b]/80"
                >
                  <Icon name="solar:refresh-linear" className="w-3 h-3" />
                  Repetir todos
                </Button>
              )}
              <span>{totalProgress}%</span>
            </div>
          </div>
          <Progress value={totalProgress} className="h-1.5" />
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {uploadQueue.map((q) => (
              <div key={q.id} className="flex items-start gap-2 text-xs py-1">
                <Icon
                  name={
                    q.status === 'done'
                      ? 'solar:check-circle-bold'
                      : q.status === 'error'
                      ? 'solar:close-circle-bold'
                      : 'solar:upload-linear'
                  }
                  className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                    q.status === 'done' ? 'text-emerald-600' : q.status === 'error' ? 'text-red-500' : 'text-stone-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-stone-700" title={q.name}>{q.name}</div>
                  {q.status === 'error' ? (
                    <div className="text-[11px] text-red-500 leading-snug" title={q.error}>
                      {q.error}
                    </div>
                  ) : q.status === 'done' ? (
                    <div className="text-[11px] text-emerald-600">Enviado</div>
                  ) : (
                    <Progress value={q.progress} className="h-1 w-full mt-1" />
                  )}
                </div>
                {q.status === 'error' && q.file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retryOne(q.id)}
                    className="h-6 px-2 text-xs gap-1 text-[#ff3b3b] hover:text-[#ff3b3b]/80 shrink-0"
                  >
                    <Icon name="solar:refresh-linear" className="w-3 h-3" />
                    Repetir
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
        );
      })()}

      {/* Search */}
      {attachments.length > 0 && (
        <div className="relative">
          <Icon name="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Buscar por nome de arquivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-stone-300"
          />
        </div>
      )}

      {/* Selection bar */}
      {attachments.length > 0 && (
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900"
          >
            <Checkbox checked={allFilteredSelected} className="pointer-events-none" />
            <span>{allFilteredSelected ? 'Limpar seleção' : 'Selecionar todos'}</span>
          </button>
          {selectionMode && (
            <div className="flex items-center gap-2">
              <span className="text-stone-600">{selected.size} selecionado(s)</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelected(new Set())}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                className="h-7 text-xs gap-1"
              >
                <Icon name="solar:trash-bin-trash-linear" className="w-3.5 h-3.5" />
                Excluir selecionados
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="text-sm text-stone-500 text-center py-6">Carregando…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-stone-400 text-center py-6">
          {attachments.length === 0 ? 'Nenhum anexo ainda.' : 'Nenhum arquivo corresponde à busca.'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((a) => {
            const isSel = selected.has(a.id);
            return (
            <div
              key={a.id}
              className={`group relative bg-white rounded-lg border overflow-hidden transition-all ${
                isSel ? 'border-[#ff3b3b] ring-2 ring-[#ff3b3b]' : 'border-stone-200'
              }`}
            >
              <button
                onClick={() => {
                  if (selectionMode) toggleOne(a.id);
                  else setLightboxIndex(filtered.findIndex((x) => x.id === a.id));
                }}
                className="block w-full aspect-square bg-stone-100"
              >
                {a.url && (
                  <img src={a.url} alt={a.file_name} className="w-full h-full object-cover" loading="lazy" />
                )}
              </button>
              {/* Selection checkbox */}
              <div
                className={`absolute top-1 left-1 p-1 bg-white/90 rounded-md transition-opacity ${
                  selectionMode || isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOne(a.id);
                }}
              >
                <Checkbox checked={isSel} className="pointer-events-none" />
              </div>
              <div className="p-2 text-xs">
                <div className="truncate font-medium text-stone-700" title={a.file_name}>
                  {a.file_name}
                </div>
                <div className="text-stone-400 flex items-center justify-between mt-0.5">
                  <span>{formatBytes(a.size_bytes)}</span>
                  <span>{format(new Date(a.created_at), 'dd/MM HH:mm', { locale: ptBR })}</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Remover anexo?')) await remove(a);
                }}
                className="absolute top-1 right-1 p-1 bg-white/90 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remover"
              >
                <Icon name="solar:trash-bin-trash-linear" className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
            );
          })}
        </div>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selected.size} anexo(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os arquivos serão removidos permanentemente e a operação será registrada no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleBulkDelete();
              }}
              disabled={bulkDeleting}
              className="bg-[#ff3b3b] hover:bg-[#ff3b3b]/90"
            >
              {bulkDeleting ? 'Excluindo…' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-stone-200 pt-4">
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider hover:text-stone-900"
          >
            <Icon
              name={showHistory ? 'solar:alt-arrow-down-linear' : 'solar:alt-arrow-right-linear'}
              className="w-3.5 h-3.5"
            />
            Histórico ({history.length})
          </button>
          {showHistory && (
            <ul className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {history.map((h) => (
                <li key={h.id} className="flex items-start gap-2 text-xs text-stone-600">
                  <Icon
                    name={h.acao === 'upload' ? 'solar:upload-linear' : 'solar:trash-bin-trash-linear'}
                    className={`w-3.5 h-3.5 mt-0.5 ${h.acao === 'upload' ? 'text-emerald-600' : 'text-red-500'}`}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{h.acao === 'upload' ? 'Anexou' : 'Removeu'}</span>{' '}
                    <span className="text-stone-500">{h.file_name}</span>
                    <div className="text-[10px] text-stone-400">
                      {format(new Date(h.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <AttachmentLightbox
          items={filtered}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Global drop overlay */}
      {dragOver && (
        <div className="absolute inset-0 z-40 rounded-xl border-2 border-dashed border-[#ff3b3b] bg-stone-900/40 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <Icon name="solar:cloud-upload-bold" className="w-16 h-16 text-[#ff3b3b] mb-3" />
          <div className="text-base font-semibold text-white">Solte para anexar imagens</div>
          <div className="text-xs text-white/80 mt-1">
            Até {MAX_BATCH} arquivos · {formatBytes(MAX_SIZE_BYTES)} por arquivo · {formatBytes(MAX_BATCH_TOTAL_BYTES)} por lote
          </div>
        </div>
      )}
    </div>
  );
}
