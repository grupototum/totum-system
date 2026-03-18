

## Plano: Tornar o nome do usuário no sidebar clicável para Configurações

No `src/components/layout/AppSidebar.tsx`, envolver o bloco do footer (avatar + nome) com um `Link` do React Router apontando para `/configuracoes`, adicionando cursor pointer e hover effect.

### Alteração única:
- **`AppSidebar.tsx`**: Importar `Link` de `react-router-dom` e envolver o `div` dentro do `SidebarFooter` com `<Link to="/configuracoes">`, adicionando classes de hover (`hover:bg-white/[0.06] rounded-lg transition-colors`).

