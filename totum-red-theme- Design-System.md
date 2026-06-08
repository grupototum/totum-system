# Totum Red Theme — Design System

> Design system oficial da Totum. Dark-first, red-brand, Geomanist typography.
> Última atualização: 2026-06-03

---

## 1. Identidade Visual

### Filosofia
- **Dark by default** — nunca renderizar em fundo claro
- **Vermelho Totum como âncora** — usado com parcimônia (focus, hover halo, brand cards)
- **Geomanist weight 300 para títulos** — voz da marca
- **Profundidade via translucidez** — borders como inset shadows, não CSS `border`

---

## 2. Paleta de Cores

### Primárias (Vermelho Totum)
| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#da2128` | Focus ring, hover halo, brand glow |
| `brand-red-bright` | `#e3433e` | Gradiente primário — start |
| `brand-red-vibrant` | `#da2128` | Gradiente primário — end |
| `brand-red-light` | `#ef9a9a` | Badges "New"/"Beta", status tags |

### Secundárias
| Token | Hex | Uso |
|-------|-----|-----|
| `secondary` | `#077ac7` | CTAs secundários, gradiente start |
| `tertiary` | `#6b21ef` | Gradiente secundário — end |
| `brand-purple-bright` | `#a06ff6` | Nav active sheen |

### Superfícies (Dark Stack)
| Token | Hex | Uso |
|-------|-----|-----|
| `surface` | `#0e0918` | Background da página, scrollbar track |
| `neutral` / `card-bg` | `#1b1728` | Cards, nav background |
| `border` / `elevated` | `#1f192a` | Overlays, badges, nav backdrop |
| `hover-surface` | `#272333` | Card hover, tab hover |
| `warm-rust` | `#432d33` | Brand card gradient start |
| `cool-graphite` | `#191422` | Inactive states |

### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `text` | `#d1cece` | Body copy padrão |
| `text-muted` | `#9ca3af` | Input text, labels |
| `white` | `#ffffff` | Títulos, textos enfatizados |
| `white-soft` | `#d1cece` | Texto body |

### Estado
| Token | Hex | Uso |
|-------|-----|-----|
| `error` | `#d91616` | Erros, borda focus alternativa |
| `success` | `#35a670` | Código válido, sucesso |

---

## 3. Tipografia

### Família
- **Principal:** `geomanist, ui-sans-serif, system-ui, sans-serif`
- **Mono:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace`
- **Ênfase (strong):** `geomanist-book, ui-sans-serif, system-ui, sans-serif` — **nunca** `font-weight: 700`

### Escala
| Token | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| `display-hero` | 72px | 300 | 100% | -0.02em |
| `display-large` | 54px | 300 | 100% | -0.02em |
| `section-heading` | 48px | 300 | 1.1 | -0.02em |
| `subheading-large` | 38px | 300 | 1.2 | -0.02em |
| `subheading` | 32px | 300 | 1.25 | -0.02em |
| `body-large` | 20px | 300 | 1.25 | 0em |
| `body` | 16px | 400 | 1.5 | 0em |
| `body-small` | 15px | 400 | 1.5 | 0em |
| `button` | 16px | 400 | 1 | 0em |
| `button-small` | 14px | 400 | 1 | 0em |
| `caption` | 14px | 400 | 1.5 | 0em |
| `caption-small` | 12px | 400 | 1.4 | 0em |

### Regras
- **Apenas títulos (`display-*`, `section-heading`, `subheading*`) recebem `letter-spacing: -0.02em`**
- **Body, links e botões: `letter-spacing: 0em` sempre**
- **`<strong>` usa `geomanist-book` com `font-weight: 400`** — nunca bold sintético
- **Não usar `font-weight: 600` em nenhum contexto**

---

## 4. Espaçamento & Bordas

### Border Radius
| Token | Valor | Uso |
|-------|-------|-----|
| `none` | 0px | — |
| `sm` | 6px | Inputs |
| `md` | 8px | Nav links |
| `lg` | 16px | Cards dark |
| `xl` | 24px | Cards padrão |
| `full` | 9999px | **Todos os botões primários/secundários (pills)** |

### Spacing
| Token | Valor |
|-------|-------|
| `xs` | 4px |
| `sm` | 8px |
| `md` | 16px |
| `lg` | 24px |
| `xl` | 32px |
| `2xl` | 48px |

---

## 5. Componentes

### Botões

#### Primary (Pill)
```
Background: #da2128 (ou gradient 135deg #e3433e → #da2128)
Text: #ffffff
Border: #da2128 (filled)
Radius: 9999px
Padding: 12px 24px
Font: 16px geomanist weight 400
Shadow default: inset 0 1px 1px #fff3,
                0 1px 2px #08080833,
                0 4px 4px #08080814,
                0 7px 80px -12px #da2128,
                inset 0 6px 12px #ffffff1f
