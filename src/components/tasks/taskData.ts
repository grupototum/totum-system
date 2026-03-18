export type TaskStatus = "pendente" | "em_andamento" | "pausado" | "concluido";
export type TaskPriority = "baixa" | "media" | "alta" | "urgente";
export type TaskType = "conteudo" | "trafego" | "reuniao" | "relatorio" | "design" | "desenvolvimento" | "outro";
export type RecurrenceType = "diaria" | "semanal" | "mensal" | "personalizada";

export interface RecurrenceConfig {
  interval_days?: number;
  week_days?: number[]; // 0=Sun, 1=Mon, ...
  month_day?: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  responsible?: string;
  dueDate?: string;
}

export interface TaskComment {
  id: string;
  author: string;
  authorAvatarUrl?: string;
  text: string;
  createdAt: string;
}

export interface TaskHistoryEntry {
  id: string;
  action: string;
  detail: string;
  user: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  clientId: string;
  clientName: string;
  contractId?: string;
  planName?: string;
  projectId?: string;
  responsible?: string;
  responsibleAvatarUrl?: string;
  responsibleId?: string;
  priority: TaskPriority;
  status: TaskStatus;
  type: TaskType;
  startDate?: string;
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  // Recurrence
  isRecurring?: boolean;
  recurrenceType?: RecurrenceType;
  recurrenceConfig?: RecurrenceConfig;
  recurrenceEndDate?: string;
  parentTaskId?: string;
  lastGeneratedAt?: string;
  subtasks: Subtask[];
  checklist: ChecklistItem[];
  comments: TaskComment[];
  history: TaskHistoryEntry[];
}

export interface DeliveryModelItem {
  id: string;
  name: string;
  description: string;
  type: TaskType;
  suggestedPriority: TaskPriority;
  suggestedResponsible?: string;
}

export interface DeliveryModel {
  planId: string;
  planName: string;
  items: DeliveryModelItem[];
}

// Status config
export const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  pendente: { label: "Pendente", color: "text-white/50", bgColor: "bg-white/[0.06]" },
  em_andamento: { label: "Em andamento", color: "text-blue-400", bgColor: "bg-blue-500/10" },
  pausado: { label: "Pausado", color: "text-amber-400", bgColor: "bg-amber-500/10" },
  concluido: { label: "Concluído", color: "text-emerald-400", bgColor: "bg-emerald-500/10" },
};

export const priorityConfig: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  baixa: { label: "Baixa", color: "text-white/40", dot: "bg-white/30" },
  media: { label: "Média", color: "text-blue-400", dot: "bg-blue-500" },
  alta: { label: "Alta", color: "text-amber-400", dot: "bg-amber-500" },
  urgente: { label: "Urgente", color: "text-red-400", dot: "bg-red-500" },
};

export const typeLabels: Record<TaskType, string> = {
  conteudo: "Conteúdo",
  trafego: "Tráfego",
  reuniao: "Reunião",
  relatorio: "Relatório",
  design: "Design",
  desenvolvimento: "Desenvolvimento",
  outro: "Outro",
};

export const recurrenceLabels: Record<RecurrenceType, string> = {
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
  personalizada: "Personalizada",
};

export const weekDayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const statusColumns: TaskStatus[] = ["pendente", "em_andamento", "pausado", "concluido"];

// Delivery Models
export const deliveryModels: DeliveryModel[] = [
  {
    planId: "premium",
    planName: "Premium",
    items: [
      { id: "dm1", name: "Criar 8 artes para Instagram", description: "Feed posts", type: "conteudo", suggestedPriority: "alta" },
      { id: "dm2", name: "Criar 4 stories animados", description: "Stories semanais", type: "conteudo", suggestedPriority: "media" },
      { id: "dm3", name: "Produzir 1 vídeo curto", description: "Reels/Shorts", type: "conteudo", suggestedPriority: "alta" },
      { id: "dm4", name: "Gestão de tráfego (Google Ads)", description: "Otimização e monitoramento", type: "trafego", suggestedPriority: "alta", suggestedResponsible: "Juliana Costa" },
      { id: "dm5", name: "Gestão de tráfego (Meta Ads)", description: "Otimização e monitoramento", type: "trafego", suggestedPriority: "alta", suggestedResponsible: "Juliana Costa" },
      { id: "dm6", name: "Otimização de campanhas", description: "Revisão e otimização semanal", type: "trafego", suggestedPriority: "media" },
      { id: "dm7", name: "Relatório mensal de performance", description: "Métricas e insights", type: "relatorio", suggestedPriority: "alta" },
      { id: "dm8", name: "Reunião de alinhamento", description: "Call mensal com cliente", type: "reuniao", suggestedPriority: "media" },
    ],
  },
  {
    planId: "pro",
    planName: "Pro",
    items: [
      { id: "dm9", name: "Criar 6 artes para Instagram", description: "Feed posts", type: "conteudo", suggestedPriority: "alta" },
      { id: "dm10", name: "Criar 3 stories", description: "Stories semanais", type: "conteudo", suggestedPriority: "media" },
      { id: "dm11", name: "Gestão de tráfego (Meta Ads)", description: "Otimização", type: "trafego", suggestedPriority: "alta", suggestedResponsible: "Juliana Costa" },
      { id: "dm12", name: "Relatório mensal", description: "Métricas", type: "relatorio", suggestedPriority: "media" },
      { id: "dm13", name: "Reunião de alinhamento", description: "Call mensal", type: "reuniao", suggestedPriority: "media" },
    ],
  },
  {
    planId: "essencial",
    planName: "Essencial",
    items: [
      { id: "dm14", name: "Criar 3 artes para Instagram", description: "Feed posts", type: "conteudo", suggestedPriority: "alta" },
      { id: "dm15", name: "Gestão de tráfego (Meta Ads)", description: "Monitoramento básico", type: "trafego", suggestedPriority: "alta" },
      { id: "dm16", name: "Relatório quinzenal", description: "Métricas básicas", type: "relatorio", suggestedPriority: "media" },
    ],
  },
];

