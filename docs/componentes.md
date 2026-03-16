# Componentes — Financeiro do Yago

> Última atualização: 16/03/2026

---

## Sumário

- [UI Base](#ui-base-srccomponentsui)
- [Layout](#layout-srccomponentslayout)
- [Common (compartilhados)](#common-srccomponentscommon)
- [Forms](#forms-srccomponentsforms)
- [Heroes de Hub](#heroes-de-hub)
- [Dashboard](#dashboard)

---

## UI Base (`src/components/ui/`)

### `<Button>`

Botão polivalente com suporte a variantes e tamanhos.

**Props:**

| Prop | Tipo | Padrão | Descrição |
|---|---|---|---|
| `variant` | `"default" \| "secondary" \| "ghost" \| "destructive" \| "link" \| "outline"` | `"default"` | Estilo visual |
| `size` | `"sm" \| "default" \| "lg" \| "icon"` | `"default"` | Tamanho |
| `asChild` | `boolean` | `false` | Delega rendering para filho (Radix `Slot`) |

**Uso:**
```tsx
<Button variant="secondary" size="sm" onClick={handleSave}>Salvar</Button>
<Button asChild><Link href="/metas">Ver metas</Link></Button>
```

---

### `<Card>`

Container padrão de conteúdo. Aplica `--surface`, borda `--border`, sombra `--shadow-color` e gradiente direcional sutil.

**Comportamento:** deve ser usado **sem** `className` com `from-white to-slate-50` — o gradiente já está embutido e se adapta ao tema.

**Gradiente excepcional permitido:** `from-emerald-50 to-teal-50` (proventos), `from-amber-50 to-orange-50` (pontos a vencer) — somente quando há semântica de cor.

**Uso:**
```tsx
<Card>
  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
  <p className="mt-1 text-2xl font-black text-slate-900">R$ 1.000,00</p>
</Card>
```

---

### `<Input>`

Input padrão. Fundo `--surface/90`, borda `--border`, foco com ring `--accent`.

```tsx
<Input type="text" placeholder="Descrição" {...register("description")} />
```

---

### `<Badge>`

Badge pequeno. Usa `--accent` como cor de destaque.

```tsx
<Badge variant="outline">Pendente</Badge>
```

---

## Layout (`src/components/layout/`)

### `<Sidebar>`

Barra lateral esquerda, visível em `lg:` e acima. Largura: `w-52` (208px).

**Grupos de navegação:**

| # | Itens |
|---|---|
| Principal | Dashboard · Busca Global · Finanças · Investimentos · Milhas · Mercado |
| Secundário | Lista de Desejo · Metas · Relatórios · Configurações |

Item ativo detectado via `usePathname()` + comparação com `href` ou `prefix`. Item ativo exibe fundo `--button-primary-bg` + texto `--button-primary-fg`.

---

### `<Topbar>`

Barra superior fixa no shell protegido. Exibe nome do usuário logado e botão de logout que chama `logoutAction()`.

---

### Mobile Nav

Drawer right-side ativado por botão ☰ na topbar, visível abaixo de `lg:`. Inclui `<SiteBrand>` e os mesmos links da Sidebar.

---

## Common (`src/components/common/`)

### `<ModulePage title="Hub > Página" />`

Cabeçalho padrão de toda subpágina com breadcrumb e botão Voltar.

**Como funciona:**
1. O `title` é dividido em ` > ` para extrair breadcrumb
2. O `<BackButton>` usa `router.back()` para navegação
3. Fundo: `radial-gradient` sutil com `--accent`

**Uso:**
```tsx
<ModulePage title="Finanças > Lançamentos" />
<ModulePage title="Investimentos > Bolsa" />
<ModulePage title="Milhas > Livelo" />
```

---

### `<SiteBrand compact?>`

Logo + nome do app. Usado na Sidebar (com `compact`) e na tela de login (sem `compact`).

| Prop | Efeito |
|---|---|
| `compact={false}` (padrão) | Exibe ícone + "PAINEL PESSOAL" + "Financeiro do Yago" |
| `compact={true}` | Exibe apenas o ícone SVG |

O ícone SVG fica inline no componente — sem dependência de arquivo externo.

---

### `<InstitutionAvatar>`

Avatar de instituição financeira com fallback progressivo:

1. URL direta (`iconUrl` prop)
2. URL da instituição no registry (`src/lib/institutions.ts`)
3. URLs de fallback da instituição
4. URL do ícone genérico (`src/lib/icon-registry.ts`)
5. Emoji do ícone genérico
6. Ícone Lucide baseado no nome (Building2, CreditCard, Wallet, etc.)

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `institutionId` | `string \| null` | ID do registry de instituições |
| `institutionName` | `string \| null` | Nome para fallback |
| `iconId` | `string \| null` | ID do icon registry |
| `iconUrl` | `string \| null` | URL direta de ícone |
| `size` | `number` | Tamanho em px (padrão: 32) |

---

### `<InvestmentClassPage>`

Página completa compartilhada para as 4 classes de ativos de investimento.

**Usado por:** `/investimentos/bolsa`, `/investimentos/fiis`, `/investimentos/renda-fixa`, `/investimentos/cripto`

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `asset_class` | `"fixed_income" \| "fii" \| "stock" \| "crypto"` | Filtro de classe |
| `title` | `string` | Nome exibido no ModulePage |
| `subtitle` | `string` | Subtítulo descritivo |

**KPI cards (top):**
- Ativos cadastrados
- Total investido
- Total resgatado
- Valor atual de mercado
- Rentabilidade líquida (colspan 2)

**Tabela:** todos os ativos da classe, com ações de editar/excluir. Formulário via `<InvestmentAssetForm>` em modal.

---

### `<MileageProgramPage>`

Página completa compartilhada para os 3 programas de milhas.

**Usado por:** `/milhas/livelo`, `/milhas/latam-pass`, `/milhas/azul`

**Props:**

| Prop | Tipo | Descrição |
|---|---|---|
| `programId` | `string` | ID do programa no banco |
| `programName` | `string` | Nome exibido no ModulePage |
| `subtitle` | `string` | Subtítulo descritivo |

**KPI cards:** Saldo atual · Total acumulado · Total resgatado · Pontos a vencer (amber quando > 0)

**Seções:** histórico de entradas/saidas + barra de progresso da meta do programa.

---

## Forms (`src/components/forms/`)

Todos os formulários usam a mesma dupla **React Hook Form + Zod** e executam **Server Actions** diretamente via `action` ou `startTransition`.

| Componente | Schema Zod | Action |
|---|---|---|
| `<BankAccountForm>` | `bankAccountSchema` | `upsertBankAccount` |
| `<CreditCardForm>` | `creditCardSchema` | `upsertCreditCard` |
| `<TransactionForm>` | `transactionSchema` | `upsertTransaction` |
| `<GoalContributionForm>` | `goalContributionSchema` | `upsertGoalContribution` |
| `<InvestmentAssetForm>` | `investmentAssetSchema` | `upsertInvestmentAsset` |
| `<InvestmentTransactionForm>` | `investmentTransactionSchema` | `upsertInvestmentTransaction` |
| `<MileageEntryForm>` | `mileageEntrySchema` | `upsertMileageEntry` |

---

## Heroes de Hub

Cada hub de nível superior tem um componente "hero" com contexto e ações rápidas em modais.

### `<FinancasHubHero>`

**Localização:** `src/app/(protected)/financas/page.tsx` (inline)

**Ações rápidas em modal:**
- Novo Lançamento (`TransactionForm`)
- Nova Conta (`BankAccountForm`)
- Novo Cartão (`CreditCardForm`)

**Links de navegação:** Mensal · Anual · Contas · Cartões · Lançamentos · Categorias

---

### `<InvestmentsHubHero>`

**Localização:** `src/components/investments/investments-hub-hero.tsx`

**Ações rápidas em modal:**
- Novo Ativo (com seletor de classe: Renda Fixa / FIIs / Bolsa / Cripto)
- Nova Movimentação
- Ver Extrato completo
- Ver Portfólio

**Links de navegação:** Renda Fixa · FIIs · Bolsa · Cripto

---

### `<MileageHubHero>`

**Localização:** `src/components/mileage/mileage-hub-hero.tsx`

**Ações rápidas em modal:**
- Novo Programa
- Nova Entrada de Milhas
- Nova Meta de Milhas
- Shortcuts

**Links de navegação:** Livelo · LATAM Pass · Azul

---

### `<MarketHubHero>`

**Localização:** `src/components/market/market-hub-hero.tsx`

**Ações rápidas em modal:**
- Nova Lista
- Novo Item
- Nova Nota Fiscal
- Histórico de Preços

**Links de navegação:** Listas · Notas · Histórico

---

## Dashboard

### `<DashboardChartsShell>`

Wrapper client-side que carrega `<OverviewCharts>` via `dynamic()` com `ssr: false` — necessário porque Recharts acessa `window/document`.

### `<OverviewCharts>`

Conjunto de gráficos Recharts do dashboard:
- Evolução de receita × despesa (BarChart)
- Distribuição por categoria (PieChart)
- Tendência patrimonial (AreaChart)

Recebe `currency` e `locale` como props para formatação adequada.
