

## Plano: Tooltips explicativos em todos os indicadores do Dashboard Executivo

### O que será feito

Adicionar tooltips informativos (ícone `Info` ou `HelpCircle`) ao lado de cada indicador e seção do Dashboard Executivo, explicando em linguagem simples o que cada métrica significa.

### Indicadores que receberão tooltips

**Financeiros** (7 cards):
- **Faturamento** — Soma dos valores recebidos no período selecionado
- **MRR** — Receita Mensal Recorrente baseada nos contratos ativos
- **A receber** — Valores pendentes de pagamento pelos clientes
- **Em atraso** — Valores vencidos e não pagos
- **Despesas** — Total de custos e despesas pagas no período
- **Lucro bruto** — Faturamento menos despesas
- **Margem** — Percentual de lucro em relação ao faturamento

**Operacionais** (5 cards):
- **Total tarefas** — Quantidade total de tarefas cadastradas
- **Pendentes** — Tarefas que ainda não foram iniciadas
- **Concluídas** — Tarefas finalizadas
- **Atrasadas** — Tarefas com prazo vencido e não concluídas
- **Taxa conclusão** — Percentual de tarefas concluídas sobre o total

**Contratos** (3 cards):
- **Contratos ativos** — Número de contratos vigentes
- **Inadimplentes** — Contratos com parcelas em atraso
- **Cumprimento médio** — Média de entregas realizadas vs planejadas

**Estratégicos** (2 cards + seção):
- **Previsão de faturamento** — Estimativa baseada no MRR dos contratos ativos
- **Concentração de receita (HHI)** — Índice Herfindahl-Hirschman: mede dependência de poucos clientes. < 1.500 = diversificada, 1.500–2.500 = moderada, > 2.500 = alta concentração/risco

### Implementação técnica

**Arquivo:** `src/pages/ExecutiveDashboard.tsx`

1. Importar `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` e o ícone `HelpCircle`
2. Envolver o dashboard em `<TooltipProvider>`
3. Adicionar um mapa de tooltips (`Record<string, string>`) com a descrição de cada indicador
4. Em cada card, ao lado do label, renderizar um ícone `HelpCircle` pequeno (h-3 w-3) dentro de um `Tooltip` que exibe a explicação
5. Para os cards estratégicos (HHI, Previsão), adicionar tooltip inline ao lado do título

O estilo será discreto: ícone `HelpCircle` em `text-white/20 hover:text-white/50`, tooltip com fundo `bg-[#271c1d]` e texto `text-white/80`.

