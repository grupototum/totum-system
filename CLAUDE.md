# CLAUDE.md — Totum System
> Vibe Coding Totum v3.0 · Atualizado: 2026-05-07

## 🎯 O QUE É ESTE PROJETO

**Totum System** é um SaaS ERP multi-tenant em PRODUÇÃO para agências de personalização.
URL: https://totum.pixelsystem.online
GitHub: https://github.com/grupototum/totum-system

## 📊 NÍVEL DO PROJETO

**🔴 PRODUÇÃO** — SaaS multi-tenant ativo com dados reais.
Urgência máxima em segurança, RLS e estabilidade.

## 🛠 STACK

| Camada | Tecnologia |
|---|---|
| Frontend | Vite 7 · React 18 · TypeScript 5.8 |
| UI | Tailwind CSS · shadcn/ui · Radix UI |
| Estado | React Query (@tanstack/react-query) |
| Roteamento | React Router 6 |
| Backend | Supabase (Auth · Postgres · RLS · Edge Functions) |
| Deploy | Vercel (push main = deploy automático) |
| Design | Netflix Design System (dark-first, #000/#fff/#e00000) |

## 🏗 ARQUITETURA

```
src/
├── components/       # Componentes reutilizáveis (UI, layout, shared)
├── pages/            # Páginas (lazy-loaded via React.lazy no App.tsx)
├── hooks/            # Custom hooks (useAuth, useSupabaseTasks, etc.)
├── services/         # Camada de serviço (asaasService, embeddingService)
├── contexts/         # React Contexts (AuthContext, TenantContext, ThemeContext)
├── integrations/     # Clientes externos (supabase/, lovable/)
├── types/            # TypeScript types e interfaces
├── lib/              # Utilitários (errorHandler, tenant, utils)
├── data/             # Dados mock para modo demo
└── assets/           # Imagens e fontes
api/                  # Serverless functions Vercel (ex: /api/tarefas, CRUD por API key)
supabase/             # Edge Functions e migrations
docs/                 # Documentação do projeto
```

## 🚫 NO-FLY ZONES — NÃO MEXA SEM APROVAÇÃO EXPLÍCITA DO ISRAEL

Toda alteração nestas áreas exige aprovação ANTES de qualquer commit:

1. **Auth** — `src/hooks/useAuth.tsx`, Supabase Auth, RLS, JWT, OAuth Google, fluxo de login
2. **Tenant resolution** — `src/contexts/TenantContext.tsx`, `resolve_organization_by_host`, provisão de subdomínio Vercel
3. **Pagamentos** — `src/services/asaasService.ts`, edge functions `asaas-webhook` e `asaas-proxy`
4. **Banco de dados** — migrations SQL, schemas, RLS policies, edge functions Supabase
5. **Multi-tenant routing** — roteamento por hostname/subdomínio em `src/App.tsx`

## ✅ FASE 0 — SAÚDE TÉCNICA (estado atual)

| Check | Status | Detalhe |
|---|---|---|
| Build (`npm run build`) | ✅ | ~10s. Code splitting por rota ativo |
| TypeScript (`tsc --noEmit`) | ✅ | Passa (strict: false) |
| Lint (`npm run lint`) | ⚠️ | ~433 problemas — 404 são `no-explicit-any` (revisão 2026-08-10) |
| npm audit | ⚠️ | `xlsx` HIGH (fix só via CDN oficial SheetJS) · `react-router` 2× MODERATE (fix só no major v7) |
| .env no .gitignore | ✅ | Protegido |
| Secrets hardcoded | ✅ | Limpo (tokens revogados em commit anterior) |

## 📋 TOTUM TORAH — 7 LEIS

1. Sempre perguntar: LP/Site · MVP · Teste · **Produção**
2. Uma mudança por prompt/commit
3. Testar antes de commitar (build + lint devem passar)
4. Documentar mudanças no CHANGELOG e BUGS.md
5. IA sugere, humano aprova em áreas críticas (No-Fly Zones)
6. Preservar o que funciona; refatorar incrementalmente
7. Prioridades: Confiabilidade → Velocidade → Performance

## 🔑 CREDENCIAIS DE ACESSO

- **Admin:** `dev@grupototum.com` / `Totum@ADM2026`
- **Supabase Project:** ⚠️ **PENDENTE DE ATUALIZAÇÃO** — o ref antigo
  `fgosozxvhbdhqigwzqih` está **desativado (NXDOMAIN)** desde o commit `11ba014`.
  O ref atual não está registrado em lugar nenhum do repo; a fonte de verdade
  hoje é a env `VITE_SUPABASE_URL` no painel da Vercel.
- **Schema do banco:** `totum_system` (não `public`)
- **Deploy:** push em `main` → Vercel deploy automático

## 🛡 MULTI-TENANT

- Resolução por hostname via `resolve_organization_by_host` (RPC Supabase)
- `totum.pixelsystem.online` → org `c3d8f5a2-1b4e-4f9c-8e7d-6a5b2c1d0e9f`
- Fallback: `company_settings` quando org não encontrada
- TenantContext provê `tenant.organization_id` para todos os hooks

## 🎨 DESIGN SYSTEM

- Dark-first (modo escuro é o padrão)
- Paleta: Preto `#000000` · Branco `#ffffff` · Vermelho `#e00000`
- Variáveis CSS em `src/index.css` — NÃO usar cores hardcoded
- Fonte: Inter (Google Fonts)
- Componentes: shadcn/ui com tema Netflix customizado

## 📦 SKILLS DISPONÍVEIS

- `/vibetotumad` — Adequação completa ao Vibe Coding Totum
- `/review` — Revisão de PR
- `/health` — Dashboard de qualidade de código

## 🔗 LINKS

- App: https://totum.pixelsystem.online
- Supabase: ⚠️ link removido — apontava para o projeto desativado `fgosozxvhbdhqigwzqih`
- GitHub: https://github.com/grupototum/totum-system
- Vercel: https://vercel.com (deploy automático via push em main)
