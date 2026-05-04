## Limite de tamanho total do lote no upload múltiplo

### Constante
Em `src/hooks/useTaskAttachments.ts`:
- Adicionar `MAX_BATCH_TOTAL_BYTES = 20 * 1024 * 1024` (20MB por lote, ~10 imagens cheias).

### Validação no hook
Em `uploadMany` (após filtrar arquivos válidos por formato/2MB):
- Calcular `totalSize = soma(size_bytes)` dos válidos.
- Se `totalSize > MAX_BATCH_TOTAL_BYTES`: ordenar por tamanho crescente e ir incluindo até atingir o limite; o restante vira erro "Lote excede 20MB — arquivo ignorado".
- Retornar contadores `{ accepted, skippedTooLarge }` para feedback.

### UI em `TaskAnexos.tsx`
- Drop zone: incluir no helper text "lote total até 20MB".
- Antes do upload, exibir toast quando algum arquivo for ignorado pelo limite agregado, com a soma resultante.
- Painel de fila: mostrar barra de "tamanho usado" (X / 20MB) acima do progresso.

### Arquivos
- Editar: `src/hooks/useTaskAttachments.ts`, `src/components/tasks/TaskAnexos.tsx`.

Posso prosseguir?
