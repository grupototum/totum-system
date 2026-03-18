// ── Action types ──
export type PermAction =
  | "visualizar" | "criar" | "editar" | "excluir" | "aprovar" | "exportar"
  | "comentar" | "atribuir" | "alterar_status"
  | "ver_proprios" | "ver_equipe" | "ver_todos";

export const actionLabels: Record<PermAction, string> = {
  visualizar: "Visualizar",
  criar: "Criar",
  editar: "Editar",
  excluir: "Excluir",
  aprovar: "Aprovar",
  exportar: "Exportar",
  comentar: "Comentar",
  atribuir: "Atribuir responsável",
  alterar_status: "Alterar status",
  ver_proprios: "Ver apenas próprios",
  ver_equipe: "Ver da equipe",
  ver_todos: "Ver todos",
};

// ── Subcategory ──
export interface PermSubcategory {
  key: string;
  label: string;
  actions: PermAction[];
}

// ── Category ──
export interface PermCategory {
  key: string;
  label: string;
  icon: string;
  subcategories: PermSubcategory[];
}

// ── Full permission tree ──
export const permissionTree: PermCategory[] = [
  {
    key: "dashboard", label: "Dashboard", icon: "LayoutDashboard",
    subcategories: [
      { key: "dash_geral", label: "Dashboard Geral", actions: ["visualizar"] },
      { key: "dash_financeiro", label: "Indicadores Financeiros", actions: ["visualizar"] },
      { key: "dash_operacional", label: "Indicadores Operacionais", actions: ["visualizar"] },
      { key: "dash_estrategico", label: "Indicadores Estratégicos", actions: ["visualizar"] },
      { key: "dash_pessoal", label: "Dashboard Pessoal", actions: ["visualizar"] },
    ],
  },
  {
    key: "clientes", label: "Clientes", icon: "Users",
    subcategories: [
      { key: "cli_geral", label: "Clientes", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "cli_historico", label: "Histórico do Cliente", actions: ["visualizar"] },
      { key: "cli_contratos", label: "Contratos do Cliente", actions: ["visualizar"] },
      { key: "cli_financeiro", label: "Financeiro do Cliente", actions: ["visualizar"] },
      { key: "cli_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_equipe", "ver_todos"] },
    ],
  },
  {
    key: "contratos", label: "Contratos", icon: "FileText",
    subcategories: [
      { key: "ctr_geral", label: "Contratos", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "ctr_cancelar", label: "Cancelamento", actions: ["aprovar"] },
      { key: "ctr_valores", label: "Valores de Contrato", actions: ["visualizar"] },
      { key: "ctr_historico", label: "Histórico Contratual", actions: ["visualizar"] },
      { key: "ctr_totais", label: "Quantidade Total", actions: ["visualizar"] },
      { key: "ctr_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_todos"] },
    ],
  },
  {
    key: "produtos", label: "Produtos e Serviços", icon: "Package",
    subcategories: [
      { key: "prod_geral", label: "Produtos", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "prod_precos", label: "Preços", actions: ["visualizar"] },
      { key: "prod_custos", label: "Custos", actions: ["visualizar"] },
      { key: "prod_margem", label: "Margem", actions: ["visualizar"] },
      { key: "prod_planos", label: "Planos Recorrentes", actions: ["visualizar", "criar", "editar", "excluir"] },
    ],
  },
  {
    key: "projetos", label: "Projetos", icon: "Briefcase",
    subcategories: [
      { key: "proj_geral", label: "Projetos", actions: ["visualizar", "criar", "editar", "excluir", "alterar_status"] },
      { key: "proj_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_equipe", "ver_todos"] },
    ],
  },
  {
    key: "tarefas", label: "Tarefas", icon: "CheckSquare",
    subcategories: [
      { key: "tar_geral", label: "Tarefas", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "tar_fluxo", label: "Fluxo de Trabalho", actions: ["alterar_status", "atribuir", "comentar"] },
      { key: "tar_gerar", label: "Gerar Tarefas do Período", actions: ["criar"] },
      { key: "tar_modelos", label: "Modelos de Tarefas", actions: ["visualizar", "editar"] },
      { key: "tar_subtarefas", label: "Subtarefas e Checklists", actions: ["criar", "editar", "excluir"] },
      { key: "tar_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_equipe", "ver_todos"] },
    ],
  },
  {
    key: "entregas", label: "Entregas Contratuais", icon: "ClipboardCheck",
    subcategories: [
      { key: "ent_checklist", label: "Checklist Contratual", actions: ["visualizar", "editar"] },
      { key: "ent_preencher", label: "Preencher Checklist", actions: ["criar"] },
      { key: "ent_justificar", label: "Justificar Não Entrega", actions: ["criar"] },
      { key: "ent_aprovar", label: "Aprovar Checklist", actions: ["aprovar"] },
      { key: "ent_historico", label: "Histórico de Entregas", actions: ["visualizar"] },
      { key: "ent_metricas", label: "Métricas de Cumprimento", actions: ["visualizar"] },
      { key: "ent_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_equipe", "ver_todos"] },
    ],
  },
  {
    key: "financeiro", label: "Financeiro", icon: "DollarSign",
    subcategories: [
      { key: "fin_geral", label: "Visão Geral", actions: ["visualizar"] },
      { key: "fin_pagar", label: "Contas a Pagar", actions: ["visualizar", "criar", "editar", "excluir", "aprovar"] },
      { key: "fin_receber", label: "Contas a Receber", actions: ["visualizar", "criar", "editar", "excluir", "aprovar"] },
      { key: "fin_fluxo", label: "Fluxo de Caixa", actions: ["visualizar"] },
      { key: "fin_inadimplencia", label: "Inadimplência", actions: ["visualizar"] },
      { key: "fin_faturamento", label: "Faturamento", actions: ["visualizar"] },
      { key: "fin_lucro", label: "Lucro", actions: ["visualizar"] },
      { key: "fin_margem", label: "Margem", actions: ["visualizar"] },
      { key: "fin_exportar", label: "Exportação Financeira", actions: ["exportar"] },
      { key: "fin_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_todos"] },
    ],
  },
  {
    key: "bancos", label: "Bancos e Contas", icon: "Landmark",
    subcategories: [
      { key: "ban_bancos", label: "Bancos", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "ban_contas", label: "Contas Bancárias", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "ban_saldos", label: "Saldos", actions: ["visualizar"] },
    ],
  },
  {
    key: "despesas", label: "Despesas", icon: "TrendingDown",
    subcategories: [
      { key: "desp_geral", label: "Despesas", actions: ["visualizar", "criar", "editar", "excluir", "aprovar"] },
      { key: "desp_classificar", label: "Classificação", actions: ["editar"] },
      { key: "desp_tipos", label: "Tipos e Centros de Custo", actions: ["visualizar"] },
      { key: "desp_exportar", label: "Exportação", actions: ["exportar"] },
    ],
  },
  {
    key: "receitas", label: "Receitas", icon: "TrendingUp",
    subcategories: [
      { key: "rec_geral", label: "Receitas", actions: ["visualizar", "criar", "editar", "excluir", "aprovar"] },
      { key: "rec_exportar", label: "Exportação", actions: ["exportar"] },
    ],
  },
  {
    key: "relatorios", label: "Relatórios", icon: "BarChart3",
    subcategories: [
      { key: "rel_financeiros", label: "Relatórios Financeiros", actions: ["visualizar", "exportar"] },
      { key: "rel_operacionais", label: "Relatórios Operacionais", actions: ["visualizar", "exportar"] },
      { key: "rel_tarefas", label: "Relatórios de Tarefas", actions: ["visualizar", "exportar"] },
      { key: "rel_clientes", label: "Relatórios de Clientes", actions: ["visualizar", "exportar"] },
      { key: "rel_contratos", label: "Relatórios de Contratos", actions: ["visualizar", "exportar"] },
      { key: "rel_escopo", label: "Escopo de Visão", actions: ["ver_proprios", "ver_equipe", "ver_todos"] },
    ],
  },
  {
    key: "cadastros", label: "Cadastros Mestres", icon: "Database",
    subcategories: [
      { key: "cad_geral", label: "Cadastros", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "cad_categorias", label: "Categorias", actions: ["criar", "editar", "excluir"] },
      { key: "cad_tipos_cliente", label: "Tipos de Cliente", actions: ["criar", "editar"] },
      { key: "cad_tipos_despesa", label: "Tipos de Despesa", actions: ["criar", "editar"] },
      { key: "cad_bancos", label: "Bancos", actions: ["criar", "editar"] },
      { key: "cad_departamentos", label: "Departamentos", actions: ["criar", "editar"] },
      { key: "cad_cargos", label: "Cargos", actions: ["criar", "editar"] },
      { key: "cad_motivos", label: "Motivos (cancelamento, inadimplência)", actions: ["criar", "editar"] },
    ],
  },
  {
    key: "usuarios", label: "Usuários e Permissões", icon: "Shield",
    subcategories: [
      { key: "usr_usuarios", label: "Usuários", actions: ["visualizar", "criar", "editar", "excluir"] },
      { key: "usr_ativar", label: "Ativar/Desativar Usuários", actions: ["alterar_status"] },
      { key: "usr_senhas", label: "Redefinir Senhas", actions: ["editar"] },
      { key: "usr_cargos", label: "Cargos", actions: ["visualizar", "criar", "editar"] },
      { key: "usr_perfis", label: "Perfis de Acesso", actions: ["visualizar", "criar", "editar"] },
      { key: "usr_permissoes", label: "Editar Permissões", actions: ["editar"] },
      { key: "usr_duplicar", label: "Duplicar Perfil", actions: ["criar"] },
      { key: "usr_auditoria", label: "Auditoria", actions: ["visualizar"] },
      { key: "usr_seguranca", label: "Configurações de Segurança", actions: ["visualizar", "editar"] },
    ],
  },
  {
    key: "configuracoes", label: "Configurações do Sistema", icon: "Settings",
    subcategories: [
      { key: "cfg_geral", label: "Configurações Gerais", actions: ["visualizar", "editar"] },
      { key: "cfg_integracoes", label: "Integrações", actions: ["visualizar", "editar"] },
      { key: "cfg_webhooks", label: "Webhooks", actions: ["visualizar", "editar"] },
      { key: "cfg_automacoes", label: "Automações", actions: ["visualizar", "editar"] },
      { key: "cfg_visual", label: "Identidade Visual", actions: ["visualizar", "editar"] },
      { key: "cfg_parametros", label: "Parâmetros Globais", actions: ["visualizar", "editar"] },
      { key: "cfg_modo_demo", label: "Modo Demo", actions: ["visualizar"] },
    ],
  },
];

