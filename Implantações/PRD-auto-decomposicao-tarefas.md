# PRD — Auto-Decomposição de Tarefas com IA (estilo Brevl)

> **Status:** Planejamento · Aguardando decisão do Rael nas perguntas em aberto (Seção 8)
> **Rodada sugerida:** Rodada 2 (pós-ALICERCE)
> **Autoria:** Paulo (agente) · 2026-08-15

---

## 1. Objetivo e Problema

**Problema:** Criar um conjunto de tarefas estruturado para um projeto/entrega nova exige que o responsável pense em escopo, dependências e sequência manualmente — processo lento e sujeito a inconsistências.

**Objetivo:** Permitir que o usuário descreva um objetivo em linguagem natural (ex: *"Criar campanha de lançamento do produto X para outubro"*) e o Totum gere automaticamente um plano de tarefas estruturado — com fases, subtarefas, dependências e estimativas — que o time começa a executar imediatamente.

**Referência de mercado:** Brevl (`brevl.co`) — tagline *"Break Down Any Task, Get It Done For You"* — valida a demanda: usuários querem descrever um objetivo e receber um plano executável, não construir o plano peça por peça.

**Diferencial para o Totum:** A Totum já tem contexto rico (clientes, contratos, planos, responsáveis, SLAs). A decomposição pode ser contextualizada para o cliente/contrato em questão, não genérica — isso é vantagem estrutural sobre ferramentas de propósito geral como Brevl.

---

## 2. Contexto Técnico Atual

### O que o schema já cobre (não precisa criar)

| Estrutura | Tabela/Campo | Observação |
|---|---|---|
| Tarefas principais | `tasks` | Completo — inclui `parent_task_id`, `estimated_minutes`, `priority`, `responsible_id`, `due_date` |
| Subtarefas leves | `subtasks` | Existe: `task_id`, `title`, `status`, `responsible_id`, `sort_order`, `due_date` |
| Subtarefas jsonb | `tasks.subtasks` | Campo jsonb inline — alternativa mais leve para checklists simples |
| Dependências | `task_dependencies` | Existe: `task_id → depends_on_task_id`, com `project_id` e RLS |
| Geração de tarefas | `supabase/functions/generate-tasks/` | Existe, mas é geração de tarefas recorrentes por plano/contrato — lógica diferente |
| API externa | `/api/tarefas` | REST com auth por `totum_sk_*` — pode ser usada por agentes externos |

### O que está faltando para o feature funcionar

1. **Conceito de "Fase"** — não existe no schema. Hoje `task_dependencies` modela dependências entre tarefas individuais, mas não há agrupamento semântico em fases/etapas dentro de um projeto.
2. **Edge function de decomposição com LLM** — não existe `decompose-task` ou equivalente.
3. **UI de revisão pré-confirmação** — o usuário precisa ver, editar e aprovar o plano antes da criação atômica das tarefas.
4. **Visualização de grafo de dependências** — ausente (mas ReactFlow já está no `package.json`).

---

## 3. Escopo por Versão

### V1 — Wizard sem grafo visual (recomendado para validação)

**Objetivo:** Validar adoção antes de investir no visual. Entrega funcional que já resolve o problema.

**Fluxo:**
1. Usuário abre modal "Decompor com IA" em `TaskFormDialog` ou botão novo em `TaskDashboard`
2. Preenche: objetivo (texto livre) + contexto opcional (cliente, projeto, prazo, responsável padrão)
3. Backend chama LLM → retorna JSON estruturado com fases, tarefas e dependências
4. UI exibe preview em lista agrupada por fase — editável inline (títulos, responsáveis, datas)
5. Usuário confirma → criação atômica de todas as tarefas/subtarefas/dependências em uma única transação
6. Tarefa pai (objetivo) referencia todas as filhas via `parent_task_id`

**O que esta versão NÃO faz:** grafo visual de dependências, reordenação por drag-and-drop no preview, sugestão automática de responsável por skill.

### V2 — Grafo visual de dependências

**Objetivo:** Experiência completa para projetos complexos (múltiplas fases, dependências cruzadas).

**Fluxo adicional sobre V1:**
- Preview usa ReactFlow em vez de lista (já disponível no workspace)
- Nós editáveis diretamente no canvas
- Arrows representam `task_dependencies`
- Export do grafo como imagem para relatórios/apresentações ao cliente

---

## 4. Critérios de Aceitação

### V1

- [ ] Usuário descreve um objetivo em até 500 caracteres e recebe um plano em < 8 segundos
- [ ] O plano retornado tem: mínimo 3 e máximo 30 tarefas, agrupadas em 1–6 fases
- [ ] Cada tarefa no plano tem: título, fase, estimativa de horas, prioridade, `depends_on` (lista de índices de outras tarefas na resposta)
- [ ] Usuário pode editar qualquer campo do preview antes de confirmar
- [ ] Confirmação cria todas as tarefas em transação única (tudo ou nada — sem criar parcialmente)
- [ ] Tarefas criadas aparecem na tela de tarefas com filtro de projeto/fase aplicado automaticamente
- [ ] Em caso de falha da LLM, mensagem de erro clara sem dados parciais gravados

