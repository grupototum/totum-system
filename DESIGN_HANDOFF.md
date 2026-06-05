# DESIGN_HANDOFF

## Fonte visual principal
- **Figma team:** Grupo Totum (Equipe Totum) — Free plan
- **Figma file principal:** "Totum 3.0 — Arquitetura Completa" (FigJam, editado 16 dias atrás)
- **Figma design file:** "Totum Temp" (Design file, editado 3 meses atrás)
- **Prototype:** "Totum Temp - Page 1" (Prototype file, viewed 3 meses atrás)
- **Link da team:** https://www.figma.com/files/team/1210549245730756667/recents-and-sharing?fuid=1210549237293458662
- **Status do handoff:** 🟡 Arquivos identificados — abrir no Figma para extrair tokens

### Arquivos identificados no Figma

| Arquivo | Tipo | Última edição | Relevância |
|---|---|---|---|
| **Totum 3.0 — Arquitetura Completa** | FigJam | 16 dias atrás | 🔴 Arquitetura do sistema |
| **Totum Temp** | Design | 3 meses atrás | 🟢 Design de telas |
| **Totum Temp - Page 1** | Prototype | 3 meses atrás | 🟡 Protótipo navegável |
| MNTN - Landing Page | Community | 3 meses atrás | ⚪ Referência visual |
| SaaS, Futuristic App | Community | 3 meses atrás | ⚪ Referência visual |
| Digital Agency Dark Theme | Community | 3 meses atrás | ⚪ Referência visual |
| 20+ Hero Sections | Community | 3 meses atrás | ⚪ Referência visual |
| 310+ Landing Pages | Community | 3 meses atrás | ⚪ Referência visual |

### ⚠️ Próximo passo
Abrir o arquivo **"Totum Temp"** no Figma e compartilhar o link direto do arquivo (ex: `https://www.figma.com/design/XXXX/totum-temp`) para eu completar o mapeamento de tokens e componentes.

## O que deve ser extraído do Figma

- [ ] Cores (primary, background, text, accent, border)
- [ ] Tipografia (fonte, tamanhos, pesos, tracking)
- [ ] Espaçamentos (container, section, card, gap)
- [ ] Grid/container (max-width, breakpoints)
- [ ] Border radius (botões, cards, inputs)
- [ ] Sombras (cards, modals, dropdowns)
- [ ] Componentes (navbar, hero, cards, forms, CTAs, footer)
- [ ] Estados de botão (default, hover, active, disabled)
- [ ] Layout mobile (telas ≤767px)
- [ ] Layout desktop (telas ≥1024px)

## Tokens visuais (atual — Netflix-inspired)

### Cores
| Token | Valor | Uso |
|---|---|---|
| Primary | `#e00000` | Botões, links, ações, focus ring |
| Primary Deep | `#b80000` | Hover state |
| Background | `#000000` | Body, página base (dark mode) |
| Card | `#1a1a1a` | Cards, painéis, popovers |
| Sidebar | `#0f0f0f` | Sidebar background |
| Text | `#ffffff` | Texto principal |
| Muted | `#a9a9a9` | Texto secundário, placeholders |
| Border | `#461518` | Bordas de inputs, cards (dark red) |
| Border Medium | `#5a1b20` | Bordas hover |
| Border Strong | `#6e2228` | Bordas ativas |
| Accent Success | `#2bb871` | Status positivo, sucesso |
| Accent Warning | `#e6a23c` | Alertas, pendências |
| Destructive | `#e00000` | Erros, deleção (mesmo que primary) |

### Tipografia
| Token | Valor | Uso |
|---|---|---|
| Font Heading | Inter, 700, -0.02em | H1, H2, títulos de seção |
| Font Body | Inter, 400, 0.01em | Parágrafos, descrições |
| Font Mono | Geist Mono, 400 | Código, métricas, números |
| H1 | 2.5rem / 1.15 | Hero titles |
| H2 | 2rem / 1.2 | Section titles |
| H3 | 1.75rem / 1.25 | Card titles |
| H4 | 1.375rem / 1.3 | Sub-sections |
| Body | 1rem / 1.5 | Texto corrido |
| Caption | 0.8125rem / 1.35 | Labels, badges, metadata |
| Label | 0.625rem / 0.15em uppercase | Tags industriais, status |

