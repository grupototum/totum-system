

## Plano: Corrigir Sistema de Templates

### Problemas identificados

1. **Criação de template falha silenciosamente** — Os componentes `TaskTemplateManager` e `ProjectTemplateManager` não verificam se há sessão autenticada antes de fazer queries. Se a sessão expirou ou ainda não carregou, as operações falham sem feedback claro ao usuário.

2. **Template de tarefa cria apenas checklist, não subtarefas reais** — O `TaskFormDialog.applyTemplate()` pega os items do template e coloca como `checklistItems` (tabela `task_checklist_items`), mas nunca cria registros na tabela `subtasks`. Isso contradiz o objetivo do sistema.

3. **Template de projeto não gera subtarefas reais** — O `useProjects.addProject()` cria tarefas a partir do template, mas ao inserir subtasks usa `taskDef.subtasks` que vem do JSON. O fluxo parece correto, mas precisa ser verificado.

---

### Correções

#### 1. Adicionar verificação de sessão nos managers

- `TaskTemplateManager.tsx` — Verificar sessão antes de fetch/save/delete. Mostrar toast de erro se não autenticado.
- `ProjectTemplateManager.tsx` — Mesmo tratamento.

#### 2. TaskFormDialog: criar subtarefas reais ao aplicar template

Atualmente a função `applyTemplate` faz:
```
setChecklistItems(items) // só checklist
```

Mudança: ao salvar a tarefa, se o template foi aplicado, criar registros na tabela `subtasks` além do checklist.

- Adicionar estado `subtaskItems` ao formulário
- `applyTemplate` preenche `subtaskItems` com os itens do template
- `handleSave` insere na tabela `subtasks` após criar a tarefa

#### 3. Melhorar feedback de erro

- Envolver todas as operações de save/delete em try/catch com toast de erro
- Logar erros no console para debug

---

### Arquivos a modificar

| Arquivo | Mudança |
|---|---|
| `src/components/templates/TaskTemplateManager.tsx` | Auth guard + error handling |
| `src/components/templates/ProjectTemplateManager.tsx` | Auth guard + error handling |
| `src/components/tasks/TaskFormDialog.tsx` | Criar subtarefas reais ao aplicar template |

