## Objetivo
Permitir soltar imagens em **qualquer ponto** do painel de Anexos do modal da tarefa (grid, busca, histórico, lista de upload), não apenas na dropzone superior, com feedback visual claro e suporte a múltiplos arquivos.

## Mudanças em `src/components/tasks/TaskAnexos.tsx`

1. **Container raiz com drag-and-drop global**
   - Adicionar `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop` no `<div className="p-6 space-y-5">` (wrapper de toda a aba).
   - Usar um contador de drag (`dragDepthRef`) para evitar flicker quando o ponteiro passa por elementos filhos (problema clássico de `dragenter`/`dragleave` aninhados).
   - Filtrar para ativar apenas quando `e.dataTransfer.types` inclui `"Files"` (ignora seleção de texto/elementos arrastados internamente).
   - `position: relative` no container para o overlay.

2. **Overlay de feedback visual fullscreen (dentro do painel)**
   - Quando `dragOver === true`, renderizar um overlay absoluto cobrindo o painel: borda tracejada vermelha (accent `#ff3b3b`), fundo translúcido escuro com blur, ícone grande `solar:cloud-upload-bold` e texto "Solte para anexar (até X arquivos, X MB no total)".
   - `pointer-events-none` no conteúdo interno do overlay para que `drop` chegue ao container.
   - Z-index alto, mas abaixo do lightbox.

3. **Dropzone interna mantida**
   - Mantém clique para abrir o seletor e seu próprio destaque visual leve quando `dragOver` global está ativo (ex.: borda mais forte).
   - Remover handlers duplicados ou deixá-los no-op (delegando ao container global) para evitar dois `drop` disparando.

4. **Reuso da lógica de `handleFiles`**
   - Sem alterações na validação/upload — apenas chamada a partir do `onDrop` global.

## Detalhes técnicos

```text
<div ref={rootRef}
     onDragEnter, onDragOver, onDragLeave, onDrop  ← global
     className="relative p-6 space-y-5">

  [dropzone clicável]
  [upload queue]
  [busca]
  [grid de imagens]
  [histórico]

  {dragOver && (
    <div className="absolute inset-0 z-40 rounded-xl
                    border-2 border-dashed border-[#ff3b3b]
                    bg-stone-900/40 backdrop-blur-sm
                    flex flex-col items-center justify-center
                    pointer-events-none">
      <Icon ... />
      <p>Solte para anexar imagens</p>
    </div>
  )}
</div>
```

Contador de profundidade:
```ts
const depth = useRef(0);
onDragEnter: depth.current++; if (hasFiles) setDragOver(true);
onDragLeave: depth.current--; if (depth.current <= 0) setDragOver(false);
onDrop: depth.current = 0; setDragOver(false); handleFiles(...);
```

## Fora de escopo
- Sem mudanças no hook `useTaskAttachments`.
- Sem mudanças nos limites (2MB/arquivo, 20MB/lote, MAX_BATCH).
- Sem alteração no `TaskModal` (drop ativo só dentro da aba Anexos, evitando captura indevida em outras abas).