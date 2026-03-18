

## Filtro de Data Personalizado no Dashboard Executivo

### Situação Atual
O dashboard usa um `Select` com os últimos 12 meses fixos. O hook `useExecutiveDashboard` recebe um `period` no formato `YYYY-MM` e filtra por mês.

### Plano

**1. Adicionar opção "Personalizado" ao seletor de período**

No `ExecutiveDashboard.tsx`, adicionar uma opção "Personalizado" ao Select existente. Quando selecionada, exibir dois DatePickers (data início e data fim) usando o Popover + Calendar do shadcn.

**2. Atualizar o hook `useExecutiveDashboard`**

Modificar para aceitar um objeto de período com `startDate` e `endDate` (strings ISO) em vez de apenas `YYYY-MM`. Quando um intervalo customizado for passado, usar essas datas diretamente nas queries ao banco.

**3. Componentes necessários**
- Reutilizar `Popover`, `Calendar`, `Button` já existentes no projeto
- Usar `date-fns` (já disponível via shadcn calendar) para formatação

**4. UX**
- O Select mantém as opções de meses rápidos + "Personalizado"
- Ao selecionar "Personalizado", aparece uma linha com dois date pickers lado a lado: "De" e "Até"
- Os dados do dashboard atualizam automaticamente ao selecionar as duas datas

### Arquivos a modificar
- `src/pages/ExecutiveDashboard.tsx` — adicionar UI dos date pickers e lógica de período customizado
- `src/hooks/useExecutiveDashboard.ts` — aceitar `startDate`/`endDate` e ajustar queries
- `src/components/dashboard/RevenueChart.tsx` — opcionalmente aceitar período para filtrar o gráfico

