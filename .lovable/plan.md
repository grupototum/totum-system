

## Gerenciamento de Administradores

### Situacao Atual

O sistema tem dois mecanismos de "admin":

1. **`user_roles` (banco/RLS)**: tabela com enum `app_role` (`admin`, `diretor`, `user`). Usada pela funcao `is_admin()` nas policies RLS para controlar acesso a dados sensiveis (company_settings, system_settings, etc).

2. **`roles` (cargos/frontend)**: tabela com nome e permissoes JSONB. O campo `profiles.role_id` referencia um cargo. O frontend verifica `profile.roles.name === "admin"` para liberar menus como Admin Settings.

**Problema**: Nao ha UI para gerenciar a tabela `user_roles`. Promover alguem a admin requer SQL direto ou a edge function `bootstrap-admin`.

### Plano: Adicionar toggle de Admin na pagina de Permissoes

**Onde**: Pagina `/usuarios`, na aba de usuarios, dentro do dropdown de acoes de cada usuario (ou no dialog de edicao).

**O que fazer**:

1. **Buscar role de admin do usuario** -- ao carregar perfis, tambem consultar `user_roles` para saber se cada usuario tem role `admin`.

2. **Adicionar toggle/botao na UI** -- no dropdown de acoes do usuario na pagina de Permissoes, adicionar opcao "Promover a Admin" / "Remover Admin" que insere ou remove o registro em `user_roles`.

3. **Restricao**: apenas quem ja e admin pode fazer essa operacao (a RLS de `user_roles` ja garante isso).

### Arquivos a modificar

- **`src/hooks/useProfiles.ts`**: adicionar funcao para buscar e gerenciar `user_roles` (insert/delete role admin)
- **`src/pages/UsersPermissions.tsx`**: adicionar opcao no dropdown de acoes do usuario para promover/remover admin

### Complexidade
Baixa -- sao ~30 linhas de codigo novo. As policies RLS ja existem e protegem a operacao.