### V2 (incremental sobre V1)

- [ ] Preview em ReactFlow com nós e arestas correspondendo ao plano
- [ ] Edição de nós inline no canvas sincroniza com dados que serão criados
- [ ] Zoom, pan e layout automático (dagre ou ELK)

---

## 5. Schema — Mudanças Necessárias

### Opção A: Fase como tag/campo em `tasks` (mínimo)

```sql
ALTER TABLE totum_system.tasks
  ADD COLUMN phase_name text,         -- "Fase 1 - Planejamento", etc.
  ADD COLUMN phase_order integer;     -- para ordenação de fases
```

**Prós:** sem nova tabela, sem nova FK, retrocompatível.
**Contras:** fases não têm identidade própria (sem datas de fase, sem status de fase).

### Opção B: Tabela `task_phases` (completa)

```sql
CREATE TABLE totum_system.task_phases (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    uuid REFERENCES totum_system.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  name          text NOT NULL,
  description   text,
  sort_order    integer DEFAULT 0 NOT NULL,
  status        totum_system.task_status DEFAULT 'pendente',
  start_date    date,
  due_date      date,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE totum_system.tasks
  ADD COLUMN phase_id uuid REFERENCES totum_system.task_phases(id) ON DELETE SET NULL;
```

**Prós:** fases são cidadãos de primeira classe, têm datas e status, podem ter visualização própria futuramente.
**Contras:** migration mais invasiva, RLS precisa ser adicionada à nova tabela.

**Recomendação:** Opção A para V1 (valida o conceito sem schema invasivo), migrar para Opção B em V2 se adoção confirmar o valor.

---

## 6. Arquitetura da Edge Function

### Nova function: `supabase/functions/decompose-task/index.ts`

**Input (POST):**
```json
{
  "goal": "Criar campanha de lançamento do produto X para outubro",
  "context": {
    "client_id": "uuid",
    "project_id": "uuid",       // opcional
    "deadline": "2026-10-31",   // opcional
    "responsible_id": "uuid",   // opcional — responsável padrão para tarefas
    "max_tasks": 20             // opcional, default 15
  }
}
```

**Autenticação:** JWT do usuário (igual às outras edges protegidas) — `organization_id` derivado do JWT, nunca do body.

**Resposta (preview — ainda não grava nada):**
```json
{
  "phases": [
    {
      "name": "Planejamento",
      "order": 1,
      "tasks": [
        {
          "index": 0,
          "title": "Definir público-alvo da campanha",
          "description": "...",
          "estimated_hours": 2,
          "priority": "alta",
          "depends_on": [],
          "phase_order": 1
        },
        {
          "index": 1,
          "title": "Aprovar briefing com cliente",
          "estimated_hours": 1,
          "priority": "alta",
          "depends_on": [0]
        }
      ]
    }
  ],
  "total_estimated_hours": 24,
  "warning": null
}
```

**Endpoint de confirmação separado:** `POST /decompose-task/confirm` — recebe o payload editado + `context`, grava tudo em transação. Separar preview de gravação evita criações acidentais e permite que o usuário edite o preview sem precisar chamar a LLM de novo.

### Prompt de sistema (rascunho)

```
Você é um especialista em gestão de projetos. Dado um objetivo e contexto,
decomponha em fases e tarefas concretas e executáveis.

Regras:
- Máximo {max_tasks} tarefas no total
- Cada tarefa deve ter: título (< 80 chars), estimativa em horas (0.5 a 40),
  prioridade (baixa/media/alta/urgente), lista depends_on (índices 0-based)
- Agrupe em 1 a 6 fases com nomes descritivos
- depends_on só pode referenciar índices de tarefas anteriores (sem ciclos)
- Retorne APENAS JSON válido seguindo o schema fornecido
- Idioma: português brasileiro

Schema de resposta: {schema}
```

---

## 7. Estimativa de Esforço

| Item | V1 (sem grafo) | V2 (com grafo) |
|---|---|---|
| Schema (fase como campo) | 0.5 dia | +1 dia (tabela task_phases) |
| Edge function `decompose-task` | 1.5 dias | — |
| Endpoint `/confirm` + transação | 1 dia | — |
| UI — modal wizard + preview em lista | 2 dias | — |
| UI — ReactFlow preview | — | 3 dias |
| Testes + ajustes de prompt | 1 dia | 0.5 dia |
| **Total estimado** | **~6 dias** | **+4–5 dias** |

Referência anterior: 5–7 dias para V1 sem grafo confirma esta estimativa.

---

## 8. Perguntas em Aberto — Decisão do Rael

> Estas perguntas mudam decisões de arquitetura irreversíveis. Não implementar antes de resposta.

### P1: Uso interno do time vs. uso pelos clientes finais

**Opção A — Só uso interno (equipe da Totum e clientes-operadores):**
- Chave de API da Totum centralizada
- Custo de LLM é custo operacional da Totum
- Limites de uso por organização simples (rate limit na edge function)
- Modelo de preço: incluso no plano do cliente ou add-on

