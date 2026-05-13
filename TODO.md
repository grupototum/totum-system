# TODO.md — Totum System
> Vibe Coding Totum v3.0 · Atualizado: 2026-05-07

## 🔴 BLOQUEADORES (resolver antes de qualquer release)

- [ ] **B-011** Ativar `noImplicitAny: true` no `tsconfig.app.json` progressivamente
  - Rodar `tsc --noEmit`, agrupar erros por pasta, corrigir em commits separados
- [ ] **B-012** Quebrar `AgenteDetail.tsx` (756 LOC) → `AgentCharts`, `AgentMetrics`, `AgentTabs` + `useAgentClassification`
- [ ] **B-013** Quebrar `sidebar.tsx` (637 LOC) → `SidebarLayout` + `NavGroup` + hook `useSidebarNav`
- [ ] **B-014** Quebrar `asaasService.ts` (615 LOC) — **⚠️ No-Fly Zone, aprovação obrigatória**

## 🟡 ESTA SPRINT

- [ ] **B-015** Fix `useEffect` deps em `TaskGoals.tsx:78` (adicionar `useCallback` + `fetchGoals` ao array)
- [ ] **B-016** Fix `useEffect` deps em `FinancialFormDialog.tsx:46` (adicionar `[open]`)
- [ ] **B-017** Adicionar `try/catch` + toast em `ClientFormDialog.tsx:75`
- [ ] **B-018** Implementar validação HMAC do webhook Asaas — **⚠️ No-Fly Zone, aprovação obrigatória**
- [ ] **B-019** Avaliar substituição do `xlsx@0.18.5` por `exceljs` (Prototype Pollution)
- [ ] **B-025** Reconciliar histórico de migrations Supabase local/remoto sem `repair` às cegas
- [ ] Regenerar types Supabase via MCP e remover `as any` em `TenantContext.tsx:52`
- [ ] Ativar `noImplicitAny: true` e corrigir erros emergentes em pequenos grupos

## 🟢 PRÓXIMAS SEMANAS

- [ ] **B-020** Responsividade em `DataImport.tsx` (`h-[400px]` → `h-[300px] md:h-[400px]`)
- [ ] **B-021** Substituir 11× `as unknown as Type[]` em `useDashboardData.ts` por Zod ou types gerados
- [ ] **B-022** Converter `require()` em `tailwind.config.ts` para ES import
- [ ] **B-023** Resolver TODO antigo em `embeddingService.ts:17`
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