// ── Permissions map: "subcatKey.action" → boolean ──
export type PermissionsMap = Record<string, boolean>;

export function permKey(subcatKey: string, action: PermAction): string {
  return `${subcatKey}.${action}`;
}

// ── Build full-access map ──
export function buildFullAccess(): PermissionsMap {
  const map: PermissionsMap = {};
  permissionTree.forEach((cat) =>
    cat.subcategories.forEach((sub) =>
      sub.actions.forEach((act) => {
        map[permKey(sub.key, act)] = true;
      })
    )
  );
  return map;
}

// ── Build empty map ──
export function buildEmptyAccess(): PermissionsMap {
  const map: PermissionsMap = {};
  permissionTree.forEach((cat) =>
    cat.subcategories.forEach((sub) =>
      sub.actions.forEach((act) => {
        map[permKey(sub.key, act)] = false;
      })
    )
  );
  return map;
}

// ── Role definition ──
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionsMap;
  isSystem: boolean; // admin cannot be deleted
  usersCount: number;
}

// ── User ──
export type UserStatus = "ativo" | "inativo" | "bloqueado";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  department: string;
  status: UserStatus;
  avatarUrl?: string;
  createdAt: string;
  lastAccess?: string;
}

// ── Audit ──
export interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  detail: string;
  createdAt: string;
}

