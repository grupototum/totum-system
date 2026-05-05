import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tarefa, Projeto, StatusTarefa, PrioridadeTarefa, COLUNAS_KANBAN, PRIORIDADES } from '@/hooks/useTasks';
import { TaskSubtarefas } from './TaskSubtarefas';
import { TaskComentarios } from './TaskComentarios';
import { TaskAnexos } from './TaskAnexos';
import { PendingAttachmentsPicker } from './PendingAttachmentsPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@iconify/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  PendingFile,
  FileUploadState,
  uploadTaskAttachmentFiles,
} from '@/hooks/useTaskAttachments';

type TabId = 'detalhes' | 'subtarefas' | 'comentarios' | 'anexos';
type UploadPhase = 'idle' | 'uploading' | 'done';

interface TaskModalProps {
  tarefa: Tarefa | null;
  isOpen: boolean;
  onClose: () => void;
  projetos: Projeto[];
  onSave: (tarefa: Partial<Tarefa>) => Promise<Tarefa | null>;
  onDelete: (id: string) => Promise<boolean>;
  onToggleSubtarefa: (tarefaId: string, subtarefaId: string) => Promise<boolean>;
  onAddSubtarefa: (tarefaId: string, titulo: string) => Promise<boolean>;
  onRemoveSubtarefa: (tarefaId: string, subtarefaId: string) => Promise<boolean>;
  onAddComentario?: (tarefaId: string, conteudo: string) => Promise<void>;
  currentUser?: string;
  mode: 'view' | 'create' | 'edit';
}

const TAG_OPTIONS = [
  'Bug', 'Feature', 'Design', 'Marketing',
  'Urgente', 'Cliente', 'Interno', 'Revisão', 'Deploy',
];

