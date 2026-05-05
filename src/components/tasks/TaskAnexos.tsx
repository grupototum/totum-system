import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import { listTaskAttachments, deleteTaskAttachment, StoredAttachment } from '@/hooks/useTaskAttachments';

interface TaskAnexosProps {
  tarefaId: string;
}

export function TaskAnexos({ tarefaId }: TaskAnexosProps) {
  const [attachments, setAttachments] = useState<StoredAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await listTaskAttachments(tarefaId);
    setAttachments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tarefaId]);

  const handleDelete = async (fileName: string) => {
    if (!confirm('Remover este anexo?')) return;
    setDeleting(fileName);
    const ok = await deleteTaskAttachment(tarefaId, fileName);
    setDeleting(null);
    if (ok) {
      toast.success('Anexo removido');
      setAttachments((prev) => prev.filter((a) => a.name !== fileName));
    } else {
      toast.error('Erro ao remover anexo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Icon icon="solar:refresh-bold" className="w-5 h-5 text-stone-400 animate-spin" />
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-stone-400">
        <Icon icon="solar:gallery-linear" className="w-10 h-10 mb-2 opacity-40" />
        <p className="text-sm">Nenhum anexo nesta tarefa</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((att) => (
        <div
          key={att.name}
          className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 bg-white"
        >
          <div className="w-10 h-10 rounded-md overflow-hidden bg-stone-100 flex-shrink-0">
            <img
              src={att.url}
              alt={att.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-stone-800 truncate">{att.name}</p>
          </div>
          <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-stone-100 transition-colors"
            title="Abrir"
          >
            <Icon icon="solar:eye-linear" className="w-4 h-4 text-stone-500" />
          </a>
          <button
            onClick={() => handleDelete(att.name)}
            disabled={deleting === att.name}
            className="p-1.5 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Remover"
          >
            {deleting === att.name ? (
              <Icon icon="solar:refresh-bold" className="w-4 h-4 text-red-400 animate-spin" />
            ) : (
              <Icon icon="solar:trash-bin-trash-linear" className="w-4 h-4 text-red-400" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