// ── Build role presets ──
function buildOperationalAccess(): PermissionsMap {
  const map = buildEmptyAccess();
  // Can see own dashboard, tasks, projects
  ["dash_geral", "dash_operacional", "dash_pessoal"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  ["tar_geral"].forEach((k) => {
    map[permKey(k, "visualizar")] = true;
    map[permKey(k, "criar")] = true;
    map[permKey(k, "editar")] = true;
  });
  map[permKey("tar_fluxo", "alterar_status")] = true;
  map[permKey("tar_fluxo", "comentar")] = true;
  map[permKey("tar_escopo", "ver_proprios")] = true;
  map[permKey("tar_subtarefas", "criar")] = true;
  map[permKey("tar_subtarefas", "editar")] = true;
  ["proj_geral"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  map[permKey("proj_escopo", "ver_proprios")] = true;
  ["cli_geral"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  map[permKey("cli_escopo", "ver_proprios")] = true;
  ["ent_checklist", "ent_historico"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  map[permKey("ent_preencher", "criar")] = true;
  map[permKey("ent_escopo", "ver_proprios")] = true;
  return map;
}

function buildFinanceAccess(): PermissionsMap {
  const map = buildEmptyAccess();
  ["dash_geral", "dash_financeiro"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  // Full financial access
  permissionTree
    .filter((c) => ["financeiro", "bancos", "despesas", "receitas"].includes(c.key))
    .forEach((cat) =>
      cat.subcategories.forEach((sub) =>
        sub.actions.forEach((act) => { map[permKey(sub.key, act)] = true; })
      )
    );
  ["rel_financeiros"].forEach((k) => { map[permKey(k, "visualizar")] = true; map[permKey(k, "exportar")] = true; });
  ["cli_geral"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  ["ctr_geral", "ctr_valores"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  return map;
}

function buildManagerAccess(): PermissionsMap {
  const map = buildEmptyAccess();
  // Most things except financial sensitive
  permissionTree.forEach((cat) => {
    if (["financeiro", "bancos", "despesas", "receitas", "usuarios", "configuracoes"].includes(cat.key)) return;
    cat.subcategories.forEach((sub) =>
      sub.actions.forEach((act) => { map[permKey(sub.key, act)] = true; })
    );
  });
  // Limited finance view
  ["fin_geral", "fin_faturamento"].forEach((k) => { map[permKey(k, "visualizar")] = true; });
  return map;
}

// ── Initial roles ──
export const initialRoles: Role[] = [
  { id: "admin", name: "Administrador", description: "Acesso total ao sistema", permissions: buildFullAccess(), isSystem: true, usersCount: 1 },
  { id: "diretor", name: "Diretor", description: "Visão estratégica completa", permissions: buildFullAccess(), isSystem: false, usersCount: 1 },
  { id: "financeiro", name: "Financeiro", description: "Gestão financeira completa", permissions: buildFinanceAccess(), isSystem: false, usersCount: 1 },
  { id: "gestor", name: "Gestor de Projetos", description: "Gestão operacional e de equipe", permissions: buildManagerAccess(), isSystem: false, usersCount: 2 },
  { id: "social_media", name: "Social Media", description: "Criação de conteúdo e gerenciamento de redes", permissions: buildOperationalAccess(), isSystem: false, usersCount: 1 },
  { id: "designer", name: "Designer", description: "Criação visual e design", permissions: buildOperationalAccess(), isSystem: false, usersCount: 1 },
  { id: "trafego", name: "Tráfego Pago", description: "Gestão de campanhas de mídia paga", permissions: buildOperationalAccess(), isSystem: false, usersCount: 1 },
  { id: "atendimento", name: "Atendimento", description: "Relacionamento com clientes", permissions: buildOperationalAccess(), isSystem: false, usersCount: 1 },
  { id: "assistente", name: "Assistente", description: "Suporte operacional com acesso limitado", permissions: buildOperationalAccess(), isSystem: false, usersCount: 0 },
  { id: "parceiro", name: "Parceiro Externo", description: "Acesso restrito a projetos específicos", permissions: buildEmptyAccess(), isSystem: false, usersCount: 0 },
  { id: "cliente_convidado", name: "Cliente Convidado", description: "Visualização limitada de entregas", permissions: buildEmptyAccess(), isSystem: false, usersCount: 0 },
];

export const departments = [
  "Diretoria", "Financeiro", "Operações", "Criativo", "Tráfego", "Atendimento", "TI",
];

export const initialUsers: AppUser[] = [
  { id: "u1", name: "Gustavo Torres", email: "gustavo@totum.com", phone: "(11) 99999-0001", roleId: "admin", department: "Diretoria", status: "ativo", createdAt: "2025-01-15", lastAccess: "2026-03-18T10:30:00" },
  { id: "u2", name: "Ana Silva", email: "ana@totum.com", phone: "(11) 99999-0002", roleId: "gestor", department: "Operações", status: "ativo", createdAt: "2025-03-20", lastAccess: "2026-03-18T09:15:00" },
  { id: "u3", name: "Juliana Costa", email: "juliana@totum.com", phone: "(11) 99999-0003", roleId: "trafego", department: "Tráfego", status: "ativo", createdAt: "2025-04-10", lastAccess: "2026-03-17T18:00:00" },
  { id: "u4", name: "Rafael Lima", email: "rafael@totum.com", phone: "(11) 99999-0004", roleId: "designer", department: "Criativo", status: "ativo", createdAt: "2025-05-01", lastAccess: "2026-03-18T08:45:00" },
  { id: "u5", name: "Marina Souza", email: "marina@totum.com", phone: "(11) 99999-0005", roleId: "atendimento", department: "Atendimento", status: "ativo", createdAt: "2025-06-15", lastAccess: "2026-03-17T17:30:00" },
  { id: "u6", name: "Carlos Mendes", email: "carlos@totum.com", phone: "(11) 99999-0006", roleId: "gestor", department: "Operações", status: "ativo", createdAt: "2025-02-10", lastAccess: "2026-03-18T11:00:00" },
  { id: "u7", name: "Fernanda Dias", email: "fernanda@totum.com", phone: "(11) 99999-0007", roleId: "financeiro", department: "Financeiro", status: "ativo", createdAt: "2025-07-01", lastAccess: "2026-03-18T07:30:00" },
  { id: "u8", name: "Lucas Ribeiro", email: "lucas@totum.com", phone: "(11) 99999-0008", roleId: "social_media", department: "Criativo", status: "inativo", createdAt: "2025-08-20" },
  { id: "u9", name: "Pedro Almeida", email: "pedro@totum.com", phone: "(11) 99999-0009", roleId: "diretor", department: "Diretoria", status: "ativo", createdAt: "2025-01-15", lastAccess: "2026-03-16T14:00:00" },
];

export const initialAudit: AuditEntry[] = [
  { id: "a1", userId: "u1", userName: "Gustavo Torres", action: "Usuário criado", detail: "Usuário Ana Silva criado com cargo Gestor de Projetos", createdAt: "2025-03-20T10:00:00" },
  { id: "a2", userId: "u1", userName: "Gustavo Torres", action: "Permissão alterada", detail: "Cargo Financeiro: adicionada permissão de exportar relatórios", createdAt: "2025-09-10T14:30:00" },
  { id: "a3", userId: "u2", userName: "Ana Silva", action: "Status alterado", detail: "Usuário Lucas Ribeiro marcado como inativo", createdAt: "2026-01-15T09:00:00" },
  { id: "a4", userId: "u1", userName: "Gustavo Torres", action: "Cargo criado", detail: "Cargo Parceiro Externo criado", createdAt: "2026-02-01T11:00:00" },
  { id: "a5", userId: "u1", userName: "Gustavo Torres", action: "Senha redefinida", detail: "Senha de Marina Souza redefinida", createdAt: "2026-03-05T16:00:00" },
];

// Status config
export const userStatusConfig: Record<UserStatus, { label: string; color: string; bg: string }> = {
  ativo: { label: "Ativo", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  inativo: { label: "Inativo", color: "text-white/40", bg: "bg-white/[0.05]" },
  bloqueado: { label: "Bloqueado", color: "text-red-400", bg: "bg-red-500/10" },
};
