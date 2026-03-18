import type { Task, TaskStatus, TaskPriority, TaskType } from "@/components/tasks/taskData";
import type { ClientRow } from "@/hooks/useClients";
import type { ContractRow } from "@/hooks/useContracts";
import type { ProjectRow } from "@/hooks/useProjects";
import type { FinancialEntryRow } from "@/hooks/useFinancial";

// ── Helper ──
const uuid = (n: number) => `demo-${String(n).padStart(4, "0")}-0000-0000-000000000000`;
const today = new Date();
const daysAgo = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().split("T")[0];
};
const daysFromNow = (d: number) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split("T")[0];
};

// ── Clients ──
export const demoClients: ClientRow[] = [
  { id: uuid(1), name: "TechVentures S.A.", email: "contato@techventures.com", phone: "(11) 99999-0001", document: "12.345.678/0001-01", address: "Av. Paulista, 1000 - São Paulo/SP", status: "ativo", notes: "Cliente premium desde 2024", marketing_analysis: "Perfil B2B focado em SaaS. Público decisor: CTOs e CMOs de empresas mid-market. Presença digital forte no LinkedIn, oportunidade em SEO e Google Ads para captura de leads qualificados.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(180), updated_at: daysAgo(2) },
  { id: uuid(2), name: "Nova Digital LTDA", email: "oi@novadigital.com.br", phone: "(21) 98888-0002", document: "23.456.789/0001-02", address: "R. da Quitanda, 50 - Rio de Janeiro/RJ", status: "ativo", notes: "Focado em e-commerce", marketing_analysis: "Loja virtual de moda feminina. Principal canal: Instagram e Meta Ads. Taxa de conversão atual: 2.1%. Oportunidade de aumentar para 3%+ com remarketing dinâmico e otimização de landing pages.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(120), updated_at: daysAgo(5) },
  { id: uuid(3), name: "Startup Labs", email: "hello@startuplabs.io", phone: "(11) 97777-0003", document: "34.567.890/0001-03", address: "R. Augusta, 2000 - São Paulo/SP", status: "ativo", notes: "Startup de EdTech", marketing_analysis: "App educacional B2C. Público: 18-35 anos, universitários. Estratégia recomendada: TikTok Ads + YouTube Shorts para aquisição + email marketing para retenção.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(90), updated_at: daysAgo(1) },
  { id: uuid(4), name: "Innova Corp", email: "contato@innovacorp.com.br", phone: "(31) 96666-0004", document: "45.678.901/0001-04", address: "Av. Afonso Pena, 500 - BH/MG", status: "ativo", notes: "Consultoria empresarial", marketing_analysis: "Consultoria B2B, ticket alto. LinkedIn é o principal canal. Recomendação: conteúdo de autoridade (artigos, cases) + LinkedIn Ads segmentados por cargo.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(150), updated_at: daysAgo(10) },
  { id: uuid(5), name: "DigitalPlus Agência", email: "contato@digitalplus.com", phone: "(41) 95555-0005", document: "56.789.012/0001-05", address: "R. XV de Novembro, 100 - Curitiba/PR", status: "ativo", notes: "Parceiro estratégico", marketing_analysis: "Agência parceira que terceiriza gestão de tráfego. Foco em resultados mensuráveis: CPL, ROAS e LTV.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(200), updated_at: daysAgo(3) },
  { id: uuid(6), name: "Agro Connect", email: "admin@agroconnect.com.br", phone: "(62) 94444-0006", document: "67.890.123/0001-06", address: "Av. Goiás, 800 - Goiânia/GO", status: "ativo", notes: "Agronegócio digital", marketing_analysis: "Plataforma de marketplace agrícola. Público rural com crescente digitalização. Oportunidade: WhatsApp Business API + Google Ads para termos do setor.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(60), updated_at: daysAgo(7) },
  { id: uuid(7), name: "Saúde Mais Clínicas", email: "marketing@saudemais.med.br", phone: "(11) 93333-0007", document: "78.901.234/0001-07", address: "R. Oscar Freire, 300 - São Paulo/SP", status: "ativo", notes: "Rede de clínicas", marketing_analysis: "Rede com 5 unidades. Foco em Google Ads local + SEO para especialidades médicas. Meta: aumentar agendamentos online em 40%.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(45), updated_at: daysAgo(1) },
  { id: uuid(8), name: "Escola Futuro", email: "contato@escolafuturo.edu.br", phone: "(85) 92222-0008", document: "89.012.345/0001-08", address: "Av. Beira Mar, 2500 - Fortaleza/CE", status: "inativo", notes: "Contrato encerrado em Fev/2026", marketing_analysis: "Escola particular K-12. Campanha de matrícula sazonal. Performance anterior: 200 leads/mês no pico.", client_type_id: null, assigned_user_id: null, created_at: daysAgo(300), updated_at: daysAgo(30) },
];

// ── Contracts ──
export const demoContracts: ContractRow[] = [
  { id: uuid(101), title: "Gestão de Marketing Digital - Premium", client_id: uuid(1), status: "ativo", value: 8500, start_date: daysAgo(180), end_date: daysFromNow(180), billing_frequency: "mensal", notes: "Contrato anual renovável", contract_type_id: null, plan_id: null, created_at: daysAgo(180), updated_at: daysAgo(2), clients: { name: "TechVentures S.A." }, plans: null, contract_types: null },
  { id: uuid(102), title: "Social Media + Tráfego - Essencial", client_id: uuid(2), status: "ativo", value: 3200, start_date: daysAgo(120), end_date: daysFromNow(240), billing_frequency: "mensal", notes: null, contract_type_id: null, plan_id: null, created_at: daysAgo(120), updated_at: daysAgo(5), clients: { name: "Nova Digital LTDA" }, plans: null, contract_types: null },
  { id: uuid(103), title: "Branding + Lançamento de App", client_id: uuid(3), status: "ativo", value: 15000, start_date: daysAgo(60), end_date: daysFromNow(30), billing_frequency: null, notes: "Projeto pontual", contract_type_id: null, plan_id: null, created_at: daysAgo(60), updated_at: daysAgo(1), clients: { name: "Startup Labs" }, plans: null, contract_types: null },
  { id: uuid(104), title: "Consultoria de Performance - Pro", client_id: uuid(4), status: "ativo", value: 5500, start_date: daysAgo(150), end_date: daysFromNow(210), billing_frequency: "mensal", notes: null, contract_type_id: null, plan_id: null, created_at: daysAgo(150), updated_at: daysAgo(10), clients: { name: "Innova Corp" }, plans: null, contract_types: null },
  { id: uuid(105), title: "Gestão de Tráfego Pago", client_id: uuid(5), status: "ativo", value: 4000, start_date: daysAgo(200), end_date: daysFromNow(160), billing_frequency: "mensal", notes: null, contract_type_id: null, plan_id: null, created_at: daysAgo(200), updated_at: daysAgo(3), clients: { name: "DigitalPlus Agência" }, plans: null, contract_types: null },
  { id: uuid(106), title: "Marketing Digital - Básico", client_id: uuid(6), status: "ativo", value: 2800, start_date: daysAgo(60), end_date: daysFromNow(300), billing_frequency: "mensal", notes: null, contract_type_id: null, plan_id: null, created_at: daysAgo(60), updated_at: daysAgo(7), clients: { name: "Agro Connect" }, plans: null, contract_types: null },
  { id: uuid(107), title: "Google Ads + SEO Local", client_id: uuid(7), status: "ativo", value: 6000, start_date: daysAgo(45), end_date: daysFromNow(315), billing_frequency: "mensal", notes: null, contract_type_id: null, plan_id: null, created_at: daysAgo(45), updated_at: daysAgo(1), clients: { name: "Saúde Mais Clínicas" }, plans: null, contract_types: null },
  { id: uuid(108), title: "Campanha de Matrículas 2025", client_id: uuid(8), status: "encerrado", value: 12000, start_date: daysAgo(300), end_date: daysAgo(30), billing_frequency: null, notes: "Projeto concluído", contract_type_id: null, plan_id: null, created_at: daysAgo(300), updated_at: daysAgo(30), clients: { name: "Escola Futuro" }, plans: null, contract_types: null },
];

// ── Tasks ──
const mkTask = (id: number, overrides: Partial<Task>): Task => ({
  id: uuid(id),
  title: "",
  description: "",
  clientId: uuid(1),
  clientName: "TechVentures S.A.",
  priority: "media" as TaskPriority,
  status: "pendente" as TaskStatus,
  type: "outro" as TaskType,
  subtasks: [],
  checklist: [],
  comments: [],
  history: [],
  ...overrides,
});

export const demoTasks: Task[] = [
  // TechVentures
  mkTask(201, { title: "Criar 8 artes para Instagram", clientId: uuid(1), clientName: "TechVentures S.A.", responsible: "Ana Silva", responsibleId: "demo-user-1", priority: "alta", status: "em_andamento", type: "conteudo", startDate: daysAgo(5), dueDate: daysFromNow(5), checklist: [{ id: "dc1", text: "Briefing aprovado", completed: true }, { id: "dc2", text: "4 artes prontas", completed: true }, { id: "dc3", text: "8 artes prontas", completed: false }, { id: "dc4", text: "Aprovação do cliente", completed: false }] }),
  mkTask(202, { title: "Gestão de tráfego (Google Ads)", clientId: uuid(1), clientName: "TechVentures S.A.", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "alta", status: "em_andamento", type: "trafego", dueDate: daysFromNow(15) }),
  mkTask(203, { title: "Relatório mensal de performance", clientId: uuid(1), clientName: "TechVentures S.A.", responsible: "Carlos Mendes", responsibleId: "demo-user-2", priority: "alta", status: "pendente", type: "relatorio", dueDate: daysFromNow(10) }),
  mkTask(204, { title: "Reunião de alinhamento mensal", clientId: uuid(1), clientName: "TechVentures S.A.", responsible: "Marina Souza", responsibleId: "demo-user-5", priority: "media", status: "concluido", type: "reuniao", dueDate: daysAgo(2) }),
  // Nova Digital
  mkTask(205, { title: "Criar 6 artes para feed", clientId: uuid(2), clientName: "Nova Digital LTDA", responsible: "Rafael Lima", responsibleId: "demo-user-4", priority: "alta", status: "concluido", type: "conteudo", dueDate: daysAgo(3) }),
  mkTask(206, { title: "Configurar remarketing dinâmico", clientId: uuid(2), clientName: "Nova Digital LTDA", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "alta", status: "em_andamento", type: "trafego", dueDate: daysFromNow(7) }),
  mkTask(207, { title: "Otimização de landing page", clientId: uuid(2), clientName: "Nova Digital LTDA", responsible: "Ana Silva", responsibleId: "demo-user-1", priority: "media", status: "pendente", type: "desenvolvimento", dueDate: daysFromNow(12) }),
  // Startup Labs
  mkTask(208, { title: "Identidade visual do app", clientId: uuid(3), clientName: "Startup Labs", responsible: "Ana Silva", responsibleId: "demo-user-1", priority: "urgente", status: "em_andamento", type: "design", dueDate: daysFromNow(3), projectId: uuid(301) }),
  mkTask(209, { title: "Criação de vídeo de lançamento", clientId: uuid(3), clientName: "Startup Labs", responsible: "Rafael Lima", responsibleId: "demo-user-4", priority: "alta", status: "pendente", type: "conteudo", dueDate: daysFromNow(14), projectId: uuid(301) }),
  mkTask(210, { title: "Configurar campanhas TikTok Ads", clientId: uuid(3), clientName: "Startup Labs", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "alta", status: "pendente", type: "trafego", dueDate: daysFromNow(20), projectId: uuid(301) }),
  // Innova Corp
  mkTask(211, { title: "Produzir 4 artigos LinkedIn", clientId: uuid(4), clientName: "Innova Corp", responsible: "Carlos Mendes", responsibleId: "demo-user-2", priority: "media", status: "em_andamento", type: "conteudo", dueDate: daysFromNow(8) }),
  mkTask(212, { title: "LinkedIn Ads - Campanha de leads", clientId: uuid(4), clientName: "Innova Corp", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "alta", status: "pendente", type: "trafego", dueDate: daysAgo(2) }), // OVERDUE
  // DigitalPlus
  mkTask(213, { title: "Relatório semanal de performance", clientId: uuid(5), clientName: "DigitalPlus Agência", responsible: "Carlos Mendes", responsibleId: "demo-user-2", priority: "media", status: "concluido", type: "relatorio", dueDate: daysAgo(1) }),
  mkTask(214, { title: "Otimização de campanhas Meta", clientId: uuid(5), clientName: "DigitalPlus Agência", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "alta", status: "em_andamento", type: "trafego", dueDate: daysFromNow(4) }),
  // Agro Connect
  mkTask(215, { title: "Setup WhatsApp Business API", clientId: uuid(6), clientName: "Agro Connect", responsible: "Marina Souza", responsibleId: "demo-user-5", priority: "alta", status: "pendente", type: "desenvolvimento", dueDate: daysFromNow(18) }),
  mkTask(216, { title: "Criar campanha Google Ads agro", clientId: uuid(6), clientName: "Agro Connect", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "media", status: "pendente", type: "trafego", dueDate: daysAgo(5) }), // OVERDUE
  // Saúde Mais
  mkTask(217, { title: "SEO local - 5 unidades", clientId: uuid(7), clientName: "Saúde Mais Clínicas", responsible: "Carlos Mendes", responsibleId: "demo-user-2", priority: "alta", status: "em_andamento", type: "desenvolvimento", dueDate: daysFromNow(25) }),
  mkTask(218, { title: "Google Ads - campanhas por especialidade", clientId: uuid(7), clientName: "Saúde Mais Clínicas", responsible: "Juliana Costa", responsibleId: "demo-user-3", priority: "alta", status: "em_andamento", type: "trafego", dueDate: daysFromNow(6) }),
  mkTask(219, { title: "Criar 12 posts para Instagram", clientId: uuid(7), clientName: "Saúde Mais Clínicas", responsible: "Ana Silva", responsibleId: "demo-user-1", priority: "media", status: "pendente", type: "conteudo", dueDate: daysFromNow(15) }),
  // Archived
  mkTask(220, { title: "Campanha de matrículas - fase 1", clientId: uuid(8), clientName: "Escola Futuro", responsible: "Ana Silva", responsibleId: "demo-user-1", priority: "alta", status: "arquivado", type: "trafego", dueDate: daysAgo(60) }),
];

// ── Projects ──
export const demoProjects: ProjectRow[] = [
  { id: uuid(301), name: "Lançamento App Startup Labs", description: "Projeto completo de lançamento do aplicativo educacional", client_id: uuid(3), status: "em_andamento", start_date: daysAgo(30), due_date: daysFromNow(30), responsible_id: null, contract_id: uuid(103), project_type_id: null, created_at: daysAgo(30), updated_at: daysAgo(1), clients: { name: "Startup Labs" }, project_types: null },
  { id: uuid(302), name: "Rebranding DigitalPlus", description: "Nova identidade visual e posicionamento", client_id: uuid(5), status: "pendente", start_date: daysFromNow(5), due_date: daysFromNow(45), responsible_id: null, contract_id: null, project_type_id: null, created_at: daysAgo(10), updated_at: daysAgo(10), clients: { name: "DigitalPlus Agência" }, project_types: null },
  { id: uuid(303), name: "SEO Completo Saúde Mais", description: "Otimização para 5 unidades", client_id: uuid(7), status: "em_andamento", start_date: daysAgo(15), due_date: daysFromNow(45), responsible_id: null, contract_id: uuid(107), project_type_id: null, created_at: daysAgo(15), updated_at: daysAgo(1), clients: { name: "Saúde Mais Clínicas" }, project_types: null },
  { id: uuid(304), name: "Campanha de Matrículas 2025", description: "Campanha completa para período de matrículas", client_id: uuid(8), status: "concluido", start_date: daysAgo(300), due_date: daysAgo(30), responsible_id: null, contract_id: uuid(108), project_type_id: null, created_at: daysAgo(300), updated_at: daysAgo(30), clients: { name: "Escola Futuro" }, project_types: null },
];

// ── Financial ──
const mkEntry = (id: number, overrides: Partial<FinancialEntryRow>): FinancialEntryRow => ({
  id: uuid(id),
  description: "",
  type: "receber",
  value: 0,
  due_date: daysAgo(0),
  status: "pendente",
  payment_date: null,
  client_id: null,
  contract_id: null,
  category_id: null,
  cost_center_id: null,
  expense_type_id: null,
  supplier_id: null,
  bank_account_id: null,
  created_by: null,
  notes: null,
  recurrence: "unica",
  installment_number: null,
  total_installments: null,
  competence_date: null,
  created_at: daysAgo(30),
  updated_at: daysAgo(0),
  ...overrides,
});

export const demoFinancialEntries: FinancialEntryRow[] = [
  // Receitas (paid)
  mkEntry(401, { description: "Mensalidade - TechVentures S.A.", type: "receber", value: 8500, due_date: daysAgo(5), status: "pago", payment_date: daysAgo(4), client_id: uuid(1), contract_id: uuid(101), clients: { name: "TechVentures S.A." } }),
  mkEntry(402, { description: "Mensalidade - Nova Digital", type: "receber", value: 3200, due_date: daysAgo(5), status: "pago", payment_date: daysAgo(5), client_id: uuid(2), contract_id: uuid(102), clients: { name: "Nova Digital LTDA" } }),
  mkEntry(403, { description: "Parcela 1/3 - Startup Labs", type: "receber", value: 5000, due_date: daysAgo(30), status: "pago", payment_date: daysAgo(29), client_id: uuid(3), contract_id: uuid(103), installment_number: 1, total_installments: 3, clients: { name: "Startup Labs" } }),
  mkEntry(404, { description: "Parcela 2/3 - Startup Labs", type: "receber", value: 5000, due_date: daysAgo(0), status: "pendente", client_id: uuid(3), contract_id: uuid(103), installment_number: 2, total_installments: 3, clients: { name: "Startup Labs" } }),
  mkEntry(405, { description: "Parcela 3/3 - Startup Labs", type: "receber", value: 5000, due_date: daysFromNow(30), status: "pendente", client_id: uuid(3), contract_id: uuid(103), installment_number: 3, total_installments: 3, clients: { name: "Startup Labs" } }),
  mkEntry(406, { description: "Mensalidade - Innova Corp", type: "receber", value: 5500, due_date: daysAgo(3), status: "pago", payment_date: daysAgo(2), client_id: uuid(4), contract_id: uuid(104), clients: { name: "Innova Corp" } }),
  mkEntry(407, { description: "Mensalidade - DigitalPlus", type: "receber", value: 4000, due_date: daysAgo(5), status: "pago", payment_date: daysAgo(5), client_id: uuid(5), contract_id: uuid(105), clients: { name: "DigitalPlus Agência" } }),
  mkEntry(408, { description: "Mensalidade - Agro Connect", type: "receber", value: 2800, due_date: daysAgo(8), status: "atrasado", client_id: uuid(6), contract_id: uuid(106), clients: { name: "Agro Connect" } }),
  mkEntry(409, { description: "Mensalidade - Saúde Mais", type: "receber", value: 6000, due_date: daysAgo(1), status: "pago", payment_date: daysAgo(1), client_id: uuid(7), contract_id: uuid(107), clients: { name: "Saúde Mais Clínicas" } }),
  // Despesas
  mkEntry(410, { description: "Salários equipe", type: "pagar", value: 18000, due_date: daysAgo(5), status: "pago", payment_date: daysAgo(5), recurrence: "recorrente" }),
  mkEntry(411, { description: "Ferramentas SaaS (Figma, Adobe, etc.)", type: "pagar", value: 1200, due_date: daysAgo(10), status: "pago", payment_date: daysAgo(10), recurrence: "recorrente" }),
  mkEntry(412, { description: "Mídia - Meta Ads (investimento clientes)", type: "pagar", value: 5000, due_date: daysAgo(3), status: "pago", payment_date: daysAgo(3) }),
  mkEntry(413, { description: "Mídia - Google Ads (investimento clientes)", type: "pagar", value: 4500, due_date: daysAgo(3), status: "pago", payment_date: daysAgo(3) }),
  mkEntry(414, { description: "Aluguel escritório", type: "pagar", value: 3500, due_date: daysAgo(1), status: "pago", payment_date: daysAgo(1), recurrence: "recorrente" }),
  mkEntry(415, { description: "Freelancer - vídeo", type: "pagar", value: 2000, due_date: daysFromNow(10), status: "pendente" }),
];

// ── Notifications ──
export const demoNotifications = [
  { id: uuid(501), title: "Tarefa atribuída", message: "Você foi designado para 'Criar 8 artes para Instagram' - TechVentures S.A.", type: "info", is_read: false, created_at: daysAgo(0) + "T10:30:00" },
  { id: uuid(502), title: "Prazo próximo", message: "A tarefa 'Identidade visual do app' vence em 3 dias", type: "warning", is_read: false, created_at: daysAgo(0) + "T09:00:00" },
  { id: uuid(503), title: "Tarefa atrasada", message: "'LinkedIn Ads - Campanha de leads' está 2 dias atrasada - Innova Corp", type: "warning", is_read: false, created_at: daysAgo(1) + "T08:00:00" },
  { id: uuid(504), title: "Entrega confirmada", message: "Relatório semanal de performance entregue - DigitalPlus Agência", type: "info", is_read: true, created_at: daysAgo(1) + "T16:00:00" },
  { id: uuid(505), title: "Tarefa atrasada", message: "'Criar campanha Google Ads agro' está 5 dias atrasada - Agro Connect", type: "warning", is_read: false, created_at: daysAgo(2) + "T08:00:00" },
  { id: uuid(506), title: "Tarefa concluída", message: "'Criar 6 artes para feed' foi concluída - Nova Digital LTDA", type: "info", is_read: true, created_at: daysAgo(3) + "T14:00:00" },
];

// ── Dashboard Data ──
export const demoDashboardData = {
  mrr: 30000,
  activeClients: 7,
  fulfillmentPct: 78,
  profit: 6800,
  mrrChange: "+12%",
  clientsChange: "+2",
  profitChange: "+8%",
  recentActivity: [
    { action: "Tarefa concluída", client: "Nova Digital LTDA", time: "há 3h", type: "success" as const },
    { action: "Tarefa atrasada", client: "Innova Corp", time: "há 1d", type: "warning" as const },
    { action: "Contrato ativado", client: "Saúde Mais Clínicas", time: "há 2d", type: "info" as const },
    { action: "Entrega confirmada", client: "DigitalPlus Agência", time: "há 2d", type: "success" as const },
    { action: "Tarefa criada", client: "Agro Connect", time: "há 3d", type: "info" as const },
  ],
  pendingUsers: 0,
  overdueEntries: 1,
  pendingChecklists: 2,
};

export const demoExecutiveDashboardData = {
  totalRevenue: 35000,
  mrr: 30000,
  receivables: 10000,
  overdueReceivables: 2800,
  totalExpenses: 34200,
  grossProfit: 800,
  netProfit: 800,
  margin: 2,
  revenueByClient: [
    { name: "TechVentures S.A.", value: 8500 },
    { name: "Saúde Mais Clínicas", value: 6000 },
    { name: "Innova Corp", value: 5500 },
    { name: "Startup Labs", value: 5000 },
    { name: "DigitalPlus Agência", value: 4000 },
    { name: "Nova Digital LTDA", value: 3200 },
    { name: "Agro Connect", value: 2800 },
  ],
  revenueByService: [
    { name: "Gestão de Tráfego", value: 14000 },
    { name: "Social Media", value: 9500 },
    { name: "Projetos Pontuais", value: 7500 },
    { name: "SEO", value: 4000 },
  ],
  expensesByCategory: [
    { name: "Salários", value: 18000 },
    { name: "Mídia Paga", value: 9500 },
    { name: "Aluguel", value: 3500 },
    { name: "Ferramentas", value: 1200 },
    { name: "Freelancers", value: 2000 },
  ],
  totalTasks: 19,
  pendingTasks: 7,
  completedTasks: 4,
  overdueTasks: 2,
  completionRate: 21,
  productivityByUser: [
    { name: "Juliana Costa", total: 7, completed: 1, overdue: 1 },
    { name: "Ana Silva", total: 5, completed: 1, overdue: 0 },
    { name: "Carlos Mendes", total: 4, completed: 1, overdue: 0 },
    { name: "Rafael Lima", total: 2, completed: 1, overdue: 0 },
    { name: "Marina Souza", total: 2, completed: 1, overdue: 0 },
  ],
  criticalTasks: [
    { id: uuid(208), title: "Identidade visual do app", client: "Startup Labs", dueDate: daysFromNow(3), responsible: "Ana Silva" },
    { id: uuid(212), title: "LinkedIn Ads - Campanha de leads", client: "Innova Corp", dueDate: daysAgo(2), responsible: "Juliana Costa" },
    { id: uuid(202), title: "Gestão de tráfego (Google Ads)", client: "TechVentures S.A.", dueDate: daysFromNow(15), responsible: "Juliana Costa" },
  ],
  activeContracts: 7,
  defaultingContracts: 1,
  contractFulfillment: [
    { client: "Agro Connect", pct: 45 },
    { client: "Startup Labs", pct: 60 },
    { client: "Nova Digital LTDA", pct: 75 },
    { client: "TechVentures S.A.", pct: 85 },
    { client: "Innova Corp", pct: 80 },
    { client: "Saúde Mais Clínicas", pct: 70 },
    { client: "DigitalPlus Agência", pct: 90 },
  ],
  revenueForecast: 32000,
  topClients: [
    { name: "TechVentures S.A.", revenue: 8500, pct: 24 },
    { name: "Saúde Mais Clínicas", revenue: 6000, pct: 17 },
    { name: "Innova Corp", revenue: 5500, pct: 16 },
    { name: "Startup Labs", revenue: 5000, pct: 14 },
    { name: "DigitalPlus Agência", revenue: 4000, pct: 11 },
  ],
  revenueConcentration: 1642,
};

// ── Delivery Checklists (demo) ──
export const demoDeliveryChecklists = [
  // TechVentures - current month
  {
    id: uuid(701), client_id: uuid(1), contract_id: uuid(101), plan_id: null,
    period: "2026-03", frequency: "mensal" as const, fulfillment_pct: 75,
    completed_at: null, completed_by: null,
    created_at: daysAgo(15), updated_at: daysAgo(1),
    clients: { name: "TechVentures S.A." }, plans: { name: "Premium" },
    delivery_checklist_items: [
      { id: uuid(7011), checklist_id: uuid(701), name: "8 artes para Instagram", sort_order: 0, status: "entregue" as const, completed_at: daysAgo(3), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(15) },
      { id: uuid(7012), checklist_id: uuid(701), name: "Gestão de tráfego Google Ads", sort_order: 1, status: "entregue" as const, completed_at: daysAgo(2), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(15) },
      { id: uuid(7013), checklist_id: uuid(701), name: "Relatório mensal de performance", sort_order: 2, status: "entregue" as const, completed_at: daysAgo(1), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(15) },
      { id: uuid(7014), checklist_id: uuid(701), name: "Reunião de alinhamento mensal", sort_order: 3, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(15), completed_at: null },
    ],
  },
  // TechVentures - previous month (finalized)
  {
    id: uuid(702), client_id: uuid(1), contract_id: uuid(101), plan_id: null,
    period: "2026-02", frequency: "mensal" as const, fulfillment_pct: 100,
    completed_at: daysAgo(20), completed_by: "demo-user-5",
    created_at: daysAgo(45), updated_at: daysAgo(20),
    clients: { name: "TechVentures S.A." }, plans: { name: "Premium" },
    delivery_checklist_items: [
      { id: uuid(7021), checklist_id: uuid(702), name: "8 artes para Instagram", sort_order: 0, status: "entregue" as const, completed_at: daysAgo(25), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(45) },
      { id: uuid(7022), checklist_id: uuid(702), name: "Gestão de tráfego Google Ads", sort_order: 1, status: "entregue" as const, completed_at: daysAgo(22), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(45) },
      { id: uuid(7023), checklist_id: uuid(702), name: "Relatório mensal de performance", sort_order: 2, status: "entregue" as const, completed_at: daysAgo(21), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(45) },
      { id: uuid(7024), checklist_id: uuid(702), name: "Reunião de alinhamento mensal", sort_order: 3, status: "entregue" as const, completed_at: daysAgo(20), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(45) },
    ],
  },
  // Nova Digital
  {
    id: uuid(703), client_id: uuid(2), contract_id: uuid(102), plan_id: null,
    period: "2026-03", frequency: "mensal" as const, fulfillment_pct: 50,
    completed_at: null, completed_by: null,
    created_at: daysAgo(12), updated_at: daysAgo(1),
    clients: { name: "Nova Digital LTDA" }, plans: { name: "Essencial" },
    delivery_checklist_items: [
      { id: uuid(7031), checklist_id: uuid(703), name: "6 artes para feed", sort_order: 0, status: "entregue" as const, completed_at: daysAgo(3), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(12) },
      { id: uuid(7032), checklist_id: uuid(703), name: "Configurar remarketing dinâmico", sort_order: 1, status: "entregue_parcialmente" as const, completed_at: null, justification: "Pixel instalado, falta catálogo de produtos", observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(12) },
      { id: uuid(7033), checklist_id: uuid(703), name: "Otimização de landing page", sort_order: 2, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(12), completed_at: null },
      { id: uuid(7034), checklist_id: uuid(703), name: "Relatório de conversão", sort_order: 3, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(12), completed_at: null },
    ],
  },
  // Startup Labs
  {
    id: uuid(704), client_id: uuid(3), contract_id: uuid(103), plan_id: null,
    period: "2026-03", frequency: "mensal" as const, fulfillment_pct: 33,
    completed_at: null, completed_by: null,
    created_at: daysAgo(10), updated_at: daysAgo(1),
    clients: { name: "Startup Labs" }, plans: { name: "Lançamento" },
    delivery_checklist_items: [
      { id: uuid(7041), checklist_id: uuid(704), name: "Identidade visual do app", sort_order: 0, status: "entregue_parcialmente" as const, completed_at: null, justification: "Logo aprovado, faltam aplicações", observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10) },
      { id: uuid(7042), checklist_id: uuid(704), name: "Vídeo de lançamento", sort_order: 1, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10), completed_at: null },
      { id: uuid(7043), checklist_id: uuid(704), name: "Campanhas TikTok Ads", sort_order: 2, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10), completed_at: null },
    ],
  },
  // Innova Corp
  {
    id: uuid(705), client_id: uuid(4), contract_id: uuid(104), plan_id: null,
    period: "2026-03", frequency: "mensal" as const, fulfillment_pct: 0,
    completed_at: null, completed_by: null,
    created_at: daysAgo(8), updated_at: daysAgo(1),
    clients: { name: "Innova Corp" }, plans: { name: "Pro" },
    delivery_checklist_items: [
      { id: uuid(7051), checklist_id: uuid(705), name: "4 artigos LinkedIn", sort_order: 0, status: "nao_entregue" as const, completed_at: null, justification: "Cliente não aprovou pautas", observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(8) },
      { id: uuid(7052), checklist_id: uuid(705), name: "LinkedIn Ads - Campanha de leads", sort_order: 1, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(8), completed_at: null },
      { id: uuid(7053), checklist_id: uuid(705), name: "Relatório de performance", sort_order: 2, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(8), completed_at: null },
    ],
  },
  // Saúde Mais
  {
    id: uuid(706), client_id: uuid(7), contract_id: uuid(107), plan_id: null,
    period: "2026-03", frequency: "mensal" as const, fulfillment_pct: 60,
    completed_at: null, completed_by: null,
    created_at: daysAgo(10), updated_at: daysAgo(1),
    clients: { name: "Saúde Mais Clínicas" }, plans: { name: "SEO + Ads" },
    delivery_checklist_items: [
      { id: uuid(7061), checklist_id: uuid(706), name: "SEO local - 5 unidades", sort_order: 0, status: "entregue_parcialmente" as const, completed_at: null, justification: "3 de 5 unidades otimizadas", observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10) },
      { id: uuid(7062), checklist_id: uuid(706), name: "Google Ads por especialidade", sort_order: 1, status: "entregue" as const, completed_at: daysAgo(4), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10) },
      { id: uuid(7063), checklist_id: uuid(706), name: "12 posts para Instagram", sort_order: 2, status: "entregue" as const, completed_at: daysAgo(2), justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10) },
      { id: uuid(7064), checklist_id: uuid(706), name: "Relatório de agendamentos", sort_order: 3, status: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10), completed_at: null },
      { id: uuid(7065), checklist_id: uuid(706), name: "Reunião com gerentes das unidades", sort_order: 4, status: "nao_aplicavel" as const, completed_at: null, justification: null, observation: null, responsible_id: null, task_id: null, delivery_model_item_id: null, created_at: daysAgo(10) },
    ],
  },
];