Hover: mesmo bg, shadow ativo com halo vermelho
```

#### Secondary (Pill)
```
Background: #077ac7 (ou gradient 135deg #077ac7 → #6b21ef)
Text: #ffffff
Radius: 9999px
Padding: 12px 24px
Shadow hover: 0 7px 0 -12px #077ac7
```

#### Ghost (Pill)
```
Background: transparent
Text: #ffffff
Border: transparent
Radius: 9999px
Padding: 10px 20px
```

> ⚠️ **Regra absoluta:** Botões são sempre pills (`9999px`). Nunca rounded-rect (8–16px). Rounded-rect é apenas para nav-internal-links.

---

### Cards

#### Default Card
```
Background: #1b1728
Border: inset 0 0 0 1px hsla(0,0%,100%,0.1)
Radius: 24px
Padding: 32px
Shadow: inset 0 0 0 1px hsla(0,0%,100%,0.1),
        inset 0 1px 0 0 hsla(0,0%,100%,0.1)
Hover bg: #272333
```

#### Brand Card (Gradiente Quente)
```
Background: linear-gradient(180deg, #432d33 0%, #0e0918 100%)
Border: inset 0 0 0 1px hsla(0,0%,100%,0.1),
        inset 0 1px 0 0 rgba(218,33,40,0.3)
Radius: 24px
Padding: 32px
```

#### Dark Card
```
Background: #0e0918
Border: #1f192a
Radius: 16px
Padding: 32px
```

> ⚠️ **Regra:** Nunca usar CSS `border` declaration. Sempre `box-shadow: inset` para hairlines translúcidas.

---

### Inputs

#### Text Input
```
Background: #1f192a
Text: #9ca3af (placeholder), #d1cece (value)
Border: #1f192a
Radius: 6px
Padding: 8px 12px
Focus ring: #da2128 (1px) com outline-offset 2px
```

---

### Badges

#### Default Badge
```
Background: rgba(255,255,255,0.10)
Text: #ffffff
Border: 1px solid #1f192a
Radius: 9999px
Padding: 4px 12px
Font: 24px geomanist weight 400
```

#### Warm Badge ("New"/"Beta")
```
Background: #ef9a9a
Text: #0e0918
Border: transparent
Radius: 9999px
Padding: 4px 12px
```

---

### Navegação

#### Sticky Header
```
Background: #1b1728
Backdrop-filter: blur(24px)
Border-bottom: 1px solid #1f192a
Height: 74px
```

#### Nav Link (Active)
```
Background: linear-gradient(to bottom, #a06ff6, #6b21ef)
Text: #ffffff
Padding: 8px 20px
Radius: 8px
```

#### Nav Link (Hover)
```
Background: hsla(0,0%,100%,0.07)
```

---

## 6. Efeitos & Elevação

### Shadow Stack (da camada mais baixa à mais alta)

| Nível | Shadow | Uso |
|-------|--------|-----|
| Ambient | `rgba(0,0,0,0.05)`, `rgba(8,8,8,0.2)` | Sombra ambiente padrão |
| Inset Highlight | `#ffffff1f`, `#ffffff33` | Inner highlights nos botões |
| Blue Halo (secondary hover) | `0 7px 0 -12px #077ac7` | Hover em botão secundário |
| **Brand Halo (primary hover)** | `0 7px 80px -12px #da2128` | **Hover em botão primário — momento visual signature** |
| Focus Ring | `outline: 2px solid transparent; --tw-ring-color: rgb(218 33 40)` | Focus em `.focusable` |

### Filosofia de Elevação
- Não usar drop-shadows pretas em cards
- Elevação é um "glow-up" — brilho saindo da superfície
- Glassmorphism (`backdrop-blur: 200px`) é **reservado apenas** para overlay cards "white-transparent" especiais
- Cards padrão são solid `#1b1728`

---

## 7. Layout

### Princípios
- **Dark-first:** `#0e0918` é a base, nunca `#ffffff`
- **Cards como painéis de vidro fumê:** inset shadows criam profundidade holográfica
- **Halo vermelho no CTA:** o momento visual signature da marca
- **Geomanist 300:** voz quieta e confiante nos títulos
- **Pill buttons:** 9999px radius, sempre

### Responsivo
- Mobile-first
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Fontes escalam proporcionalmente: hero 72px → 40px em mobile

---

## 8. Do's and Don'ts

### ✅ Fazer
- Default para superfície dark `#0e0918`
- Geomanist weight 300 para hero/section headings
- `<strong>` com `geomanist-book` weight 400
- Halo vermelho `#da2128` no hover do CTA primário
- Pill buttons (`9999px` radius)
- Borders como `inset` shadows, não CSS `border`
- Focus ring na cor da marca `#da2128`
- Backdrop-blur 24px no nav sticky
- Card radius 24px, padding 32px
- Tracking `-0.02em` **apenas** em `.title`

### ❌ Não Fazer
- Nunca usar `font-weight: 700` para `<strong>` — usar `geomanist-book`
- Nunca usar `font-weight: 600`
- Nunca aplicar letter-spacing em body/links/botões
- Nunca rounded-rect nos botões (apenas nav links)
- Nunca `#000000` puro — usar `#0e0918`
- Nunca aplicar vermelho `#da2128` em superfícies grandes — parcimônia
- Nunca tema claro — não existe light variant
- Nunca CSS `border` em cards — usar inset shadow
- Nunca drop-shadows padrão em cards — elevação é glow
- Nunca substituir geomanist por Inter/system-ui
- Nunca glassmorphism na camada de conteúdo principal

---

## 9. Referência Rápida de Prompts

### Hero Section
```
Full-bleed dark hero em #0e0918.
Headline: 72px geomanist 300, line-height 100%, letter-spacing -0.02em, #ffffff.
Subtitle: 20px geomanist 300, line-height 1.25, #d1cece.
CTA primário: pill #da2128, texto #ffffff, radius 9999px, padding 12px 24px, 16px geomanist 400.
Hover: bg #da2128 + box-shadow 0 7px 80px -12px #da2128.
CTA secundário: gradiente 135deg #077ac7 → #6b21ef, texto branco, mesmas dimensões.
```

### Feature Card
```
Card: bg #1b1728, radius 24px, padding 32px.
Border: box-shadow inset 0 0 0 1px hsla(0,0%,100%,0.1) — NÃO usar CSS border.
Heading: 32px geomanist 300, #ffffff, letter-spacing -0.02em.
Body: 16px geomanist 400, line-height 1.5, #d1cece.
Hover: bg #272333. Sem drop-shadow.
```

### Status Badge
```
Badge: 24px geomanist 400, #ffffff, bg rgba(255,255,255,0.10), padding 4px 12px, radius 9999px, 1px solid #1f192a.
Variante "new": bg #ef9a9a, texto #0e0918.
```

### Brand Card
```
Card featured: gradiente 180deg #432d33 → #0e0918, radius 24px.
Shadow: inset 0 0 0 1px hsla(0,0%,100%,0.1), inset 0 1px 0 0 rgba(218,33,40,0.3).
Padding 32px. Heading 38px geomanist 300, #ffffff.
```

---

*Documento mantido por TARS — Totum Automated Resource System*
