## Revisão de UX/UI — plano em fases

O projeto tem 60+ páginas. Uma revisão "tudo de uma vez" geraria uma mudança massiva, difícil de validar e arriscada. Proponho dividir em fases incrementais, começando pela base global (que afeta todas as telas) e depois agrupando páginas por domínio.

### Fase 0 — Auditoria base (sem mudanças de código)
- Listar problemas recorrentes: tipografia, espaçamentos, contraste, headers inconsistentes, botões sem hierarquia, loaders/empty states ausentes, formulários longos, responsividade mobile.
- Verificar uso de tokens HSL (`bg-background`, `text-foreground`, `border-border`) vs cores hardcoded.
- Conferir Sora (headings) + Inter (body) e acentos `#ff3b3b` em todo lugar.

### Fase 1 — Sistema de design (impacto global)
1. Padronizar `PageHeader` (título, subtítulo, ações) e aplicar nas páginas que ainda usam header solto.
2. Padronizar `EmptyState`, `LoadingState`, `ErrorState` reutilizáveis.
3. Revisar variantes de `Button`, `Card`, `Badge` e densidade (alturas, paddings).
4. Garantir foco visível, área de toque ≥40px em mobile, scrollbars finas consistentes.

### Fase 2 — Navegação e layout
- Sidebar (`AppSidebar`) e Mobile Sidebar: agrupamento, ícones, estado ativo, badges de notificação.
- Breadcrumbs nas páginas internas (Cliente → Editar, Projeto → Tarefa, etc).
- Topbar: busca global, notificações, avatar/menu.

### Fase 3 — Páginas por domínio (uma fase por grupo)
A. **Auth**: Login, SignUp, ForgotPassword, ResetPassword, SetupPage.
B. **Dashboard/Visão**: Dashboard, ExecutiveDashboard, Index, Hub.
C. **Clientes**: Clients, ClientsCenter, ClientHub, NewClient, EditClient.
D. **Operação**: Tasks, TasksBoard, QuadroTarefas, Projects, Fulfillment, Templates.
E. **Comercial/Financeiro**: Contracts, Financial, Products, Packages, Reports.
F. **Equipe/Admin**: Team, TeamStructure, EstruturaTime, UsersPermissions, AdminSettings, Settings, Registries.
G. **Conhecimento/IA**: PopSla, PopLibrary, SlaRules, alexandria/*, agents/*, iatools/*, ada/*, workspace/*.

Em cada subfase: ajuste de hierarquia visual, espaçamentos, estados (loading/empty/erro), responsividade, microcopys e remoção de cores hardcoded.

### Fase 4 — Mobile / responsivo
Passada dedicada em ≤414px: tabelas viram cards, diálogos viram sheets, filtros colapsam, CTAs ancoram embaixo.

### Fase 5 — Acessibilidade e polimento
- Contrastes AA, labels em inputs, `aria-*` em ícones-botão, navegação por teclado, prefers-reduced-motion.
- Microanimações com framer-motion em transições de aba/rota.

### Como quero proceder
Pelo escopo, prefiro **começar pela Fase 1 (sistema de design)** porque corrige inconsistências em todas as páginas com pouco código. Depois seguimos por domínio na ordem que você priorizar.

### Decisões que preciso de você
1. Por onde começar? Fase 1 (design system global) ou pular direto para um domínio específico (ex.: Clientes, Tarefas, Financeiro)?
2. Há alguma página que dá mais dor hoje e deve ter prioridade?
3. Posso remover páginas duplicadas com sufixo " 2" (ex.: `AgentProfile 2.tsx`, `WikiAlexandria 2.tsx`) durante a revisão?
4. Manter visual atual (dark `#1e1516` + acento vermelho) ou abrir espaço para refinar paleta/tipografia?