**Opção B — Clientes finais usam diretamente pelo produto:**
- Cada cliente usa contra quota própria
- Requer tracking de uso por `organization_id` e cobrança
- Interface de configuração de limite de calls por mês por plano
- Complexidade maior — billing por uso

**Recomendação:** Opção A para V1. Valida o produto com zero infra de billing adicional. Se adoção confirmar valor, migrar para Opção B em V2 com modelo de créditos.

---

### P2: Chave de API — centralizada da Totum vs. BYOK

**Opção A — Chave centralizada da Totum:**
- Totum paga diretamente pela API da Anthropic/OpenAI
- Controle total de qual modelo usar e custo por call
- Risco: custo escala com uso dos clientes
- Simples: uma `ANTHROPIC_API_KEY` nas env vars da edge function

**Opção B — BYOK (Bring Your Own Key):**
- Cada organização configura sua própria chave nas settings
- Custo de LLM é do cliente
- Mais complexo: interface de settings, validação de chave, handling de erros específicos por provider
- Permite que clientes escolham modelo (GPT-4, Claude, etc.)

**Recomendação:** Opção A para V1. BYOK é funcionalidade de empresa mid-market — para a base de clientes atual, chave centralizada é mais simples e não afeta a percepção de valor. Revisar quando custo mensal de LLM superar R$500/mês.

---

### P3: Modelo de LLM

Se decisão for chave centralizada (P2-A):

- **Claude Sonnet 4.6** (padrão): melhor custo/benefício, output JSON confiável, suporta prompt caching
- **GPT-4o mini**: alternativa mais barata se volume for alto
- **Claude Haiku 4.5**: opção para calls de baixo custo/alta frequência

**Recomendação:** Começar com Claude Sonnet 4.6 + prompt caching nas instruções de sistema (reduz ~80% do custo em chamadas repetidas). Benchmark contra GPT-4o mini se custo virar concern.

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| LLM retorna JSON inválido/malformado | Média | Alto (UI quebra) | Validação de schema Zod antes de mostrar preview; fallback com mensagem de erro |
| LLM cria dependências circulares | Baixa | Alto (transação falha) | Validar DAG no backend antes de gravar |
| Custo de LLM inesperadamente alto | Média | Médio | Rate limit por org: max 20 chamadas/dia em V1; prompt caching no system prompt |
| Usuário confirma plano ruim sem revisar | Alta | Baixo | Preview obrigatório antes de confirmar; botão "Regenerar" no preview |
| Conflito com roadmap ALICERCE | Alto | Alto | Feature é Rodada 2 — não iniciar antes de fechar itens do ALICERCE |
| Fases não retrocompatíveis com tarefas existentes | Baixa | Médio | Opção A (campo `phase_name` nullable) é retrocompatível por design |

---

## 10. Referência Brevl — O Que Foi Extraído

> **Nota:** O site `brevl.co` é inteiramente JavaScript-renderizado e não expôs conteúdo via extração estática. O que segue é o que foi possível inferir do tagline público e contexto geral do produto:

**Confirmado pelo tagline:** *"Break Down Any Task, Get It Done For You"* — foco em decomposição + execução, não só planejamento.

**Inferido do posicionamento:**
- Input: objetivo em linguagem natural
- Output: plano estruturado em passos executáveis
- Diferencial aparente: execução assistida por IA, não só geração do plano

**Gap do Totum vs. Brevl:** Brevl parece focar em tarefas individuais/pessoais. O Totum tem contexto de gestão de agência (múltiplos clientes, contratos, SLA, equipes) — a decomposição contextualizada é vantagem diferenciadora que o Brevl não tem.

**Para o PRD pós-V1:** Se a Rael quiser o link de suporte do Brevl revisado manualmente, a URL `https://www.brevl.co/support` pode ser acessada no browser normal — o conteúdo não está acessível via scraping automático por ser SPA.

---

## 11. Ordem de Execução Recomendada (V1)

```
1. Decisão das 3 perguntas em aberto (Seção 8) — bloqueante
2. Migration: adicionar phase_name + phase_order em tasks
3. Edge function decompose-task (preview) — sem gravação
4. Edge function decompose-task/confirm — transação atômica
5. UI: botão "Decompor com IA" em TaskDashboard/TaskFormDialog
6. UI: modal wizard (input → loading → preview em lista editável → confirmar)
7. Testes manuais com 10 objetivos reais de clientes da Totum
8. Ajuste de prompt com base nos resultados dos testes
9. Deploy e comunicado interno ao time
```

---

## 12. Definição de "Pronto" para V1

- [ ] 10 objetivos diferentes testados manualmente — plano gerado é coerente e editável
- [ ] Confirmação cria tarefas sem erro em 100% dos casos testados
- [ ] Tarefas aparecam corretamente no TaskDashboard agrupadas por fase
- [ ] Falha de LLM não deixa dados parciais no banco
- [ ] Documentado em `docs/` como usar (1 página)
- [ ] Custo por call medido e documentado

---

*Próximo passo: Rael responder às 3 perguntas da Seção 8 para desbloquear implementação.*