// ── Client observations (timeline) ──
export const demoClientObservations = [
  { id: uuid(601), client_id: uuid(1), user_id: "demo-user-1", content: "Cliente solicitou ajuste na paleta de cores das artes de março", created_at: daysAgo(3) + "T14:30:00" },
  { id: uuid(602), client_id: uuid(1), user_id: "demo-user-5", content: "Reunião de alinhamento realizada. Cliente satisfeito com resultados de tráfego", created_at: daysAgo(7) + "T11:00:00" },
  { id: uuid(603), client_id: uuid(2), user_id: "demo-user-3", content: "Cliente reportou queda no ROAS. Investigando segmentação", created_at: daysAgo(2) + "T09:15:00" },
  { id: uuid(604), client_id: uuid(3), user_id: "demo-user-1", content: "Aprovação do logo final. Seguir para aplicações", created_at: daysAgo(5) + "T16:00:00" },
  { id: uuid(605), client_id: uuid(4), user_id: "demo-user-2", content: "Cliente não respondeu sobre aprovação dos artigos há 3 dias", created_at: daysAgo(1) + "T10:00:00" },
  { id: uuid(606), client_id: uuid(6), user_id: "demo-user-5", content: "Pagamento da mensalidade atrasado. Entrar em contato", created_at: daysAgo(4) + "T08:30:00" },
  { id: uuid(607), client_id: uuid(7), user_id: "demo-user-2", content: "Reunião com gerente da clínica Pinheiros para definir palavras-chave", created_at: daysAgo(2) + "T15:00:00" },
];