export function TaskModal({
  tarefa,
  isOpen,
  onClose,
  projetos,
  onSave,
  onDelete,
  onToggleSubtarefa,
  onAddSubtarefa,
  onRemoveSubtarefa,
  onAddComentario,
  currentUser = 'Usuário',
  mode: initialMode,
}: TaskModalProps) {
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>(initialMode);
  const [formData, setFormData] = useState<Partial<Tarefa>>({});
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('detalhes');
  const [saving, setSaving] = useState(false);

  // Attachment state
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<string, FileUploadState>>({});
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (tarefa) {
      setFormData({ ...tarefa });
    } else {
      setFormData({ titulo: '', descricao: '', status: 'pendente', prioridade: 'media', tags: [], subtarefas: [] });
    }
    setMode(initialMode);
    setActiveTab('detalhes');
    setPendingFiles([]);
    setUploadStates({});
    setUploadPhase('idle');
    setCreatedTaskId(null);
  }, [tarefa, isOpen, initialMode]);

  const initUploadStates = (files: PendingFile[]) => {
    const states: Record<string, FileUploadState> = {};
    for (const pf of files) {
      states[pf.id] = { id: pf.id, name: pf.file.name, status: 'pending', progress: 0 };
    }
    setUploadStates(states);
  };

  const updateFileState = useCallback((id: string, update: Partial<FileUploadState>) => {
    setUploadStates((prev) => ({ ...prev, [id]: { ...prev[id], ...update } }));
  }, []);

  const runUpload = useCallback(
    async (taskId: string, files: PendingFile[]) => {
      setUploadPhase('uploading');
      const { succeeded, failed } = await uploadTaskAttachmentFiles(taskId, files, updateFileState);
      setUploadPhase('done');
      if (failed.length === 0) {
        toast.success(`${succeeded.length} anexo${succeeded.length > 1 ? 's' : ''} enviado${succeeded.length > 1 ? 's' : ''} com sucesso`);
      } else {
        toast.warning(`${succeeded.length} enviado${succeeded.length > 1 ? 's' : ''}, ${failed.length} com falha`);
      }
    },
    [updateFileState],
  );

  const handleRetry = useCallback(
    async (failedIds: string[]) => {
      if (!createdTaskId) return;
      const toRetry = pendingFiles.filter((pf) => failedIds.includes(pf.id));
      // Reset failed files to pending
      for (const id of failedIds) {
        updateFileState(id, { status: 'pending', progress: 0, error: undefined });
      }
      setUploadPhase('uploading');
      const { succeeded, failed } = await uploadTaskAttachmentFiles(createdTaskId, toRetry, updateFileState);
      setUploadPhase('done');
      if (failed.length === 0) {
        toast.success(`Todos os arquivos enviados com sucesso`);
      } else {
        toast.warning(`${succeeded.length} enviado${succeeded.length > 1 ? 's' : ''}, ${failed.length} ainda com falha`);
      }
    },
    [createdTaskId, pendingFiles, updateFileState],
  );

  const handleSave = async () => {
    if (!formData.titulo?.trim()) return;
    setSaving(true);
    const result = await onSave(formData);
    setSaving(false);

    if (!result) return;

    if (mode === 'create' && pendingFiles.length > 0) {
      setCreatedTaskId(result.id);
      initUploadStates(pendingFiles);
      setActiveTab('anexos');
      await runUpload(result.id, pendingFiles);
    } else {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!tarefa) return;
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    const success = await onDelete(tarefa.id);
    if (success) onClose();
  };

  const addTag = (tag: string) => {
    const tags = formData.tags || [];
    if (tag && !tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({ ...prev, tags: (prev.tags || []).filter((t) => t !== tag) }));
  };

  const getStatusColor = (s: StatusTarefa) => COLUNAS_KANBAN.find((c) => c.id === s)?.cor || '#78716C';

  const isEditing = mode === 'create' || mode === 'edit';
  const isUploadingOrDone = uploadPhase === 'uploading' || uploadPhase === 'done';

  // Build tab list depending on mode
  const tabs: { id: TabId; label: string; icon: string; badge?: number }[] = isEditing
    ? [
        { id: 'detalhes', label: 'Detalhes', icon: 'solar:document-text-linear' },
        { id: 'anexos', label: 'Anexos', icon: 'solar:gallery-linear', badge: pendingFiles.length || undefined },
      ]
    : [
        { id: 'detalhes', label: 'Detalhes', icon: 'solar:document-text-linear' },
        { id: 'subtarefas', label: 'Subtarefas', icon: 'solar:checklist-linear' },
        { id: 'comentarios', label: 'Comentários', icon: 'solar:chat-dots-linear' },
        { id: 'anexos', label: 'Anexos', icon: 'solar:gallery-linear' },
      ];

  const failedCount = Object.values(uploadStates).filter((s) => s.status === 'error').length;
  const successCount = Object.values(uploadStates).filter((s) => s.status === 'success').length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isUploadingOrDone ? undefined : onClose}
            className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#EAEAE5] shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-300 bg-white/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-stone-200/50 rounded-lg transition-colors"
                >
                  <Icon icon="solar:arrow-right-linear" className="w-5 h-5 text-stone-600" />
                </button>
                <span className="text-sm font-medium text-stone-500">
                  {mode === 'create' ? 'Nova Tarefa' : mode === 'edit' ? 'Editar Tarefa' : 'Detalhes'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'view' && tarefa && (
                  <>
                    <button
                      onClick={() => setMode('edit')}
                      className="p-2 hover:bg-stone-200/50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Icon icon="solar:pen-linear" className="w-5 h-5 text-stone-600" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="p-2 hover:bg-red-100/50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Icon icon="solar:trash-bin-trash-linear" className="w-5 h-5 text-red-500" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-300 bg-white/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => !isUploadingOrDone || tab.id === 'anexos' ? setActiveTab(tab.id) : undefined}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors relative
                    ${activeTab === tab.id
                      ? 'text-stone-900 border-b-2 border-stone-900 bg-white/50'
                      : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/30'
                    }
                    ${isUploadingOrDone && tab.id !== 'anexos' ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <Icon icon={tab.icon} className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-stone-900 text-white text-[10px] font-bold flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Upload done summary banner */}
              {uploadPhase === 'done' && (
                <div className={`mx-4 mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  failedCount === 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <Icon
                    icon={failedCount === 0 ? 'solar:check-circle-bold' : 'solar:danger-bold'}
                    className="w-4 h-4 flex-shrink-0"
                  />
                  {failedCount === 0
                    ? `${successCount} anexo${successCount !== 1 ? 's' : ''} enviado${successCount !== 1 ? 's' : ''} com sucesso`
                    : `${successCount} enviado${successCount !== 1 ? 's' : ''} · ${failedCount} com falha`}
                  {uploadPhase === 'done' && (
                    <button
                      onClick={onClose}
                      className="ml-auto text-xs underline opacity-70 hover:opacity-100"
                    >
                      Fechar
                    </button>
                  )}
                </div>
              )}

              {/* Tab content */}
              {activeTab === 'detalhes' && (isEditing || mode === 'view') && (
                <div className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Título</Label>
                    {isEditing ? (
                      <Input
                        value={formData.titulo || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Nome da tarefa"
                        className="bg-white border-stone-300 focus:border-stone-500"
                      />
                    ) : (
                      <h2 className="text-xl font-semibold text-stone-900">{tarefa?.titulo}</h2>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</Label>
                      {isEditing ? (
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value as StatusTarefa }))}
                          className="w-full h-10 px-3 rounded-md border border-stone-300 bg-white text-sm"
                        >
                          {COLUNAS_KANBAN.map((c) => (
                            <option key={c.id} value={c.id}>{c.titulo}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium"
                          style={{
                            backgroundColor: `${getStatusColor(tarefa?.status || 'pendente')}15`,
                            color: getStatusColor(tarefa?.status || 'pendente'),
                          }}
                        >
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(tarefa?.status || 'pendente') }} />
                          {COLUNAS_KANBAN.find((c) => c.id === tarefa?.status)?.titulo}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Prioridade</Label>
                      {isEditing ? (
                        <select
                          value={formData.prioridade}
                          onChange={(e) => setFormData((prev) => ({ ...prev, prioridade: e.target.value as PrioridadeTarefa }))}
                          className="w-full h-10 px-3 rounded-md border border-stone-300 bg-white text-sm"
                        >
                          {PRIORIDADES.map((p) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Icon
                            icon="solar:flag-bold"
                            className="w-4 h-4"
                            style={{ color: PRIORIDADES.find((p) => p.id === tarefa?.prioridade)?.cor }}
                          />
                          <span className="text-sm text-stone-700">
                            {PRIORIDADES.find((p) => p.id === tarefa?.prioridade)?.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Data Limite</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.data_limite ? formData.data_limite.split('T')[0] : formData.deadline ? formData.deadline.split('T')[0] : ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, data_limite: e.target.value || undefined }))}
                        className="bg-white border-stone-300"
                      />
                    ) : (
                      <div className="text-sm text-stone-700">
                        {(tarefa?.data_limite || tarefa?.deadline)
                          ? format(new Date(tarefa.data_limite || tarefa.deadline!), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : 'Sem data limite'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Descrição</Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.descricao || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descreva os detalhes da tarefa..."
                        rows={4}
                        className="bg-white border-stone-300 resize-none"
                      />
                    ) : (
                      <div className="text-sm text-stone-700 whitespace-pre-wrap">{tarefa?.descricao || 'Sem descrição'}</div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tags</Label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {(formData.tags || []).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer hover:bg-red-100"
                              onClick={() => removeTag(tag)}
                            >
                              {tag} <span className="ml-1 text-red-500">×</span>
                            </Badge>
                          ))}
                        </div>
                        <select
                          value={tagInput}
                          onChange={(e) => addTag(e.target.value)}
                          className="w-full h-9 px-3 rounded-md border border-stone-300 bg-white text-sm"
                        >
                          <option value="">Adicionar tag...</option>
                          {TAG_OPTIONS.filter((t) => !(formData.tags || []).includes(t)).map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(tarefa?.tags || []).length ? (
                          (tarefa?.tags || []).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                          ))
                        ) : (
                          <span className="text-sm text-stone-400">Sem tags</span>
                        )}
                      </div>
                    )}
                  </div>

                  {mode === 'view' && tarefa && (
                    <div className="pt-4 border-t border-stone-300 space-y-1">
                      {tarefa.created_at && (
                        <div className="text-xs text-stone-400">
                          Criado em: {format(new Date(tarefa.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                      {tarefa.updated_at && (
                        <div className="text-xs text-stone-400">
                          Atualizado em: {format(new Date(tarefa.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Save / Cancel */}
                  {isEditing && !isUploadingOrDone && (
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSave}
                        disabled={saving || !formData.titulo?.trim()}
                        className="flex-1 bg-stone-900 hover:bg-stone-800"
                      >
                        {saving ? (
                          <>
                            <Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : mode === 'create' ? (
                          pendingFiles.length > 0
                            ? `Criar e enviar ${pendingFiles.length} anexo${pendingFiles.length > 1 ? 's' : ''}`
                            : 'Criar Tarefa'
                        ) : (
                          'Salvar Alterações'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (mode === 'create') onClose();
                          else { setMode('view'); setFormData({ ...tarefa! }); }
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Anexos tab */}
              {activeTab === 'anexos' && (
                <div className="p-6">
                  {isEditing ? (
                    <PendingAttachmentsPicker
                      files={pendingFiles}
                      uploadStates={isUploadingOrDone ? uploadStates : undefined}
                      onFilesChange={setPendingFiles}
                      onRetry={handleRetry}
                      isUploading={uploadPhase === 'uploading'}
                      isDone={uploadPhase === 'done'}
                    />
                  ) : tarefa ? (
                    <TaskAnexos tarefaId={tarefa.id} />
                  ) : null}

                  {/* Footer for editing mode with pending files */}
                  {isEditing && !isUploadingOrDone && (
                    <div className="flex gap-3 pt-6 mt-4 border-t border-stone-200">
                      <Button
                        onClick={handleSave}
                        disabled={saving || !formData.titulo?.trim()}
                        className="flex-1 bg-stone-900 hover:bg-stone-800"
                      >
                        {saving ? (
                          <>
                            <Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : mode === 'create' ? (
                          pendingFiles.length > 0
                            ? `Criar e enviar ${pendingFiles.length} anexo${pendingFiles.length > 1 ? 's' : ''}`
                            : 'Criar Tarefa'
                        ) : (
                          'Salvar Alterações'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (mode === 'create') onClose();
                          else { setMode('view'); setFormData({ ...tarefa! }); }
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Subtarefas / Comentários — view only */}
              {activeTab === 'subtarefas' && tarefa && !isEditing && (
                <TaskSubtarefas
                  tarefa={tarefa}
                  onToggle={onToggleSubtarefa}
                  onAdd={onAddSubtarefa}
                  onRemove={onRemoveSubtarefa}
                />
              )}
              {activeTab === 'comentarios' && tarefa && !isEditing && (
                <TaskComentarios
                  tarefa={tarefa}
                  onAddComentario={onAddComentario}
                  currentUser={currentUser}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
