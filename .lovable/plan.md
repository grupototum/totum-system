## Objetivo
Adicionar seleção múltipla e exclusão em lote de anexos dentro da aba Anexos da tarefa, com confirmação e registro automático no histórico.

## Mudanças

### `src/hooks/useTaskAttachments.ts`
- Adicionar `removeMany(anexos: TaskAttachment[])`:
  - Remove arquivos do storage via `.remove(paths)` (1 chamada).
  - Deleta linhas via `.delete().in('id', ids)` (1 chamada — o trigger existente em `tarefa_anexos` já registra cada remoção em `tarefa_anexos_historico`, garantindo histórico por arquivo).
  - Recarrega lista/histórico e retorna `{ removed, failed }`.
- Exportar `removeMany` no retorno do hook.

### `src/components/tasks/TaskAnexos.tsx`
- Estado novo: `selected: Set<string>` (ids selecionados) e `confirmOpen: boolean`.
- Cada card do grid:
  - Checkbox no canto superior esquerdo (sempre visível quando há seleção, hover caso contrário).
  - Clicar no card com seleção ativa alterna seleção em vez de abrir lightbox.
  - Borda destacada (`ring-2 ring-[#ff3b3b]`) quando selecionado.
- Barra de ações fixa acima do grid quando `selected.size > 0`:
  - Texto "X selecionado(s)".
  - Botão "Selecionar todos" / "Limpar seleção".
  - Botão `destructive` "Excluir selecionados" (ícone lixeira).
- Diálogo de confirmação (`AlertDialog` do shadcn) ao clicar em excluir:
  - Mensagem: "Excluir N anexos? Esta ação não pode ser desfeita."
  - Confirmar chama `removeMany`, exibe `toast.success` com a contagem e limpa seleção. Erros via `toast.error`.
- Limpar seleção automaticamente após exclusão e ao recarregar a tarefa.

## Detalhes técnicos
- Usar `AlertDialog` (`@/components/ui/alert-dialog`) já presente no projeto.
- Usar `Checkbox` (`@/components/ui/checkbox`).
- Histórico: nada a fazer no front — o trigger `tarefa_anexos_historico` registra automaticamente cada `DELETE`. A seção Histórico já existente exibirá as entradas após o reload.

## Fora de escopo
- Sem mudanças na migration/banco (trigger de histórico já cobre exclusão em lote).
- Sem alteração no lightbox.