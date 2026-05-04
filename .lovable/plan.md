## Plano consolidado: Anexos de imagem em tarefas

Implementação completa em uma única leva, cobrindo upload, preview, busca/filtro, validação, histórico e múltiplos arquivos.

### 1. Backend (migration)

**Bucket de Storage**
- `task-attachments` (privado), limite 2MB, MIMEs: jpeg/png/webp/gif/svg+xml.
- Policies RLS em `storage.objects`: usuários autenticados leem/escrevem; delete restrito ao uploader ou admin.

**Tabela `tarefa_anexos`**
- `id` uuid PK, `tarefa_id` uuid (idx), `storage_path` text, `file_name` text, `mime_type` text, `size_bytes` int, `width` int, `height` int, `uploaded_by` uuid, `created_at` timestamptz.
- RLS: SELECT/INSERT autenticados; DELETE uploader ou admin.

**Tabela `tarefa_anexos_historico`**
- `id`, `tarefa_id`, `anexo_id` (nullable), `acao` ('upload'|'remocao'), `file_name`, `user_id`, `created_at`.
- Trigger AFTER INSERT/DELETE em `tarefa_anexos` registra automaticamente.
- RLS SELECT autenticados; INSERT só via trigger.

**Trigger de validação** em `tarefa_anexos`:
- Bloqueia `mime_type` fora da lista permitida e `size_bytes > 2097152` com mensagens específicas.

### 2. Hook `useTaskAttachments.ts`

Exporta:
- `ACCEPTED_IMAGE_TYPES`, `ACCEPTED_EXTENSIONS`, `MAX_SIZE_BYTES = 2*1024*1024`, `MAX_BATCH = 20`.
- `validateImageFile(file)` → checa MIME + extensão + magic bytes; retorna `{ ok, error }` com mensagem específica ("Formato não suportado: .bmp", "Arquivo excede 2MB (3.4MB)", etc.).
- `useTaskAttachments(tarefaId)`: lista anexos, histórico, `uploadMany(files, onProgress)` com progresso individual + agregado, `remove(anexo)`, `getSignedUrl(path)`.
- `useTaskAttachmentsSummary(tarefaIds[])`: retorna `{ count, lastUpdatedAt, lastAuthor }` por tarefa para badges/filtros.

### 3. UI

**`TaskAnexos.tsx`** (nova aba "Anexos" no `TaskModal`):
- Drop zone + input `multiple accept="image/..."`.
- Fila de upload com barra individual por arquivo + barra agregada + contador "X/Y concluídos".
- Erros por arquivo exibidos inline; toasts de resumo.
- Grid responsivo de thumbnails com nome, tamanho, autor, data.
- Busca local por nome de arquivo dentro da tarefa.
- Botão remover (com confirmação).
- Seção "Histórico" colapsável: timeline com ícone, ação, nome do arquivo, autor, data relativa.

**Lightbox** (componente `AttachmentLightbox`):
- Dialog fullscreen, zoom (scroll/botões), pan (drag), navegação ← →, fechar (Esc/X), download.

**Indicadores em cards/listas**:
- `KanbanCard.tsx` e `TaskListView.tsx`: badge com ícone clipe + contagem quando `count > 0`; tooltip mostra última atualização e autor.

**Filtros em `TaskFilters.tsx`**:
- Toggle "Apenas com anexos".
- Input "Buscar por nome de arquivo" (busca cruzada nas tarefas).
- Ordenação adicional: "Anexo mais recente".

### 4. Integração

- `TaskModal.tsx`: nova aba "Anexos" com contador.
- `QuadroTarefas.tsx`/`TasksBoard.tsx`: carrega `useTaskAttachmentsSummary` para tarefas visíveis e passa para cards/filtros.

### Arquivos

**Novos**: `src/hooks/useTaskAttachments.ts`, `src/components/tasks/TaskAnexos.tsx`, `src/components/tasks/AttachmentLightbox.tsx`, migration SQL.

**Editados**: `TaskModal.tsx`, `KanbanCard.tsx`, `TaskListView.tsx`, `TaskFilters.tsx`, `QuadroTarefas.tsx`/`TasksBoard.tsx`.

Posso prosseguir com a implementação?
