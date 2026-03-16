# Arquitetura — Financeiro do Yago

> Última atualização: 16/03/2026

---

## Visão geral da stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 — App Router |
| Linguagem | TypeScript (strict) |
| Estilização | Tailwind CSS v4 + CSS Custom Properties |
| Tipografia | Manrope (corpo) · Space Grotesk (títulos) |
| Backend/Auth | Supabase (Postgres + Auth + Storage + RLS) |
| Formulários | React Hook Form + Zod |
| Tabelas | TanStack Table v8 |
| Gráficos | Recharts |
| PWA | Manifest + Service Worker próprio |
| Ícones UI | Lucide React |

---

## Estrutura de pastas

```
src/
├── actions/          # Server Actions (Next.js) — operações write no banco
│   ├── auth.ts       # login / logout
│   ├── finance.ts    # transações, contas, cartões, CSV import
│   └── goals.ts      # metas e aportes
│
├── app/              # Next.js App Router
│   ├── globals.css   # tokens CSS globais + @theme Tailwind
│   ├── layout.tsx    # root layout (fontes, metadata, PWA)
│   ├── page.tsx      # redirect → /dashboard
│   ├── (auth)/       # grupo: sem proteção de sessão
│   │   └── login/
│   └── (protected)/  # grupo: middleware verifica sessão Supabase
│       ├── layout.tsx          # shell com Sidebar + Topbar
│       ├── dashboard/
│       ├── financas/
│       │   ├── anual/
│       │   ├── cartoes/
│       │   ├── categorias/
│       │   ├── contas/
│       │   ├── lancamentos/
│       │   └── mensal/
│       ├── investimentos/
│       │   ├── bolsa/
│       │   ├── cripto/
│       │   ├── fiis/
│       │   └── renda-fixa/
│       ├── lista-de-desejo/
│       ├── mercado/
│       │   ├── historico/
│       │   ├── listas/
│       │   └── notas/
│       ├── metas/
│       ├── milhas/
│       │   ├── azul/
│       │   ├── latam-pass/
│       │   └── livelo/
│       ├── relatorios/
│       └── configuracoes/
│
├── components/
│   ├── common/       # componentes compartilhados entre módulos
│   ├── dashboard/    # gráficos e cards do dashboard
│   ├── forms/        # formulários React Hook Form + Zod
│   ├── investments/  # hero + componentes de investimentos
│   ├── layout/       # Sidebar, Topbar, MobileNav
│   ├── market/       # hero de mercado
│   ├── mileage/      # hero de milhas
│   ├── pwa/          # registro do service worker
│   └── ui/           # componentes base (Button, Card, Input, Badge)
│
├── lib/
│   ├── utils.ts              # cn(), toMoney(), toPercent()
│   ├── institutions.ts       # mapa nome → instituição financeira
│   ├── icon-registry.ts      # catálogo de ícones disponíveis
│   ├── icon-discovery.ts     # resolução e cache de ícones
│   ├── calculations/         # lógica de cálculos financeiros
│   ├── supabase/
│   │   ├── env.ts            # hasSupabaseEnv() — feature flag
│   │   ├── server.ts         # createServerSupabaseClient()
│   │   └── middleware.ts     # refreshSession() para auth middleware
│   └── validators/
│       └── schemas.ts        # schemas Zod (login, conta, cartão, transação, etc.)
│
├── proxy.ts          # Middleware Next.js — proteção de rotas + refresh de sessão
└── types/
    └── domain.ts     # todos os tipos TypeScript do domínio
```

---

## Fluxo de autenticação

```
Requisição de rota protegida
         │
         ▼
  src/proxy.ts (Middleware)
         │
         ├─ Rota pública? → passa direto
         │
         └─ Rota protegida?
               │
               └─ refreshSession() via Supabase
                       │
                       ├─ Sessão válida → continua
                       │
                       └─ Sem sessão → redirect /login
```

O Middleware (`src/proxy.ts`) usa `createServerSupabaseClient` para tentar fazer refresh do token. Se não houver sessão ativa, redireciona para `/login`. A ação de login (`src/actions/auth.ts`) usa `supabase.auth.signInWithPassword()`.

---