// Mock clients with plans
export const clientPlans = [
  { clientId: "1", clientName: "TechVentures S.A.", planId: "premium", planName: "Premium" },
  { clientId: "2", clientName: "Nova Digital", planId: "essencial", planName: "Essencial" },
  { clientId: "3", clientName: "Startup Labs", planId: "premium", planName: "Premium" },
  { clientId: "4", clientName: "Innova Corp", planId: "pro", planName: "Pro" },
  { clientId: "5", clientName: "DigitalPlus", planId: "essencial", planName: "Essencial" },
  { clientId: "6", clientName: "Agro Connect", planId: "pro", planName: "Pro" },
];

export const teamMembers = [
  "Ana Silva", "Carlos Mendes", "Juliana Costa", "Rafael Lima", "Marina Souza",
];

// Initial mock tasks
export const initialTasks: Task[] = [
  {
    id: "t1", title: "Criar 8 artes para Instagram", description: "Posts do mês para feed", clientId: "1", clientName: "TechVentures S.A.",
    planName: "Premium", responsible: "Ana Silva", priority: "alta", status: "em_andamento", type: "conteudo",
    startDate: "2026-03-10", dueDate: "2026-03-20", estimatedTime: 16,
    subtasks: [
      { id: "st1", title: "Briefing e referências", status: "concluido", responsible: "Ana Silva" },
      { id: "st2", title: "Criação dos layouts", status: "em_andamento", responsible: "Rafael Lima" },
      { id: "st3", title: "Revisão e ajustes", status: "pendente", responsible: "Ana Silva" },
    ],
    checklist: [
      { id: "cl1", text: "Briefing aprovado", completed: true },
      { id: "cl2", text: "4 artes prontas", completed: true },
      { id: "cl3", text: "8 artes prontas", completed: false },
      { id: "cl4", text: "Aprovação do cliente", completed: false },
    ],
    comments: [
      { id: "c1", author: "Ana Silva", text: "Briefing enviado para o cliente, aguardando aprovação", createdAt: "2026-03-10T10:00:00" },
      { id: "c2", author: "Rafael Lima", text: "Primeiros 4 layouts prontos", createdAt: "2026-03-14T15:30:00" },
    ],
    history: [
      { id: "h1", action: "Criada", detail: "Tarefa criada automaticamente", user: "Sistema", createdAt: "2026-03-01T08:00:00" },
      { id: "h2", action: "Status", detail: "Pendente → Em andamento", user: "Ana Silva", createdAt: "2026-03-10T09:00:00" },
    ],
  },
  {
    id: "t2", title: "Gestão de tráfego (Google Ads)", description: "Otimização semanal", clientId: "1", clientName: "TechVentures S.A.",
    planName: "Premium", responsible: "Juliana Costa", priority: "alta", status: "em_andamento", type: "trafego",
    startDate: "2026-03-01", dueDate: "2026-03-31",
    subtasks: [], checklist: [], comments: [], history: [],
  },
  {
    id: "t3", title: "Relatório mensal de performance", description: "Compilar métricas", clientId: "1", clientName: "TechVentures S.A.",
    planName: "Premium", responsible: undefined, priority: "alta", status: "pendente", type: "relatorio",
    dueDate: "2026-03-28",
    subtasks: [], checklist: [], comments: [], history: [],
  },
  {
    id: "t4", title: "Criar 3 artes para Instagram", description: "Feed posts", clientId: "2", clientName: "Nova Digital",
    planName: "Essencial", responsible: "Rafael Lima", priority: "alta", status: "concluido", type: "conteudo",
    startDate: "2026-03-05", dueDate: "2026-03-15",
    subtasks: [], checklist: [], comments: [], history: [],
  },
  {
    id: "t5", title: "Reunião de alinhamento", description: "Call mensal com Innova", clientId: "4", clientName: "Innova Corp",
    planName: "Pro", responsible: "Marina Souza", priority: "media", status: "pendente", type: "reuniao",
    dueDate: "2026-03-22",
    subtasks: [], checklist: [], comments: [], history: [],
  },
  {
    id: "t6", title: "Gestão de tráfego (Meta Ads)", description: "Monitoramento", clientId: "2", clientName: "Nova Digital",
    planName: "Essencial", responsible: "Juliana Costa", priority: "alta", status: "em_andamento", type: "trafego",
    startDate: "2026-03-01", dueDate: "2026-03-31",
    subtasks: [], checklist: [], comments: [], history: [],
  },
  {
    id: "t7", title: "Identidade visual completa", description: "Rebranding", clientId: "3", clientName: "Startup Labs",
    projectId: "p1", responsible: "Ana Silva", priority: "urgente", status: "pausado", type: "design",
    startDate: "2026-03-01", dueDate: "2026-03-25",
    subtasks: [
      { id: "st4", title: "Pesquisa de referências", status: "concluido" },
      { id: "st5", title: "Moodboard", status: "concluido" },
      { id: "st6", title: "Proposta de marca", status: "pausado" },
    ],
    checklist: [], comments: [], history: [],
  },
];
