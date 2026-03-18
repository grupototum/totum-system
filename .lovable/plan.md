

## Plano: Restaurar botão de editar em Projetos

### Situação atual

A página de Projetos (`src/pages/Projects.tsx`) só tem o botão "Novo Projeto". Os cards dos projetos não possuem nenhum botão de edição — o hook `useProjects` já tem a função `updateProject`, mas ela não está sendo usada na página.

O `ProjectFormDialog` também só suporta criação (título fixo "Novo Projeto", sem receber dados iniciais).

### O que será feito

1. **Adicionar botão de editar nos cards** — ícone `Pencil` no canto superior direito de cada card de projeto, ao lado do badge de status.

2. **Adaptar `ProjectFormDialog`** para suportar edição:
   - Receber prop opcional `initialData` (projeto existente)
   - Pré-preencher o formulário quando `initialData` estiver presente
   - Alterar título para "Editar Projeto" quando em modo edição
   - Chamar `updateProject` em vez de `addProject`

3. **Conectar na página** — estado `editingProject` para controlar qual projeto está sendo editado, passando para o dialog.

### Arquivos alterados

- `src/pages/Projects.tsx` — adicionar estado de edição, botão nos cards, passar `updateProject`
- `src/components/projects/ProjectFormDialog.tsx` — suportar prop `initialData` e modo edição

