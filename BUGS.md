# BUGS.md — Totum System
> Vibe Coding Totum v3.0 · Atualizado: 2026-05-07

## 🔴 CRÍTICOS (resolver antes de qualquer release)

| # | Status | Arquivo | Problema | Commit fix |
|---|---|---|---|---|
| B-001 | ✅ RESOLVIDO | `src/services/asaasService.ts` | URL Supabase hardcoded apontando para projeto antigo (`sugulxjfkhibuddmoyzr`) | `8de4f1a` |
| B-002 | ✅ RESOLVIDO | `src/index.css` | `@import` Google Fonts após diretivas `@tailwind` causava warning de build | `364bbbb` |
| B-003 | ✅ RESOLVIDO | Supabase RLS | Recursão infinita na policy `user_roles` — causava sidebar incompleta para todos os usuários | Fixado via SQL |
| B-004 | ✅ RESOLVIDO | `src/contexts/AuthContext.tsx` | Segundo `AuthProvider` duplicado nunca montado — 9 arquivos importavam contexto errado | `408315d` |
| B-005 | ✅ RESOLVIDO | `src/components/layout/AppSidebar.tsx` | `window.location` em vez de `useLocation()` — sidebar não reativava ao trocar rota | `408315d` |
| B-006 | ✅ RESOLVIDO | `src/pages/Tasks.tsx` | Filter short-circuit: `return true` em `responsibleFilter` bypassa filtros de status/prioridade | `408315d` |
| B-007 | ✅ RESOLVIDO | `src/hooks/useAuth.tsx` | `.single()` crashava com `PGRST116` quando profile não existia | `408315d` |
| B-008 | ✅ RESOLVIDO | `src/App.tsx` | 2.5MB bundle único — sem code splitting | `c15595d` |
| B-009 | ✅ RESOLVIDO | `src/stark-api/node_modules/` | 2187 arquivos binários (~65MB) trackeados no git | `948c250c` |
| B-010 | ✅ RESOLVIDO | 23 arquivos `* 2.*` | Duplicatas byte-identical causavam 695+ erros de lint e risco de import errado | `bd676aeb` |
| B-024 | ✅ RESOLVIDO | Supabase RLS | Policies de filhos de tarefas/checklists e storage `task-attachments` tinham inserts amplos para `authenticated` | Hotfix remoto `20260513_remote_task_child_rls_hotfix.sql` |

## 🟡 ALTOS (esta sprint)

| # | Status | Arquivo | Problema | Prioridade |
|---|---|---|---|---|
| B-011 | 🔴 ABERTO | `tsconfig.app.json` | `strict: false`, `noImplicitAny: false` — toda salvaguarda TypeScript desligada | Alta |
| B-012 | 🔴 ABERTO | `src/pages/AgenteDetail.tsx` | God Component 756 LOC: UI + gráficos + state + Supabase | Alta |
| B-013 | 🔴 ABERTO | `src/components/ui/sidebar.tsx` | 637 LOC monolítico | Alta |
| B-014 | 🔴 ABERTO | `src/services/asaasService.ts` | 615 LOC — **No-Fly Zone** | Alta |
| B-015 | 🟡 ABERTO | `src/components/tasks/TaskGoals.tsx:78` | `useEffect` com deps incompletas (`fetchGoals` fora do array) | Média |
| B-016 | 🟡 ABERTO | `src/components/financial/FinancialFormDialog.tsx:46` | `useEffect` sem `[open]` nas deps | Média |
| B-017 | 🟡 ABERTO | `src/components/clients/ClientFormDialog.tsx:75` | Chamada Supabase sem `.catch()` | Média |
| B-018 | 🟡 ABERTO | `supabase/functions/asaas-webhook/` | Sem validação HMAC da assinatura do Asaas | Média |
| B-019 | 🟡 ABERTO | `package.json` — `xlsx@0.18.5` | Prototype Pollution + ReDoS (sem fix upstream) | Média |
| B-025 | 🔴 ABERTO | `supabase/migrations/` | Histórico local/remoto divergente bloqueia `supabase db push`; reconciliar com dump/pull antes de novos pushes | Alta |

## 🟢 MÉDIOS (próximas semanas)

| # | Status | Localização | Problema |
|---|---|---|---|
| B-020 | 🟡 ABERTO | `src/pages/DataImport.tsx` | Heights fixas (`h-[400px]`) quebram mobile |
| B-021 | 🟡 ABERTO | `src/hooks/useDashboardData.ts:93-123` | 11× `as unknown as Type[]` — casting duplo inseguro |
| B-022 | 🟡 ABERTO | `tailwind.config.ts:114` | `require()` style import — 1 erro de lint |
| B-023 | 🟡 ABERTO | `src/services/embeddingService.ts:17` | TODO antigo de OpenAI Embedding API não implementado |

## 📌 COMO REGISTRAR NOVOS BUGS

```
| B-XXX | 🔴 ABERTO | arquivo:linha | Descrição clara do problema | Prioridade |
```

Status: `🔴 ABERTO` → `🟡 EM ANDAMENTO` → `✅ RESOLVIDO`
