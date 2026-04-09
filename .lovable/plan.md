

## Correção de Bugs no Calendário de Tarefas + Deletar Tarefas

### Bug 1: Calendário abrindo em Março ao invés do mês atual

**Causa**: Linha 37 de `Tasks.tsx` tem o mês hardcoded:
```typescript
const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 2, 1)); // Março 2026
```

**Correção**: Trocar para `new Date()` (mês atual).

---

### Bug 2: Tarefas aparecendo no dia errado (domingo ao invés de segunda)

**Causa**: O campo `due_date` vem do banco como string `"2026-04-06"` (formato date ISO). Quando o JS faz `new Date("2026-04-06")`, interpreta como UTC meia-noite, que no fuso de Brasília (UTC-3) vira `2026-04-05 21:00` -- ou seja, domingo ao invés de segunda.

**Correção**: Ao parsear `dueDate` no calendário, usar `new Date(date + "T00:00:00")` para forçar interpretação no fuso local. Aplicar em `TaskCalendar.tsx` na linha 31.

---

### Bug 3: Adicionar opção de deletar tarefa

**Implementação**:
1. Adicionar função `deleteTask` no hook `useSupabaseTasks.ts` que faz `DELETE` na tabela `tasks`
2. Adicionar botão "Excluir" no `TaskDetailDialog.tsx` com confirmação
3. Passar callback `onDelete` do `Tasks.tsx` para o dialog
4. Arquivar != deletar: arquivar mantém o registro com status "arquivado", deletar remove permanentemente

### Arquivos modificados

1. `src/pages/Tasks.tsx` -- fix calendarMonth + wiring onDelete
2. `src/components/tasks/TaskCalendar.tsx` -- fix timezone parsing
3. `src/hooks/useSupabaseTasks.ts` -- add deleteTask function
4. `src/components/tasks/TaskDetailDialog.tsx` -- add delete button with confirmation

