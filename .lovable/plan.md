

## Plano: ERP Completo com Central do Cliente como HUB

### Diagnóstico do Estado Atual

O sistema já possui a maioria dos módulos base: Clientes, Tarefas, Projetos, Financeiro, Entregas, Contratos, Equipe, Dashboard Executivo, Configurações, Permissões. O que falta é a **Central do Cliente** como HUB unificado e várias melhorias pontuais listadas.

### O que já existe e será ajustado:
- Clientes (tabela simples) → transformar em HUB com abas
- Tarefas (Kanban/List/Calendar) → adicionar checklist na criação e templates
- Projetos (cards simples) → adicionar templates e dependências
- Financeiro (lista simples) → adicionar parcelamento automático
- Entregas Contratuais → integrar dentro da Central do Cliente
- Notificações (tabela existe) → criar Central de Notificações no header
- Cadastro com aprovação → já existe (status "pendente"), ajustar tela
- Permissões → já existe, integrar controle granular (view/edit/approve)

### O que será criado do zero:
- Página **Central do Cliente** com abas (Entregas, Contratos, Timeline, Análise, Pendências)
- **Timeline + Observações** (nova tabela `client_observations`)
- **Análise de Marketing** (novo campo `marketing_analysis` na tabela `clients`)
- **Templates de tarefas** (nova tabela `task_templates` + `task_template_items`)
- **Templates de projetos** (nova tabela `project_templates` + `project_template_tasks`)
- **Dependências entre tarefas** em projetos (nova tabela `task_dependencies`)
- **Central de Notificações** (componente global no header)
- **Busca global de tarefas** (componente no header)
- **Parcelamento automático** no financeiro

---

### Implementação em Fases

#### FASE 1: Banco de Dados (Migrações)

1. **Tabela `client_observations`**: id, client_id, user_id, content, created_at
2. **Campo `marketing_analysis`** (TEXT) na tabela `clients`
3. **Tabela `task_templates`**: id, name, description, created_at + **`task_template_items`**: id, template_id, title, description, sort_order
4. **Tabela `project_templates`**: id, name, description + **`project_template_tasks`**: id, template_id, title, description, sort_order
5. **Tabela `task_dependencies`**: id, task_id, depends_on_task_id, project_id
6. RLS em todas as novas tabelas (authenticated read/write, admin delete)

#### FASE 2: Central do Cliente (HUB)

- **Nova página `src/pages/ClientHub.tsx`** acessada ao clicar em um cliente (rota `/clientes/:id`)
- Interface com abas usando `Tabs`:
  - **Entregas Contratuais**: reutilizar lógica de `Fulfillment.tsx` filtrada por client_id, com toggle cards/lista e barra de pesquisa
  - **Contratos**: listar contratos do cliente com planos vinculados, permitir criar/editar inline
  - **Timeline + Observações**: feed cronológico com audit_logs + client_observations, formulário para adicionar observações
  - **Análise de Marketing**: textarea com autosave (debounce 2s) salvando em `clients.marketing_analysis`
  - **Pendências**: tarefas atrasadas, entregas incompletas, filtradas por client_id

- Atualizar `src/pages/Clients.tsx`: ao clicar no nome, navegar para `/clientes/:id`
- Atualizar `src/App.tsx`: adicionar rota `/clientes/:id`

#### FASE 3: Menu Simplificado

- Atualizar `AppSidebar.tsx` para o novo menu:
  - Central do Cliente (`/clientes`)
  - Tarefas (`/tarefas`)
  - Projetos (`/projetos`)
  - Financeiro (`/financeiro`)
  - Dashboard Executivo (`/dashboard-executivo`)
  - Equipe (`/equipe`)
  - Configurações (`/configuracoes`)
- Mover itens secundários (Cadastros, Permissões, Admin) para sub-menu em Configurações ou manter como itens menores

#### FASE 4: Tarefas - Melhorias

- **Checklist na criação**: atualizar `TaskFormDialog.tsx` para incluir campo dinâmico de checklist items
- **Templates de tarefas**: botão "Usar Template" no dialog, que carrega items do template
- **Campo responsável**: já filtra profiles ativos (verificar e garantir)

#### FASE 5: Projetos - Melhorias

- **Templates de projetos**: ao criar projeto, opção de usar template que pré-popula tarefas
- **Regra**: projetos não podem existir sem tarefas → validar no form
- **Dependências**: dentro de um projeto, permitir definir que tarefa A depende de tarefa B (UI simples com select)

#### FASE 6: Busca Global de Tarefas

- Componente `TaskSearch` no header (`AppLayout.tsx`)
- Busca em `tasks.title` com ILIKE, mostra resultado com vínculo ao projeto/cliente
- Usar `Command` (cmdk) para UX moderna com atalho Ctrl+K

#### FASE 7: Financeiro - Parcelamento

- No form de criação de lançamento financeiro, campo "parcelas"
- Ao salvar com N parcelas, inserir N registros em `financial_entries` com `installment_number`, `total_installments`, datas incrementais mensais

#### FASE 8: Central de Notificações

- Componente `NotificationCenter` no header com ícone de sino + badge de contagem
- Dropdown/popover listando notificações não lidas do usuário
- Marcar como lida ao clicar
- Eventos já registrados via triggers existentes

#### FASE 9: Validação de Integridade

- Antes de deletar categorias/tipos, verificar uso em tabelas relacionadas
- Exibir mensagem "Este item está em uso e não pode ser excluído"

#### FASE 10: Cadastro Dinâmico (botão "+")

- Nos selects de tipo/categoria em formulários, adicionar botão "+" que abre mini-dialog para criar o item inline
- Aplicar em: ClientFormDialog, ContractFormDialog, TaskFormDialog, ProjectFormDialog

### Detalhes Técnicos

- Todas as novas tabelas terão RLS com `is_admin()` para delete e `true` para authenticated read/insert/update
- Autosave da análise de marketing: `useEffect` com debounce de 2000ms chamando `supabase.update`
- Busca global: query com `.ilike('title', '%term%')` limitada a 20 resultados
- Parcelamento: loop no frontend gerando array de inserts com `due_date` incrementado por mês
- Manter padrão visual: dark theme, glass-card, gradient-primary, Sora/Inter fonts

