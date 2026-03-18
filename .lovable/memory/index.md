Design system: dark premium (#1e1516 base), red accent (#ff3b3b), Sora headings, Inter body
Colors defined in index.css as HSL tokens, glass-card utility class for glassmorphism
Logo files: src/assets/logo-red.png (vermelho), src/assets/logo-white.png (branco)
Sidebar navigation with collapsible icon mode
Font import via CSS @import in index.css

All modules connected to Supabase: Clients, Contracts, Projects, Financial, Products, Team, Fulfillment, Tasks, Dashboard
User approval flow: new signups get status 'pendente', master must approve via UsersPermissions page
Master admin: israelassislemos@gmail.com with user_roles 'admin'
Auto-confirm email enabled (approval flow replaces email verification)
Edge functions: generate-checklists, generate-tasks, bootstrap-admin

Architecture: Client-centric HUB model (/clientes/:id → ClientHub with tabs)
Tables added: client_observations, task_templates, task_template_items, project_templates, project_template_tasks, task_dependencies
Field added: clients.marketing_analysis (TEXT)
Menu: Central do Cliente, Tarefas, Projetos, Financeiro, Dashboard Executivo, Equipe, Configurações
Header includes: TaskSearch (Ctrl+K) and NotificationCenter (realtime bell icon)
Financial: supports installment (parcelamento) auto-generation
TaskFormDialog: supports checklist creation and task templates
