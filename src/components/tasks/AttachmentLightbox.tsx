import { useEffect, useState, useCallback } from 'react';
import { Icon } from '@/components/shared/Icon';
import type { TaskAttachment } from '@/hooks/useTaskAttachments';

interface Props {
  items: TaskAttachment[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function AttachmentLightbox({ items, index, onClose, onIndexChange }: Props) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  const item = items[index];

  const next = useCallback(() => {
    onIndexChange((index + 1) % items.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [index, items.length, onIndexChange]);

  const prev = useCallback(() => {
    onIndexChange((index - 1 + items.length) % items.length);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [index, items.length, onIndexChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === '+') setZoom((z) => Math.min(z + 0.25, 4));
      if (e.key === '-') setZoom((z) => Math.max(z - 0.25, 0.5));
      if (e.key === '0') {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center">
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between p-4 text-white/90 z-10">
        <div className="text-sm font-medium truncate max-w-[60%]">{item.file_name}</div>
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="p-2 hover:bg-white/10 rounded-lg" title="Diminuir">
            <Icon name="solar:minus-circle-linear" className="w-5 h-5" />
          </button>
          <span className="text-xs w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(z + 0.25, 4))} className="p-2 hover:bg-white/10 rounded-lg" title="Ampliar">
            <Icon name="solar:add-circle-linear" className="w-5 h-5" />
          </button>
          <button onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="p-2 hover:bg-white/10 rounded-lg" title="Resetar">
            <Icon name="solar:refresh-linear" className="w-5 h-5" />
          </button>
          {item.url && (
            <a href={item.url} download={item.file_name} className="p-2 hover:bg-white/10 rounded-lg" title="Baixar">
              <Icon name="solar:download-linear" className="w-5 h-5" />
            </a>
          )}
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg" title="Fechar (Esc)">
            <Icon name="solar:close-circle-linear" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      {items.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <Icon name="solar:arrow-left-linear" className="w-6 h-6" />
          </button>
          <button onClick={next} className="absolute right-4 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <Icon name="solar:arrow-right-linear" className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Image */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={(e) => setDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y })}
        onMouseMove={(e) => drag && setOffset({ x: e.clientX - drag.x, y: e.clientY - drag.y })}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)));
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {item.url && (
          <img
            src={item.url}
            alt={item.file_name}
            draggable={false}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transition: drag ? 'none' : 'transform 0.15s ease-out',
              maxHeight: '85vh',
              maxWidth: '90vw',
            }}
          />
        )}
      </div>

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-white/10 px-3 py-1 rounded-full">
          {index + 1} / {items.length}
        </div>
      )}
    </div>
  );
}
