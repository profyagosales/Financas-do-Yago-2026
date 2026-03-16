# Sistema de Design — Financeiro do Yago

> Última atualização: 16/03/2026

---

## Identidade visual

**Nome do app:** Financeiro do Yago  
**Ícone:** `/public/icon-financeiro-yago.svg` — ícone hexagonal verde com símbolo "₢" personalizado  
**Componente de marca:** `src/components/common/site-brand.tsx` — aceita `compact` para exibição reduzida na sidebar

**Paleta base:** verde esmeralda/teal  
**Filosofia:** tons naturais, elegantes, sem excesso de cor — verde como identidade, jamais como decoração

---

## Tokens CSS (CSS Custom Properties)

Definidos em `src/app/globals.css` e consumidos diretamente pelas classes Tailwind v4 via `@theme inline`.

### Modo claro (`:root`)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#eff5f1` | Cor de fundo da página |
| `--foreground` | `#13241c` | Texto principal |
| `--surface` | `#f9fcfa` | Fundo de cards e painéis |
| `--surface-strong` | `#ddece3` | Surface com mais contraste |
| `--accent` | `#147a5f` | Verde principal — links, destaques, active |
| `--muted` | `#4d685b` | Texto secundário / labels |
| `--muted-surface` | `#ebf4ef` | Fundo sutil de badges e linhas zeradas |
| `--border` | `#c9ddd1` | Bordas de cards, separadores, inputs |
| `--button-primary-bg` | `#116b54` | Botão primário — fundo |
| `--button-primary-fg` | `#ffffff` | Botão primário — texto |
| `--button-primary-hover` | `#0d5744` | Botão primário — hover |
| `--button-secondary-bg` | `#ddede5` | Botão secundário — fundo |
| `--button-secondary-fg` | `#18362b` | Botão secundário — texto |
| `--button-secondary-hover` | `#d2e6dc` | Botão secundário — hover |
| `--button-ghost-hover` | `rgba(88,126,108,0.16)` | Hover de link/ghost |
| `--shadow-color` | `rgba(20,54,42,0.14)` | Sombra dos cards |

### Modo escuro (`html[data-theme="dark"]` e `prefers-color-scheme: dark` + `html[data-theme="system"]`)

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#071810` | Fundo profundo, quase preto esverdeado |
| `--foreground` | `#e6f4ed` | Texto claro |
| `--surface` | `rgba(13,36,28,0.9)` | Cards semitransparentes |
| `--surface-strong` | `#1c4737` | Surface com contraste additional |
| `--accent` | `#5ee5bc` | Verde neon suave |
| `--muted` | `#9ec7b5` | Texto secundário claro |
| `--muted-surface` | `#0a271d` | Badges e hover em dark |
| `--border` | `#2b5d49` | Bordas quase invisíveis |
| `--button-primary-bg` | `#49c59f` | Botão primário em dark |
| `--button-primary-fg` | `#062119` | Texto do botão primário em dark |
| `--shadow-color` | `rgba(1,16,9,0.5)` | Sombras mais opacas em dark |

### Alternância de tema

O tema é controlado pelo atributo `data-theme` em `<html>`:
- `data-theme="light"` → tokens de `:root`
- `data-theme="dark"` → tokens de `html[data-theme="dark"]`
- `data-theme="system"` → segue `prefers-color-scheme` do SO

---

## Integração com Tailwind CSS v4

