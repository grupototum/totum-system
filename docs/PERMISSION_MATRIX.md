# Matriz de Permissões — Totum System
> Auditoria em 2026-08-10 · Rodada 1 (item 4) · Este documento só registra o estado atual — divergências viram bugs em `BUGS.md` (B-028 a B-034), não são corrigidas aqui.

## Resumo executivo

O sistema tem **dois mecanismos de role/permissão paralelos que não se cruzam**, e **nenhum guard de rota real** — a única proteção de rota é sessão (login). O filtro de itens no menu lateral é puramente cosmético/de descoberta: remover um item do menu não impede acesso à rota via URL direta.

| Mecanismo | Onde vive | Onde é checado |
|---|---|---|
| (a) enum `app_role` em `user_roles` (`admin`, `diretor`, `financeiro`, `gestor`, `social_media`, `designer`, `trafego`, `atendimento`, `assistente`, `parceiro`, `cliente_convidado`) | Tabela `user_roles` + função SQL `is_admin(uid)` / `has_role()` | Só em RLS de tabelas administrativas: `asaas_config`, `company_settings`, `organizations`, `asaas_webhook_logs`, `audit_logs`, `error_logs`, `api_keys`, `delivery_model_items` |
| (b) `roles.permissions` (jsonb, chaves tipo `fin_geral.visualizar`) | Tabela `roles`, referenciada por `profiles.role_id` | Só no client, em `src/hooks/usePermissions.ts` — **nunca em RLS** |

Achado mais grave: `isAdmin` no client (`usePermissions.ts:14-18`) é calculado por **substring no nome da role** (`roleName.includes("admin")`), não pelo enum/RPC oficial — ver B-030.

---

## 1. Rotas × proteção

Todas as rotas abaixo estão dentro de `ProtectedRoutes()` (`src/App.tsx`), cuja única guarda é `if (!session) return <Navigate to="/login" />`. Nenhuma usa permissão no roteamento.

| Rota | Página | Checagem de permissão *dentro* da página |
|---|---|---|
| `/` | `Index` | Nenhuma |
| `/clientes`, `/clients` | `Clients` | `maskDocument` só mascara CPF/CNPJ — não bloqueia |
| `/clientes/novo`, `/new-client` | `NewClient` | Nenhuma |
| `/clientes/:id`, `/clients/:id` | `ClientHub` | Nenhuma |
| `/clientes/:id/editar`, `/edit-client/:id` | `EditClient` | Nenhuma |
| `/tarefas` | `Tasks` | Nenhuma |
| `/entregas` | `Fulfillment` | Nenhuma |
| `/contratos` | `Contracts` | Nenhuma |
| `/projetos` | `Projects` | Nenhuma |
| `/financeiro` | `Financial` | ✅ `canViewFinancial` bloqueia render se falso |
| `/produtos` | `Products` | Nenhuma |
| `/pacotes` | `Packages` | Nenhuma |
| `/relatorios` | `Reports` | ✅ `canViewReports` bloqueia render se falso |
| `/equipe` | `Team` | `isAdmin` local só controla ações de UI, não acesso |
| `/cadastros` | `Registries` | Nenhuma |
| `/usuarios` | `UsersPermissions` | `adminUserIds` só controla ações de UI (promover/remover admin), não acesso à página |
| `/configuracoes` | `SettingsPage` | Parcial — `isAdmin` só restringe a sub-seção "Alterar role" |
| `/admin` | `AdminSettings` | ✅ bloqueia toda a página se `!isAdmin` (string match) e `!isDemoMode` |
| `/dashboard-executivo` | `ExecutiveDashboard` | Nenhuma na página — só o menu esconde o link (`permKey: acessar_dashboard_executivo`) |
| `/templates` | `Templates` | Nenhuma |
| `/pops` | `PopLibrary` | Nenhuma |
| `/sla` | `SlaRules` | Nenhuma |
| `/importar` | `DataImport` | Nenhuma |
| `/novidades` | `Novidades` | Nenhuma (correto — página informativa) |

**Conclusão:** de 24 rotas autenticadas, só 3 páginas (`Financial`, `Reports`, `AdminSettings`) bloqueiam conteúdo por permissão, e `SettingsPage` bloqueia parcialmente. As outras 20 — incluindo `/usuarios` (gestão de permissões!), `/dashboard-executivo`, `/equipe` — são acessíveis por URL direta a **qualquer usuário autenticado**, independente de role. Ver B-028.

---

## 2. `usePermissions.ts` — API exposta ao client

| Nome | Lógica |
|---|---|
| `isAdmin` | `roleName.includes("admin" \| "administrador" \| "master")` — string match, não enum. Ver B-030 |
| `hasPermission(key)` | `isDemoMode \|\| isAdmin` → `true`; senão `permissions[key] === true` |
| `hasAnyPermission(...keys)` | mesma lógica, para múltiplas chaves |
| `canAccessModule(moduleKey)` | `permissions[\`${moduleKey}_geral.visualizar\`] === true` |
| `canViewFinancial` | `hasAnyPermission("fin_geral.visualizar", "fin_pagar.visualizar", "fin_receber.visualizar")` |
| `canViewReports` | `hasAnyPermission("rel_financeiros.visualizar", "rel_operacionais.visualizar", "rel_tarefas.visualizar", "rel_clientes.visualizar", "rel_contratos.visualizar")` |
| `canViewDocuments` | `isAdmin \|\| hasPermission("cli_geral.editar")` |
| `maskDocument(doc)` | mascara CPF/CNPJ se `!canViewDocuments` |

