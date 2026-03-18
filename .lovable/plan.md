

## Plano: Restaurar Produtos + Sistema de Gestão de Tarefas com Templates

### Problema atual

1. **Produtos** — A página existe e a rota `/produtos` está registrada no App.tsx, mas o link "Produtos" foi removido da sidebar (`AppSidebar.tsx`). O hook `useProducts` não tem `try/catch`, o que pode causar loading infinito fora do modo demo.

2. **Templates de Projeto** — As tabelas `project_templates` e `project_template_tasks` existem no DB, mas nenhum componente de UI as utiliza. O formulário de projeto (`ProjectFormDialog`) não oferece seleção de template.

3. **Templates de Tarefa** — As tabelas `task_templates` e `task_template_items` existem e o `TaskFormDialog` já carrega templates para preencher checklist. Porém, templates de tarefa não incluem subtarefas reais — apenas itens de checklist.

4. **Linkagem Projeto ↔ Tarefas** — Tarefas têm `project_id` no DB, mas a UI de projetos não exibe tarefas vinculadas nem permite criar tarefas a partir do projeto.

5. **Hooks sem try/catch** — `useProducts`, `useProjects`, `useContracts`, `useFinancial` não têm tratamento de erro adequado.

---

### O que será feito

#### Fase 1 — Correções de estabilidade

**1.1 Restaurar "Produtos" na sidebar**
- Adicionar link "Produtos e Serviços" no array `mainNav` ou criar seção própria em `AppSidebar.tsx`

**1.2 Adicionar try/catch/finally nos hooks**
- `useProducts.ts` — envolver `fetch` em try/catch/finally
- `useProjects.ts` — idem
- `useContracts.ts` — idem
- `useFinancial.ts` — idem

---

#### Fase 2 — Templates de Tarefa (melhorar o existente)

**2.1 Tela de gestão de templates de tarefa**
- Criar página ou seção dentro de Cadastros para CRUD de `task_templates`
- Cada template terá nome, descrição e lista de subtarefas (usando `task_template_items`)
- Permitir duplicar template

**2.2 Ao criar tarefa avulsa**
- Manter o fluxo atual do `TaskFormDialog` que já carrega templates
- Ao aplicar template: além de checklist, criar subtarefas reais na tabela `subtasks`

---

#### Fase 3 — Templates de Projeto

**3.1 Tela de gestão de templates de projeto**
- Criar página ou seção dentro de Cadastros para CRUD de `project_templates`
- Cada template terá: nome, descrição, lista de tarefas (`project_template_tasks`)
- Cada tarefa do template poderá ter subtarefas (adicionar coluna `subtasks` jsonb em `project_template_tasks`, ou criar tabela filha)
- Permitir duplicar template

**3.2 Seleção de template ao criar projeto**
- No `ProjectFormDialog`, adicionar campo "Template" que carrega `project_templates`
- Ao selecionar template, pré-popular a lista de tarefas (visível no form)
- Ao salvar o projeto: criar o projeto + inserir todas as tarefas na tabela `tasks` com `project_id` + inserir subtarefas na tabela `subtasks`

**3.3 Validação: projeto precisa de tarefas**
- No submit do `ProjectFormDialog`, exigir pelo menos 1 tarefa na lista
- Mostrar lista editável de tarefas no form (adicionar/remover antes de salvar)

---

#### Fase 4 — Visualização de tarefas no projeto

**4.1 Página de detalhe do projeto**
- Ao clicar em um card de projeto, abrir uma sheet/dialog mostrando:
  - Dados do projeto
  - Lista de tarefas vinculadas (`tasks` where `project_id = id`)
  - Progresso (% de tarefas concluídas)
  - Botão para adicionar nova tarefa ao projeto

---

### Migração de banco necessária

```sql
-- Adicionar subtasks jsonb em project_template_tasks para armazenar subtarefas do template
ALTER TABLE public.project_template_tasks
ADD COLUMN subtasks jsonb DEFAULT '[]'::jsonb;
```

### Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/components/layout/AppSidebar.tsx` | Restaurar link Produtos |
| `src/hooks/useProducts.ts` | try/catch/finally |
| `src/hooks/useProjects.ts` | try/catch/finally |
| `src/hooks/useContracts.ts` | try/catch/finally |
| `src/hooks/useFinancial.ts` | try/catch/finally |
| `src/components/registries/registryData.tsx` | Adicionar seções "Templates de Tarefa" e "Templates de Projeto" |
| `src/components/templates/TaskTemplateManager.tsx` | **Criar** — CRUD de templates de tarefa |
| `src/components/templates/ProjectTemplateManager.tsx` | **Criar** — CRUD de templates de projeto |
| `src/components/projects/ProjectFormDialog.tsx` | Adicionar seletor de template + lista de tarefas obrigatória |
| `src/components/projects/ProjectDetailSheet.tsx` | **Criar** — Sheet com tarefas do projeto |
| `src/pages/Projects.tsx` | Integrar ProjectDetailSheet ao clicar no card |
| `src/hooks/useProjects.ts` | Lógica para criar projeto + tarefas + subtarefas em batch |
| `src/components/tasks/TaskFormDialog.tsx` | Ao aplicar template, criar subtarefas reais (não só checklist) |

