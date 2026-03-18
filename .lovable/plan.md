

## Plano: Adicionar botão "Nova Tarefa" na página de Tarefas

### Situação Atual
A página de Tarefas (`src/pages/Tasks.tsx`) possui apenas o botão "Gerar do Plano" no header. Não existe um botão para criar tarefas manualmente, nem um componente `TaskFormDialog` no projeto.

### O que será feito

1. **Criar `src/components/tasks/TaskFormDialog.tsx`**
   - Dialog/modal para criação manual de tarefa
   - Campos: título (obrigatório), descrição, cliente (select dinâmico), responsável (select de profiles), prioridade, tipo, data início, data entrega
   - Ao salvar, inserir diretamente na tabela `tasks` via Supabase e chamar `refetch()`

2. **Atualizar `src/pages/Tasks.tsx`**
   - Adicionar botão "Nova Tarefa" com ícone `Plus` ao lado do botão "Gerar do Plano" no header
   - Usar estilo `gradient-primary` para destaque visual
   - Gerenciar estado `createOpen` para abrir/fechar o dialog
   - Conectar ao `refetch` do hook `useSupabaseTasks`

### Detalhes técnicos
- Dados de clientes e profiles já disponíveis via `useSupabaseTasks` (hook retorna `clients` e `profiles` -- verificar se `clients` é exportado, senão buscar inline)
- Insert direto na tabela `tasks` com campos mapeados para o schema existente
- Manter padrão visual dark/glass do projeto (bg `#1e1516`, borders `white/[0.1]`)

