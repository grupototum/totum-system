## Objetivo
Padronizar a ordenação dos anexos da tarefa com opções "Mais recentes" (padrão), "Mais antigos", "Nome A→Z" e "Nome Z→A", persistindo a preferência do usuário.

## Mudanças

### `src/components/tasks/TaskAnexos.tsx`
- Importar `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` de `@/components/ui/select`.
- Novo tipo: `type SortKey = 'recent' | 'oldest' | 'name_asc' | 'name_desc'`.
- Novo estado `sortBy` inicializado a partir de `localStorage.getItem('task-anexos-sort')` (fallback: `'recent'`).
- `useEffect` que persiste `sortBy` em localStorage quando muda.
- Atualizar o `useMemo` `filtered` para também ordenar:
  - `recent`: `created_at` desc
  - `oldest`: `created_at` asc
  - `name_asc` / `name_desc`: `localeCompare(pt-BR, { numeric: true, sensitivity: 'base' })`
- Renomear conceito mantendo o nome `filtered` (já que aplica filtro+ordem).
- Layout do bloco de busca: transformar em `flex gap-2`. Manter `Input` ocupando o espaço (`flex-1`) e adicionar à direita um `Select` (largura ~180px) com label visual via ícone `solar:sort-vertical-linear`.
- Itens do Select: rótulos em PT-BR conforme acima.

### Outras considerações
- O lightbox usa `filtered` como fonte → respeitará a nova ordem automaticamente.
- A "Selecionar todos" continua marcando os mesmos itens (a ordem visual muda, a seleção por id permanece).
- Sem mudanças em hook/banco/migrations.

## Fora de escopo
- Não alterar a ordenação do histórico (continua mais recente primeiro).
- Sem botão para alternar direção isolada — direção já está embutida nas opções.