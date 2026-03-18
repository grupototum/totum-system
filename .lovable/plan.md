

## Plano: Corrigir loading infinito no Dashboard Executivo

### Problema

O hook `useExecutiveDashboard` faz múltiplas queries ao banco (financial_entries, contracts, delivery_checklists, tasks, profiles) sem nenhum `try/catch`. Se qualquer query falhar (erro de permissão, rede, etc.), a função `fetchData` para de executar antes de chamar `setLoading(false)`, resultando no spinner infinito.

### Solução

Envolver todo o bloco de queries em `try/catch/finally` no hook `useExecutiveDashboard.ts`:

- **`try`**: mantém toda a lógica atual de fetch
- **`catch`**: loga o erro no console e define `data` com valores zerados para que a página renderize mesmo sem dados
- **`finally`**: garante que `setLoading(false)` seja sempre chamado

### Arquivo alterado

- `src/hooks/useExecutiveDashboard.ts` — adicionar try/catch/finally no `fetchData`

