import { LucideIcon } from "lucide-react";
import { RegistryColumn, RegistryItem } from "./RegistryTable";
import { FormField } from "./RegistryFormDialog";

export interface RegistryConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
  columns: RegistryColumn[];
  formFields: FormField[];
  initialData: RegistryItem[];
}

export interface RegistryGroup {
  key: string;
  label: string;
  icon: string;
  registries: RegistryConfig[];
}

const statusColumn: RegistryColumn = {
  key: "status",
  label: "Status",
  render: (value: string) => (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
        value === "ativo"
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-white/[0.06] text-muted-foreground/70 border-border"
      }`}
    >
      {value}
    </span>
  ),
};

export const registryGroups: RegistryGroup[] = [
  {
    key: "financeiro",
    label: "Cadastros Financeiros",
    icon: "DollarSign",
    registries: [
      {
        key: "bancos",
        label: "Bancos",
        description: "Cadastro de instituições financeiras",
        icon: "Building2",
        columns: [
          { key: "name", label: "Nome" },
          { key: "codigo", label: "Código", className: "font-heading" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome do Banco", type: "text", required: true, placeholder: "Ex: Banco do Brasil" },
          { key: "codigo", label: "Código", type: "text", placeholder: "Ex: 001" },
        ],
        initialData: [
          { id: "b1", name: "Banco do Brasil", codigo: "001", status: "ativo" },
          { id: "b2", name: "Itaú Unibanco", codigo: "341", status: "ativo" },
          { id: "b3", name: "Bradesco", codigo: "237", status: "ativo" },
          { id: "b4", name: "Nubank", codigo: "260", status: "ativo" },
        ],
      },
      {
        key: "contas_bancarias",
        label: "Contas Bancárias",
        description: "Contas da agência vinculadas a bancos",
        icon: "Wallet",
        columns: [
          { key: "name", label: "Apelido" },
          { key: "banco", label: "Banco" },
          { key: "agencia", label: "Agência", className: "font-heading" },
          { key: "conta", label: "Conta", className: "font-heading" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Apelido da Conta", type: "text", required: true, placeholder: "Ex: Conta Principal" },
          { key: "banco", label: "Banco", type: "select", options: [
            { label: "Banco do Brasil", value: "Banco do Brasil" },
            { label: "Itaú Unibanco", value: "Itaú Unibanco" },
            { label: "Bradesco", value: "Bradesco" },
            { label: "Nubank", value: "Nubank" },
          ]},
          { key: "agencia", label: "Agência", type: "text", placeholder: "0001" },
          { key: "conta", label: "Conta", type: "text", placeholder: "12345-6" },
        ],
        initialData: [
          { id: "cb1", name: "Conta Principal", banco: "Itaú Unibanco", agencia: "1234", conta: "56789-0", status: "ativo" },
          { id: "cb2", name: "Conta Reserva", banco: "Nubank", agencia: "0001", conta: "98765-4", status: "ativo" },
        ],
      },
      {
        key: "formas_pagamento",
        label: "Formas de Pagamento",
        description: "Meios de pagamento aceitos",
        icon: "CreditCard",
        columns: [
          { key: "name", label: "Nome" },
          { key: "tipo", label: "Tipo" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Pix" },
          { key: "tipo", label: "Tipo", type: "select", options: [
            { label: "À vista", value: "avista" },
            { label: "Parcelado", value: "parcelado" },
            { label: "Recorrente", value: "recorrente" },
          ]},
        ],
        initialData: [
          { id: "fp1", name: "Pix", tipo: "À vista", status: "ativo" },
          { id: "fp2", name: "Boleto Bancário", tipo: "À vista", status: "ativo" },
          { id: "fp3", name: "Cartão de Crédito", tipo: "Parcelado", status: "ativo" },
          { id: "fp4", name: "Transferência", tipo: "À vista", status: "ativo" },
        ],
      },
      {
        key: "centros_custo",
        label: "Cadastro de Custo",
        description: "Agrupamento de custos por área ou finalidade",
        icon: "Target",
        columns: [
          { key: "name", label: "Nome" },
          { key: "categoria", label: "Categoria" },
          { key: "natureza", label: "Natureza" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Marketing" },
          { key: "categoria", label: "Categoria", type: "text", placeholder: "Ex: Operacional" },
          { key: "natureza", label: "Natureza", type: "select", options: [
            { label: "Fixo", value: "fixo" },
            { label: "Variável", value: "variavel" },
          ], required: true },
          { key: "metodo_pagamento", label: "Método de Pagamento", type: "select", options: [
            { label: "À vista", value: "avista" },
            { label: "Parcelado", value: "parcelado" },
          ]},
          { key: "parcelas", label: "Parcelas", type: "number", placeholder: "1" },
          { key: "intervalo", label: "Intervalo (meses)", type: "number", placeholder: "1" },
          { key: "descricao", label: "Descrição", type: "textarea", placeholder: "Descreva o custo..." },
        ],
        initialData: [],
      },
      {
        key: "categorias_financeiras",
        label: "Categorias Financeiras",
        description: "Classificação de transações financeiras",
        icon: "FolderOpen",
        columns: [
          { key: "name", label: "Nome" },
          { key: "tipo", label: "Tipo" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Software & SaaS" },
          { key: "tipo", label: "Tipo", type: "select", options: [
            { label: "Receita", value: "receita" },
            { label: "Despesa", value: "despesa" },
            { label: "Ambos", value: "ambos" },
          ]},
        ],
        initialData: [
          { id: "cf1", name: "Software & SaaS", tipo: "Despesa", status: "ativo" },
          { id: "cf2", name: "Folha de Pagamento", tipo: "Despesa", status: "ativo" },
          { id: "cf3", name: "Serviços Recorrentes", tipo: "Receita", status: "ativo" },
          { id: "cf4", name: "Projetos Pontuais", tipo: "Receita", status: "ativo" },
        ],
      },
      {
        key: "tipos_receita",
        label: "Tipos de Receita",
        description: "Classificação das fontes de receita",
        icon: "TrendingUp",
        columns: [
          { key: "name", label: "Nome" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Fee Mensal" },
          { key: "descricao", label: "Descrição", type: "textarea", placeholder: "Descreva..." },
        ],
        initialData: [
          { id: "tr1", name: "Fee Mensal", descricao: "Receita recorrente de contratos", status: "ativo" },
          { id: "tr2", name: "Projeto Pontual", descricao: "Receita de projetos avulsos", status: "ativo" },
          { id: "tr3", name: "Consultoria", descricao: "Receita de consultorias", status: "ativo" },
        ],
      },
      {
        key: "tipos_despesa",
        label: "Tipos de Despesa",
        description: "Classificação de despesas por recorrência",
        icon: "TrendingDown",
        columns: [
          { key: "name", label: "Nome" },
          { key: "recorrencia", label: "Recorrência" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Aluguel" },
          { key: "natureza", label: "Natureza", type: "select", options: [
            { label: "Fixo", value: "fixo" },
            { label: "Variável", value: "variavel" },
          ], required: true },
          { key: "recorrencia", label: "Recorrência", type: "select", required: true, options: [
            { label: "Recorrente", value: "recorrente" },
            { label: "Única", value: "unica" },
            { label: "Parcelada", value: "parcelada" },
          ]},
        ],
        initialData: [
          { id: "td1", name: "Aluguel", recorrencia: "Recorrente", status: "ativo" },
          { id: "td2", name: "Equipamentos", recorrencia: "Parcelada", status: "ativo" },
          { id: "td3", name: "Freelancers", recorrencia: "Única", status: "ativo" },
        ],
      },
    ],
  },
  {
    key: "comercial",
    label: "Clientes e Comercial",
    icon: "Users",
    registries: [
      {
        key: "tipos_cliente",
        label: "Tipos de Cliente",
        description: "Segmentação de clientes",
        icon: "UserCheck",
        columns: [
          { key: "name", label: "Nome" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Varejo" },
          { key: "descricao", label: "Descrição", type: "textarea", placeholder: "Descreva..." },
        ],
        initialData: [
          { id: "tc1", name: "Varejo", descricao: "Lojas e comércio", status: "ativo" },
          { id: "tc2", name: "SaaS/Tech", descricao: "Empresas de tecnologia", status: "ativo" },
          { id: "tc3", name: "Serviços Profissionais", descricao: "Escritórios e consultorias", status: "ativo" },
          { id: "tc4", name: "Indústria", descricao: "Fabricantes e indústrias", status: "ativo" },
        ],
      },
      {
        key: "status_cliente",
        label: "Status de Cliente",
        description: "Estágios do ciclo de vida do cliente",
        icon: "Activity",
        columns: [
          { key: "name", label: "Nome" },
          { key: "cor", label: "Cor", render: (v: string) => (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: v }} />
              <span className="font-heading text-xs text-muted-foreground">{v}</span>
            </div>
          )},
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Ativo" },
          { key: "cor", label: "Cor", type: "color" },
        ],
        initialData: [
          { id: "sc1", name: "Ativo", cor: "#22c55e", status: "ativo" },
          { id: "sc2", name: "Pausado", cor: "#f59e0b", status: "ativo" },
          { id: "sc3", name: "Cancelado", cor: "#ef4444", status: "ativo" },
          { id: "sc4", name: "Em Prospecção", cor: "#3b82f6", status: "ativo" },
        ],
      },
      {
        key: "tipos_contrato",
        label: "Tipos de Contrato",
        description: "Modalidades contratuais",
        icon: "FileSignature",
        columns: [
          { key: "name", label: "Nome" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Fee Mensal" },
          { key: "descricao", label: "Descrição", type: "textarea", placeholder: "Descreva..." },
        ],
        initialData: [
          { id: "tco1", name: "Fee Mensal", descricao: "Contrato recorrente mensal", status: "ativo" },
          { id: "tco2", name: "Projeto", descricao: "Contrato por projeto", status: "ativo" },
          { id: "tco3", name: "Avulso", descricao: "Serviço avulso sem contrato", status: "ativo" },
        ],
      },
      {
        key: "planos_recorrentes",
        label: "Pacotes",
        description: "Pacotes de serviço com entregas definidas",
        icon: "RefreshCw",
        columns: [
          { key: "name", label: "Nome" },
          { key: "valor", label: "Valor", render: (v: string) => <span className="font-heading">R$ {v}</span> },
          { key: "entregas", label: "Entregas" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome do Pacote", type: "text", required: true, placeholder: "Ex: Pacote Essencial" },
          { key: "value", label: "Valor de Referência", type: "number", placeholder: "0,00" },
          { key: "entregas", label: "Entregas Incluídas", type: "textarea", placeholder: "Liste as entregas do pacote..." },
        ],
        initialData: [
          { id: "pr1", name: "Essencial", valor: "4.800", entregas: "3 artes, gestão de tráfego, relatório", status: "ativo" },
          { id: "pr2", name: "Pro", valor: "7.600", entregas: "6 artes, tráfego, relatório, reunião", status: "ativo" },
          { id: "pr3", name: "Premium", valor: "12.500", entregas: "8 artes, tráfego, vídeo, relatório, reunião, otimização", status: "ativo" },
        ],
      },
      {
        key: "tipos_projeto",
        label: "Tipos de Projeto",
        description: "Categorias de projetos com tipo de serviço e receita",
        icon: "Briefcase",
        columns: [
          { key: "name", label: "Nome" },
          { key: "descricao", label: "Descrição" },
          { key: "tipo_servico_nome", label: "Tipo de Serviço" },
          { key: "tipo_receita_nome", label: "Tipo de Receita" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Landing Page" },
          { key: "descricao", label: "Descrição", type: "textarea" },
          { key: "tipo_servico", label: "Tipo de Serviço *", type: "select", required: true, sourceTable: "service_types", placeholder: "Selecione o tipo de serviço" },
          { key: "tipo_receita", label: "Tipo de Receita *", type: "select", required: true, sourceTable: "revenue_types", placeholder: "Selecione o tipo de receita" },
        ],
        initialData: [],
      },
      {
        key: "tipos_servico",
        label: "Tipos de Serviço",
        description: "Serviços oferecidos pela agência",
        icon: "Wrench",
        columns: [
          { key: "name", label: "Nome" },
          { key: "modalidade", label: "Modalidade" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Gestão de Redes Sociais" },
          { key: "modalidade", label: "Modalidade", type: "select", options: [
            { label: "Recorrente", value: "recorrente" },
            { label: "Projeto", value: "projeto" },
            { label: "Avulso", value: "avulso" },
          ]},
        ],
        initialData: [
          { id: "ts1", name: "Gestão de Redes Sociais", modalidade: "Recorrente", status: "ativo" },
          { id: "ts2", name: "Gestão de Tráfego", modalidade: "Recorrente", status: "ativo" },
          { id: "ts3", name: "Produção de Conteúdo", modalidade: "Recorrente", status: "ativo" },
          { id: "ts4", name: "Consultoria Estratégica", modalidade: "Avulso", status: "ativo" },
        ],
      },
      {
        key: "tipos_produto",
        label: "Tipos de Produto",
        description: "Categorização de produtos",
        icon: "Package",
        columns: [
          { key: "name", label: "Nome" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Pacote" },
          { key: "descricao", label: "Descrição", type: "textarea" },
        ],
        initialData: [
          { id: "tprod1", name: "Pacote", descricao: "Produto de assinatura mensal", status: "ativo" },
          { id: "tprod2", name: "Projeto Pontual", descricao: "Produto de venda única", status: "ativo" },
          { id: "tprod3", name: "Serviço Avulso", descricao: "Serviço sob demanda", status: "ativo" },
        ],
      },
    ],
  },
  {
    key: "categorias",
    label: "Categorias Gerais",
    icon: "Grid3X3",
    registries: [
      {
        key: "categorias_gerais",
        label: "Categorias Universais",
        description: "Categorias reutilizáveis para qualquer módulo do sistema",
        icon: "Tags",
        columns: [
          { key: "name", label: "Nome" },
          { key: "modulo", label: "Módulo" },
          { key: "cor", label: "Cor", render: (v: string) => (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: v }} />
            </div>
          )},
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Alta Prioridade" },
          { key: "modulo", label: "Módulo de Uso", type: "select", required: true, options: [
            { label: "Clientes", value: "clientes" },
            { label: "Produtos", value: "produtos" },
            { label: "Serviços", value: "servicos" },
            { label: "Despesas", value: "despesas" },
            { label: "Receitas", value: "receitas" },
            { label: "Projetos", value: "projetos" },
            { label: "Contratos", value: "contratos" },
            { label: "Tarefas", value: "tarefas" },
            { label: "Fornecedores", value: "fornecedores" },
          ]},
          { key: "cor", label: "Cor", type: "color" },
          { key: "descricao", label: "Descrição", type: "textarea", placeholder: "Descreva a finalidade..." },
        ],
        initialData: [
          { id: "cg1", name: "VIP", modulo: "Clientes", cor: "#f59e0b", descricao: "Clientes premium", status: "ativo" },
          { id: "cg2", name: "Alta Urgência", modulo: "Projetos", cor: "#ef4444", descricao: "Projetos urgentes", status: "ativo" },
          { id: "cg3", name: "Custo Fixo", modulo: "Despesas", cor: "#6366f1", descricao: "Despesas fixas mensais", status: "ativo" },
          { id: "cg4", name: "Digital", modulo: "Serviços", cor: "#3b82f6", descricao: "Serviços digitais", status: "ativo" },
          { id: "cg5", name: "Estratégico", modulo: "Clientes", cor: "#22c55e", descricao: "Clientes estratégicos", status: "ativo" },
        ],
      },
    ],
  },
  {
    key: "auxiliares",
    label: "Cadastros Auxiliares",
    icon: "Database",
    registries: [
      {
        key: "fornecedores",
        label: "Fornecedores",
        description: "Empresas e prestadores de serviço",
        icon: "Truck",
        columns: [
          { key: "name", label: "Nome" },
          { key: "servico", label: "Serviço" },
          { key: "contato", label: "Contato" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: StudioX" },
          { key: "servico", label: "Serviço Prestado", type: "text", placeholder: "Ex: Produção de vídeo" },
          { key: "contato", label: "Contato", type: "text", placeholder: "Email ou telefone" },
        ],
        initialData: [
          { id: "f1", name: "StudioX", servico: "Produção de vídeo", contato: "contato@studiox.com", status: "ativo" },
          { id: "f2", name: "PrintHouse", servico: "Impressão gráfica", contato: "vendas@printhouse.com", status: "ativo" },
        ],
      },
      {
        key: "parceiros",
        label: "Parceiros",
        description: "Parceiros estratégicos",
        icon: "Handshake",
        columns: [
          { key: "name", label: "Nome" },
          { key: "tipo", label: "Tipo de Parceria" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Google Partners" },
          { key: "tipo", label: "Tipo de Parceria", type: "text", placeholder: "Ex: Tecnologia" },
        ],
        initialData: [
          { id: "p1", name: "Google Partners", tipo: "Tecnologia", status: "ativo" },
          { id: "p2", name: "Meta Business", tipo: "Mídia", status: "ativo" },
        ],
      },
      {
        key: "departamentos",
        label: "Departamentos",
        description: "Setores internos da agência",
        icon: "Building",
        columns: [
          { key: "name", label: "Nome" },
          { key: "responsavel", label: "Responsável" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Criação" },
          { key: "responsavel", label: "Responsável", type: "text", placeholder: "Nome do gestor" },
        ],
        initialData: [
          { id: "d1", name: "Criação", responsavel: "Ana Silva", status: "ativo" },
          { id: "d2", name: "Tráfego", responsavel: "Juliana Costa", status: "ativo" },
          { id: "d3", name: "Desenvolvimento", responsavel: "Carlos Mendes", status: "ativo" },
          { id: "d4", name: "Atendimento", responsavel: "Marina Souza", status: "ativo" },
        ],
      },
      {
        key: "cargos",
        label: "Cargos",
        description: "Cargos da equipe",
        icon: "BadgeCheck",
        columns: [
          { key: "name", label: "Cargo" },
          { key: "departamento", label: "Departamento" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Cargo", type: "text", required: true, placeholder: "Ex: Diretor Criativo" },
          { key: "departamento", label: "Departamento", type: "select", options: [
            { label: "Criação", value: "Criação" },
            { label: "Tráfego", value: "Tráfego" },
            { label: "Desenvolvimento", value: "Desenvolvimento" },
            { label: "Atendimento", value: "Atendimento" },
          ]},
        ],
        initialData: [
          { id: "cg1", name: "Diretor Criativo", departamento: "Criação", status: "ativo" },
          { id: "cg2", name: "Gestor de Tráfego", departamento: "Tráfego", status: "ativo" },
          { id: "cg3", name: "Designer", departamento: "Criação", status: "ativo" },
          { id: "cg4", name: "Desenvolvedor", departamento: "Desenvolvimento", status: "ativo" },
        ],
      },
      {
        key: "tags",
        label: "Tags Gerais",
        description: "Etiquetas reutilizáveis em todo o sistema",
        icon: "Tag",
        columns: [
          { key: "name", label: "Nome" },
          { key: "cor", label: "Cor", render: (v: string) => (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: v }} />
              <span className="font-heading text-xs text-muted-foreground">{v}</span>
            </div>
          )},
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Urgente" },
          { key: "cor", label: "Cor", type: "color" },
        ],
        initialData: [
          { id: "t1", name: "Urgente", cor: "#ef4444", status: "ativo" },
          { id: "t2", name: "Recorrente", cor: "#3b82f6", status: "ativo" },
          { id: "t3", name: "VIP", cor: "#f59e0b", status: "ativo" },
          { id: "t4", name: "Novo", cor: "#22c55e", status: "ativo" },
        ],
      },
      {
        key: "prioridades",
        label: "Prioridades",
        description: "Níveis de prioridade para tarefas e projetos",
        icon: "AlertTriangle",
        columns: [
          { key: "name", label: "Nome" },
          { key: "nivel", label: "Nível", className: "font-heading" },
          { key: "cor", label: "Cor", render: (v: string) => (
            <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: v }} />
          )},
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Nome", type: "text", required: true, placeholder: "Ex: Crítica" },
          { key: "nivel", label: "Nível (1-5)", type: "number", placeholder: "1" },
          { key: "cor", label: "Cor", type: "color" },
        ],
        initialData: [
          { id: "pri1", name: "Baixa", nivel: "1", cor: "#6b7280", status: "ativo" },
          { id: "pri2", name: "Média", nivel: "2", cor: "#3b82f6", status: "ativo" },
          { id: "pri3", name: "Alta", nivel: "3", cor: "#f59e0b", status: "ativo" },
          { id: "pri4", name: "Urgente", nivel: "4", cor: "#ef4444", status: "ativo" },
          { id: "pri5", name: "Crítica", nivel: "5", cor: "#dc2626", status: "ativo" },
        ],
      },
      {
        key: "motivos_cancelamento",
        label: "Motivos de Cancelamento",
        description: "Razões para cancelamento de contratos",
        icon: "XCircle",
        columns: [
          { key: "name", label: "Motivo" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Motivo", type: "text", required: true, placeholder: "Ex: Insatisfação com resultados" },
          { key: "descricao", label: "Descrição", type: "textarea" },
        ],
        initialData: [
          { id: "mc1", name: "Insatisfação com resultados", descricao: "Cliente não viu ROI esperado", status: "ativo" },
          { id: "mc2", name: "Redução de orçamento", descricao: "Corte financeiro do cliente", status: "ativo" },
          { id: "mc3", name: "Migração de agência", descricao: "Cliente mudou para outra agência", status: "ativo" },
        ],
      },
      {
        key: "motivos_inadimplencia",
        label: "Motivos de Inadimplência",
        description: "Razões de atraso ou falta de pagamento",
        icon: "AlertOctagon",
        columns: [
          { key: "name", label: "Motivo" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Motivo", type: "text", required: true, placeholder: "Ex: Dificuldade financeira" },
          { key: "descricao", label: "Descrição", type: "textarea" },
        ],
        initialData: [
          { id: "mi1", name: "Dificuldade financeira", descricao: "Cliente com problemas de caixa", status: "ativo" },
          { id: "mi2", name: "Disputa de serviço", descricao: "Desacordo sobre entrega", status: "ativo" },
          { id: "mi3", name: "Erro administrativo", descricao: "Falha no processo de cobrança", status: "ativo" },
        ],
      },
      {
        key: "motivos_nao_entrega",
        label: "Motivos de Não Entrega",
        description: "Razões para entregas parciais ou não realizadas",
        icon: "PackageX",
        columns: [
          { key: "name", label: "Motivo" },
          { key: "descricao", label: "Descrição" },
          statusColumn,
        ],
        formFields: [
          { key: "name", label: "Motivo", type: "text", required: true, placeholder: "Ex: Material não fornecido pelo cliente" },
          { key: "descricao", label: "Descrição", type: "textarea" },
        ],
        initialData: [
          { id: "mne1", name: "Material não fornecido pelo cliente", descricao: "Dependência de conteúdo do cliente", status: "ativo" },
          { id: "mne2", name: "Sobrecarga da equipe", descricao: "Capacidade operacional excedida", status: "ativo" },
          { id: "mne3", name: "Alteração de escopo", descricao: "Mudança de direcionamento", status: "ativo" },
          { id: "mne4", name: "Problema técnico", descricao: "Falha em ferramentas ou plataformas", status: "ativo" },
        ],
      },
    ],
  },
];