O bloco `@theme inline` em `globals.css` conecta os tokens CSS ao sistema de utilitários do Tailwind:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-manrope);
  --font-mono: var(--font-space-grotesk);

  /* Remap da escala slate → tokens do tema */
  --color-slate-50:  var(--muted-surface);
  --color-slate-100: color-mix(in srgb, var(--border) 42%, var(--surface));
  --color-slate-200: var(--border);
  --color-slate-300: color-mix(in srgb, var(--border) 80%, var(--muted));
  --color-slate-400: var(--muted);
  --color-slate-500: var(--muted);
  --color-slate-600: color-mix(in srgb, var(--muted) 85%, var(--foreground));
  --color-slate-700: color-mix(in srgb, var(--foreground) 80%, var(--muted));
  --color-slate-800: var(--foreground);
  --color-slate-900: var(--foreground);
}
```

**Efeito:** qualquer classe `text-slate-*`, `border-slate-*`, `bg-slate-*` em qualquer arquivo do projeto responde automaticamente ao tema claro/escuro sem precisar de alteração individual.

> **Exceção importante:** `text-white` / `bg-white` **não** são remapeados. Usos explícitos de `white` são intencionais (ex.: texto em botões primários com fundo escuro).

---

## Tipografia

| Uso | Fonte | Classe Tailwind |
|---|---|---|
| Corpo do texto | Manrope | `font-sans` |
| Títulos (h1, h2, h3) | Space Grotesk | `font-mono` (alias de Space Grotesk) |

Ambas as fontes são carregadas via `next/font/google` em `src/app/layout.tsx` e injetadas como variáveis CSS (`--font-manrope`, `--font-space-grotesk`).

---

## Fundo da página (body gradient)

```css
body {
  background:
    radial-gradient(circle at 8% 0%,   /* blob verde no canto superior esquerdo */
      color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 37%),
    radial-gradient(circle at 96% 93%, /* blob verde no canto inferior direito */
      color-mix(in srgb, #16a34a 14%, transparent) 0%, transparent 36%),
    linear-gradient(180deg,            /* fade de surface→transparente nos primeiros 260px */
      color-mix(in srgb, var(--surface) 72%, transparent), transparent 260px),
    var(--background);
}
```

---

## Animação de entrada de página

Toda `<main>` anima com:

```css
main {
  animation: page-in 0.38s ease-out both;
}

@keyframes page-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0);   }
}
```

---

## Componentes base UI (`src/components/ui/`)

### `<Button variant="..." size="...">`

| Variante | Aparência |
|---|---|
| `default` | Fundo `--button-primary-bg`, texto `--button-primary-fg` |
| `secondary` | Fundo `--button-secondary-bg`, borda `--border` |
| `ghost` | Transparente, hover com `--button-ghost-hover` |
| `destructive` | Vermelho (`red-600`) |
| `link` | Apenas texto, cor `--accent` |
| `outline` | Borda `--border`, fundo transparente |

Tamanhos: `sm`, `default`, `lg`, `icon`.

### `<Card>`

Fundo `--surface` com gradiente direcional (165°) do `--accent` sutilíssimo para `--surface`. Borda `--border`. Sombra usando `--shadow-color`. Padding responsivo: `p-4 md:p-5`. Border-radius: `rounded-2xl`.

**Nunca aplicar** `bg-gradient-to-br from-white to-slate-50` sobre um Card — anula o gradiente do tema e quebra dark mode.

### `<Input>`

Fundo `--surface` com 90% opacidade, borda `--border`, foco com ring no `--accent`.

### `<Badge>`

Usa `--accent` como cor base e `--muted-surface` para fundo. Bordas via `--border`.

---

## Layout de navegação

### Sidebar (`src/components/layout/sidebar.tsx`)

- Visível em `lg:` e acima
- Largura fixa: `w-52` (208px)
- Fundo: gradiente linear do `--surface` → `--surface + 16% accent`
- Grupos de navegação separados por divisor (`--border`)
- Item ativo: `--button-primary-bg` + `--button-primary-fg`
- Item inativo: `--foreground` com hover `--button-ghost-hover`
- Ícones: Lucide React, 15px
- Texto: 13px, `font-semibold`

### Mobile Nav

- Drawer lateral (right-side) visível apenas abaixo de `lg:`
- Mesmo estilo de itens que a Sidebar
- Inclui `<SiteBrand>` na parte superior

### Topbar (`src/components/layout/topbar.tsx`)

- Barra superior fixa no shell `(protected)/layout.tsx`
- Exibe nome do usuário e botão de logout

---

## Padrão de KPI Cards

Todos os módulos mantêm KPI cards no topo com esta estrutura:

```tsx
<Card>
  <p className="text-xs uppercase tracking-wide text-slate-500">Label da métrica</p>
  <p className="mt-1 text-2xl font-black text-slate-900">Valor</p>
</Card>
```

- `text-slate-500` resolve para `--muted` via remap do `@theme inline`
- `text-slate-900` resolve para `--foreground` via remap
- O `<Card>` provê o gradiente e surface automaticamente

**Exceção semântica:** cards com cor especial (ex.: pontos a vencer em âmbar, ganho em verde esmeralda) mantêm suas classes de gradiente (`from-amber-50 to-orange-50`, `from-emerald-50 to-teal-50`).

---

## Padrão de cabeçalho de subpágina (`<ModulePage>`)

```tsx
// src/components/common/module-page.tsx
<ModulePage title="Hub > Subpágina" />
```

Renderiza:
- `BackButton` (usa `router.back()`)
- Breadcrumb extraído do `title` (split em ` > `)
- Título em `text-2xl font-black` com fundo gradiente sutil usando `--accent`
- Border-radius `rounded-2xl`, borda `--border`

Rotas que usam `<ModulePage>`:
- Todas as pages de Investimentos (via `InvestmentClassPage`)
- Todas as pages de Milhas (via `MileageProgramPage`)
- Todas as pages individuais de subpáginas de Finanças, Mercado, Metas, etc.
