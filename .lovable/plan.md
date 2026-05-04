## Objetivo
Mostrar mensagens de erro detalhadas e amigáveis por arquivo na fila de upload e permitir reenvio individual via botão "Repetir".

## Mudanças

### `src/hooks/useTaskAttachments.ts`
- Estender o tipo do item da `uploadQueue` para incluir:
  - `file?: File` — referência original (necessária para retry).
  - `errorCode?: 'size' | 'type' | 'empty' | 'batch_limit' | 'storage' | 'db' | 'network' | 'unknown'`.
  - `error?: string` — mensagem amigável já formatada para exibição.
- Criar helper `friendlyError(code, ctx)` que devolve frases claras em PT-BR (ex.: "Falha ao enviar para o servidor (rede). Verifique sua conexão.", "Arquivo já existe no destino", "Tipo não suportado: …").
- Centralizar a lógica de upload de **um** arquivo em `uploadOne(qid, file)` (interno) chamado por `uploadMany` e por `retryOne`. Ele atualiza a fila para `uploading`, faz storage upload (sem `upsert`), insere em `tarefa_anexos`, faz rollback do storage em caso de erro de DB e classifica o erro.
- Itens "skipped" pelo limite do lote agora também recebem `file` e `errorCode: 'batch_limit'`, permitindo retry isolado (já que sozinhos cabem em 20MB).
- Expor `retryOne(qid: string)`:
  - Resgata o item da fila pelo id, valida novamente (caso seja erro de validação), recoloca status `pending`/`uploading`, executa `uploadOne`, e ao final chama `load()` se sucesso.
  - Se o `file` foi perdido (não retryable), retorna sem ação.

### `src/components/tasks/TaskAnexos.tsx`
- Para cada item da fila com `status === 'error'`:
  - Substituir o trecho de erro por um bloco em duas linhas: nome + mensagem detalhada (`text-red-500`, `text-[11px]`, com `title` para tooltip completa).
  - Adicionar botão `Repetir` (variant ghost, ícone `solar:refresh-linear`) à direita, visível apenas quando `q.file` existe. Ao clicar chama `retryOne(q.id)`.
- Adicionar contador "X falha(s)" no cabeçalho da fila quando houver erros, com botão "Repetir todos" que itera sobre os ids com falha e chama `retryOne` em sequência.

## Detalhes técnicos
- Mapeamento de erros do Supabase Storage: códigos comuns como `Duplicate`, `Payload too large`, `mime type not allowed` → mensagens amigáveis. Fallback: usar `error.message` original prefixado por "Falha no envio: ".
- Não mexer no banco (não há mudanças de schema). O histórico continua sendo gravado pelo trigger só em uploads bem-sucedidos.
- Manter compatibilidade: `clearQueue` segue limpando tudo; o auto-clear de 1500ms só dispara quando todos os itens estão `done`.

## Fora de escopo
- Sem alterações nos limites (2MB/arquivo, 20 arquivos, 20MB/lote).
- Sem mudanças no AlertDialog de exclusão em lote.