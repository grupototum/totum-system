# TODO.md — Totum System
> Vibe Coding Totum v3.0 · Atualizado: 2026-05-07

## 🔴 BLOQUEADORES (resolver antes de qualquer release)

- [ ] **B-011** Ativar `noImplicitAny: true` no `tsconfig.app.json` progressivamente
  - Rodar `tsc --noEmit`, agrupar erros por pasta, corrigir em commits separados
- [ ] **B-012** Quebrar `AgenteDetail.tsx` (756 LOC) → `AgentCharts`, `AgentMetrics`, `AgentTabs` + `useAgentClassification`
- [ ] **B-013** Quebrar `sidebar.tsx` (637 LOC) → `SidebarLayout` + `NavGroup` + hook `useSidebarNav`
- [ ] **B-014** Quebrar `asaasService.ts` (615 LOC) — **⚠️ No-Fly Zone, aprovação obrigatória**

## 🔵 RODADA 2 (decisões já tomadas em 2026-08-10)

- [ ] React Router v6 → v7: as 2 CVEs moderadas de open-redirect (`GHSA-jjmj-jmhj-qwj2`, `GHSA-wrjc-x8rr-h8h6`) só têm fix a partir do 7.18. Decisão: aceitar o risco em v6 por ora, migração pra v7 fica pra uma rodada dedicada (breaking changes, não é bump de patch)
- [ ] Aplicar `supabase/patches/20260810_add_checklist_due_date.sql` e `20260810_add_task_participants.sql` em produção (Gate D — aguardando o Jarvis rodar via psql)
- [ ] Depois dos patches acima aplicados: frontend de checklist due_date (`taskData.ts`, `useSupabaseTasks.ts`, `TaskDetailDialog.tsx`) e UI de co-responsável/observador (`TaskFormDialog.tsx`, `TaskDetailDialog.tsx`)
- [ ] B-028 a B-034 (matriz de permissões / RLS sem checagem de role) — P0 quando Gate D permitir, ver `docs/PERMISSION_MATRIX.md`

## 🟡 ESTA SPRINT

- [ ] Regenerar types Supabase via MCP e remover `as any` em `TenantContext.tsx:52`
- [ ] Ativar `noImplicitAny: true` e corrigir erros emergentes em pequenos grupos

## 🟢 PRÓXIMAS SEMANAS

- [ ] **B-020** Responsividade em `DataImport.tsx` (`h-[400px]` → `h-[300px] md:h-[400px]`)
- [ ] **B-021** Substituir 11× `as unknown as Type[]` em `useDashboardData.ts` por Zod ou types gerados
- [ ] **B-022** Converter `require()` em `tailwind.config.ts` para ES import
- [ ] Quebrar `SettingsPage.tsx` (19 useState) → subcomponentes por aba
- [ ] Extrair strings Tailwind duplicadas para `src/lib/styles.ts`
- [ ] Adicionar `try/catch` de rede em hooks que só tratam erros Supabase

## ⚪ BACKLOG

- [ ] Ativar `strict: true` por completo no TypeScript
- [ ] Testes unitários para hooks de lógica de negócio extraída
- [ ] SEO: meta tags em páginas públicas
- [ ] PWA: manifest e service worker
- [ ] Internacionalização (i18n) para suporte multi-idioma

## ✅ CONCLUÍDO

- [x] B-015 `useEffect` deps em `TaskGoals.tsx` (`useCallback` + `fetchGoals` no array)
- [x] B-019 `xlsx@0.18.5` → `exceljs` em `useImportData.ts`
- [x] B-016, B-017, B-018, B-025 fechados como achados obsoletos (já resolvidos no código, descrição desatualizada — ver BUGS.md)
- [x] B-030 `isAdmin` deixa de depender de `string.includes`, usa RPC `is_admin()` + `profile.is_master`
- [x] Fixar recursão infinita RLS `user_roles`
- [x] Corrigir AuthContext duplicado (9 importadores migrados)
- [x] Code splitting: 29 rotas lazy-loaded (bundle 2.5MB → 825KB)
- [x] useHasAdmin → react-query (cache 60s)
- [x] `.single()` → `.maybeSingle()` em 7 hooks críticos
- [x] Remover `@lovable.dev/cloud-auth-js` (não funciona fora de *.lovable.app)
- [x] Dark mode: 6 componentes de tasks com bg-white/stone-* corrigidos
- [x] Untrack `src/stark-api/node_modules/` e `dist/` (2215 arquivos, ~65MB)
- [x] Deletar 23 arquivos duplicados `* 2.*` (artefatos do Finder)
- [x] Registrar organização Totum no banco (`organizations` table)
- [x] Criar usuários Israel, Mylena, Matheus Felipe
- [x] Hotfix RLS remoto para filhos de tarefas/checklists e storage `task-attachments`