Em modo demo, `isAdmin = true` sempre e `permissions = {}`.

---

## 3. Menu lateral (`AppSidebar.tsx` → `navGroups`)

| Grupo | Item | Rota | `permKey` | `adminOnly` |
|---|---|---|---|---|
| Dashboards | Visão Geral | `/` | — | não |
| Dashboards | Executivo | `/dashboard-executivo` | `acessar_dashboard_executivo` | não |
| Comercial | Clientes | `/clientes` | `cli_geral.visualizar` | não |
| Comercial | Pacotes | `/pacotes` | `prod_geral.visualizar` | não |
| Comercial | Contratos | `/contratos` | — | não |
| Operacional | Tarefas | `/tarefas` | `tar_geral.visualizar` | não |
| Operacional | Projetos | `/projetos` | `proj_geral.visualizar` | não |
| Operacional | Entregas | `/entregas` | — | não |
| Financeiro | Financeiro | `/financeiro` | `fin_geral.visualizar` | não |
| Cadastros Base | Produtos | `/produtos` | `prod_geral.visualizar` | não |
| Cadastros Base | Categorias | `/cadastros` | `cad_geral.visualizar` | não |
| Cadastros Base | Equipe | `/equipe` | `usr_usuarios.visualizar` | não |
| Administração | Permissões | `/usuarios` | `usr_permissoes.editar` | não |
| Administração | Configurações | `/configuracoes` | — | não |
| Administração | Importação | `/importar` | — | não |
| Administração | Novidades | `/novidades` | — | não |
| Administração | Admin | `/admin` | — | **sim** |

Lógica de filtro (resumo): item sem `permKey` aparece para qualquer autenticado; item com `permKey` aparece se `isAdmin || hasPermission(permKey)`; `adminOnly` some se `!isAdmin`. Como visto na seção 1, **isso não é controle de acesso** — é só o que aparece no menu. A rota por trás continua acessível via URL direta.

---

## 4. RLS — políticas das tabelas de negócio principais

Funções auxiliares usadas nas policies (todas `SECURITY DEFINER`): `is_master_user()`, `is_admin(uid)`, `get_user_organization_id()`, `can_access_org/client/task(...)`.

| Tabela | Policy | Comando | Condição resumida |
|---|---|---|---|
| `tasks` | `Authenticated insert tasks` | INSERT | `WITH CHECK (true)` — sem checar org (B-029) |
| `tasks` | `Tenant isolation on tasks` | ALL | `organization_id = org do usuário OR is_master_user()` |
| `task_checklist_items` | `Org members can manage...` | ALL | `can_access_task(task_id)` |
| `subtasks` | `Org members can manage...` | ALL | `can_access_task(task_id)` |
| `clients` | `Authenticated insert clients` | INSERT | `WITH CHECK (true)` (B-029) |
| `clients` | `Tenant isolation on clients` | ALL | mesma org OU master |
| `financial_entries` | `Authenticated insert...` | INSERT | `WITH CHECK (true)` (B-029) |
| `financial_entries` | `Tenant isolation...` | ALL | mesma org OU master |
| `projects` | `Authenticated insert projects` | INSERT | `WITH CHECK (true)` (B-029) |
| `projects` | `Tenant isolation on projects` | ALL | mesma org OU master |
| `contracts` | `Authenticated insert contracts` | INSERT | `WITH CHECK (true)` (B-029) |
| `contracts` | `Tenant isolation on contracts` | ALL | mesma org OU master |
| `products` | `Tenant isolation on products` | ALL | mesma org OU master (sem policy própria de INSERT) |
| `api_keys` | `Org admins manage api_keys` | ALL | `is_admin(uid) OR is_master` **E** mesma org OU master — único caso que combina role + org |
| `user_roles` | `Tenant isolation on user_roles` | ALL | mesma org OU master — **qualquer membro da org, não só admin** (B-031) |
| `roles` | `Authenticated read roles` | SELECT | `USING (true)` — todas as orgs compartilham leitura (B-033); sem policy de escrita (bloqueada por padrão) |
| `profiles` | `Master insert profiles` | INSERT | `is_master_user()` |
| `profiles` | `Org scoped profiles select` | SELECT | mesma org OU master |
| `profiles` | `Users update own profile` | UPDATE | `user_id = auth.uid() OR is_master_user()` — sem restrição de coluna (B-032) |

**Padrão dominante:** tabelas operacionais/comerciais/financeiras usam só **isolamento por organização** — qualquer usuário autenticado da mesma org (independente de role) tem SELECT/UPDATE/DELETE completo em `tasks`, `clients`, `financial_entries`, `projects`, `contracts`, `products`. `role='admin'` só é checado num conjunto pequeno de tabelas administrativas (`asaas_config`, `company_settings`, `organizations`, `asaas_webhook_logs`, `audit_logs`, `error_logs`, `api_keys`, `delivery_model_items`).

As funções `has_permission()`/`get_user_permissions()` (que leriam `roles.permissions`) **existem no schema SQL mas não são referenciadas por nenhuma `CREATE POLICY`** — o sistema de permissões granulares não é enforced no banco (B-034).

---

## 5. Bugs registrados a partir desta auditoria

Ver `BUGS.md`, seções "🔴 CRÍTICOS — achados da auditoria de permissões" e "🟡 ALTOS — achados da auditoria api-v1/agentes": B-028 a B-037.

Nada foi corrigido nesta rodada — conforme escopo, esta auditoria só documenta e prioriza.