### Espaçamento
| Token | Valor | Uso |
|---|---|---|
| Container | max-width 1400px, padding 2rem | Layout principal |
| Section Padding | 64px–96px vertical | Seções de página |
| Card Padding | 24px–32px | Cards e painéis |
| Card Gap | 16px–24px | Grid de cards |
| Input Padding | 12px | Campos de formulário |
| Button Padding | 12px 32px | Botões primários |

### Border Radius
| Token | Valor | Uso |
|---|---|---|
| None | 0px | Botões (Netflix square DNA) |
| Small | 4px | Inputs, badges |
| Medium | 8px | Cards, modais, popovers |
| Large | 0.75rem | Dropdowns, tooltips |

### Sombras
| Token | Valor | Uso |
|---|---|---|
| sm | 0 0.125rem 0.25rem rgba(0,0,0,0.6) | Badges, tooltips |
| md | 0 0.25rem 0.5rem rgba(0,0,0,0.8) | Cards, dropdowns |
| lg | 0 0.5rem 1rem rgba(0,0,0,0.9) | Modais, panels |
| xl | 0 1rem 2rem rgba(0,0,0,1) | Overlays, drawers |
| Accent | 0 0.25rem 0.5rem rgba(224,0,0,0.3) | Botões hover, CTA |

## Componentes a mapear

| Componente | Localização no código | Status |
|---|---|---|
| Navbar | `src/components/layout/` | ✅ Existente |
| Sidebar | `src/components/layout/` | ✅ Existente |
| Hero/Dashboard | `src/pages/Dashboard.tsx` | ✅ Existente |
| Cards | `src/components/ui/card.tsx` + glass-card | ✅ Existente |
| Formulários | `src/components/ui/` (shadcn) | ✅ Existente |
| CTAs | `src/index.css` (.btn-netflix-primary) | ✅ Existente |
| Footer | (a verificar) | ☐ |
| Data Tables | `src/components/ui/table.tsx` | ✅ Existente |
| Kanban Board | `src/components/kanban/` | ✅ Existente |
| Gantt Chart | `src/components/gantt/` | ✅ Existente |
| Chat Interface | `src/components/chat/` | ✅ Existente |
| Status Badges | `src/index.css` (.status-*) | ✅ Existente |
| Metric Cards | `src/components/dashboard/` | ✅ Existente |

## Onde aplicar tokens do Figma

| Arquivo | Propósito |
|---|---|
| `tailwind.config.ts` | Tokens Tailwind (colors, fontFamily, borderRadius, boxShadow) |
| `src/index.css` | CSS variables `:root`, component overrides, base styles |
| `src/components/ui/*.tsx` | shadcn/ui components (usam tokens do CSS) |
| `components.json` | Config shadcn/ui (baseColor, cssVariables) |

## Regras

- **Não copiar visual cegamente** se quebrar responsividade — testar em 3 breakpoints
- **Não alterar estrutura crítica** sem checkpoint — componentes compartilhados afetam múltiplas páginas
- **Sempre comparar Figma × preview local** — lado a lado antes de validar
- **Toda mudança visual deve ser testada** em desktop (1440px) e mobile (375px)
- **Manter DNA Netflix** — dark-first, red accents, square buttons, cinematic shadows
- **Tokens devem ser CSS variables** — não hardcoded em componentes

## Checklist de handoff Figma

- [ ] Link do Figma compartilhado comigo
- [ ] Página principal identificada
- [ ] Tokens de cor extraídos e mapeados
- [ ] Tipografia extraída e mapeada
- [ ] Espaçamentos extraídos e mapeados
- [ ] Componentes principais identificados no Figma
- [ ] Estados de interação (hover, active, disabled) documentados
- [ ] Layout mobile vs desktop comparado
- [ ] Assets exportados (ícones, ilustrações, logos)
- [ ] Animações/transições documentadas (se houver)

---

*Última atualização: 2026-06-03*
