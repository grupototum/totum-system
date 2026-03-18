

## Problema

A página `/usuarios` (Usuários e Permissões) não tem suporte ao modo demo. Os hooks `useProfiles`, `useRoles`, `useAuditLogs`, e `useUserRoles` sempre consultam o banco de dados real, sem verificar `isDemoMode`. Quando o modo demo está ativo, a página deveria exibir dados fictícios como as demais páginas fazem.

## Solução

### 1. Adicionar dados demo em `src/data/demoData.ts`

Criar dados fictícios para:
- `demoProfilesList` — 5-6 perfis fictícios (Ana Silva, Carlos Souza, etc.) com roles e departments
- `demoRolesList` — 3-4 cargos fictícios (Administrador, Gestor, Analista, Estagiário)
- `demoAuditLogsList` — 5-6 registros de auditoria fictícios

### 2. Atualizar `src/hooks/useProfiles.ts`

Em cada hook (`useProfiles`, `useRoles`, `useAuditLogs`, `useUserRoles`):
- Importar `useDemo` e os dados demo
- No `fetch`, se `isDemoMode`, retornar dados fictícios em vez de consultar o banco
- Em mutations (`updateProfile`, `toggleAdmin`, etc.), se `isDemoMode`, exibir toast "Modo Demo — Ação simulada" e retornar `true`

### 3. Atualizar `src/pages/UsersPermissions.tsx`

- Nas ações de CRUD (criar usuário, editar role, resetar senha, etc.), verificar `isDemoMode` e simular a ação com toast informativo em vez de chamar o banco

### Arquivos a modificar
- `src/data/demoData.ts` — adicionar dados demo de profiles, roles e audit logs
- `src/hooks/useProfiles.ts` — adicionar suporte a isDemoMode nos 4 hooks
- `src/pages/UsersPermissions.tsx` — proteger ações diretas (reset senha, copiar link, etc.)