## Padrão de página (Server Component)

Toda página segue este padrão:

```tsx
// src/app/(protected)/algum-modulo/page.tsx
export default async function AlgumModuloPage() {
  // 1. Verificar variáveis de ambiente Supabase
  if (!hasSupabaseEnv()) {
    return <EmptyState mensagem="Configure o Supabase para usar este módulo." />;
  }

  // 2. Criar cliente e buscar usuário
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 3. Buscar dados relevantes ao módulo
  const { data: registros } = await supabase.from("tabela").select("*").eq("user_id", user.id);

  // 4. Calcular métricas (KPIs)
  const total = registros?.reduce(...) ?? 0;

  // 5. Renderizar com ModulePage + Cards + Tabela
  return (
    <main className="space-y-4 p-4">
      <ModulePage title="Módulo > Subpágina" />
      <div className="grid grid-cols-3 gap-3">
        <Card>...</Card>
      </div>
      {/* tabela, lista, formulários */}
    </main>
  );
}
```

---

## Server Actions

Todas as mutações passam por Server Actions em `src/actions/`. Elas:
1. Validam os dados de entrada com o schema Zod correspondente
2. Criam o cliente Supabase via `createServerSupabaseClient()`
3. Verificam `user.id` antes de qualquer escrita
4. Executam a operação no banco via SDK do Supabase
5. Chamam `revalidatePath()` para invalidar o cache da rota afetada
6. Retornam `{ error?: string }` para o client

### Actions disponíveis

| Arquivo | Actions exportadas |
|---|---|
| `auth.ts` | `loginAction`, `logoutAction` |
| `finance.ts` | `upsertBankAccount`, `deleteBankAccount`, `reconcileBankAccount`, `upsertCreditCard`, `deleteCreditCard`, `upsertTransaction`, `deleteTransaction`, `importTransactionsCsv` |
| `goals.ts` | `upsertGoal`, `deleteGoal`, `upsertGoalContribution`, `deleteGoalContribution` |

---

## Componentes compartilhados

### `<ModulePage title="Hub > Página" />`
Header padrão de toda subpágina. Renderiza breadcrumb, botão Voltar e título com gradiente de fundo sutil.

### `<InvestmentClassPage />`
Página completa reutilizada por Bolsa, FIIs, Renda Fixa e Cripto. Recebe `asset_class` como prop e filtra os dados do Supabase.

### `<MileageProgramPage />`
Página completa reutilizada por Livelo, LATAM Pass e Azul. Recebe `programId` e renderiza saldo, KPIs, entradas e meta.

### `<InstitutionAvatar />`
Avatar com logo da instituição financeira. Usa o mapa em `src/lib/institutions.ts`.

---

## Validação de formulários

Todos os formulários usam o par React Hook Form + Zod:

```
src/lib/validators/schemas.ts — define o schema
src/components/forms/           — componente do formulário
src/actions/finance.ts          — action que recebe e valida o FormData
```

Schemas disponíveis: `loginSchema`, `bankAccountSchema`, `bankAccountReconciliationSchema`, `creditCardSchema`, `transactionSchema`, `goalSchema`, `goalContributionSchema`.

---

## Feature flag Supabase

Todas as páginas verificam `hasSupabaseEnv()` (`src/lib/supabase/env.ts`) antes de tentar conectar ao banco. Isso permite rodar o app localmente sem `.env.local` configurado, exibindo um estado vazio em vez de crashar.

---

## PWA

- `public/manifest.webmanifest` — nome, ícones, cores do app
- `public/sw.js` — service worker: cache estático, estratégia cache-first para assets
- `src/components/pwa/register-sw.tsx` — registra o SW no cliente

---

## Convenções de código

- Todas as páginas são **Server Components** (sem `"use client"`)
- Client Components ficam em `src/components/` e são marcados com `"use client"`
- Nomes de arquivos em kebab-case
- Tipos de domínio centralizados em `src/types/domain.ts`
- Imports de alias `@/` configurado no `tsconfig.json`
- Formatação monetária: sempre via `toMoney()` de `src/lib/utils.ts`
- Formatação percentual: sempre via `toPercent()` de `src/lib/utils.ts`
