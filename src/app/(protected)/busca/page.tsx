import { ModulePage } from "@/components/common/module-page";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Scope = "all" | "transactions" | "investments" | "goals" | "wishlist" | "market";

type SearchResult = {
  id: string;
  scope: Exclude<Scope, "all">;
  title: string;
  subtitle: string;
  meta: string;
  href: string;
  sortDate: string;
};

type SearchParams = {
  q?: string;
  scope?: Scope;
};

function toLikeQuery(query: string) {
  return `%${query.replace(/[%_]/g, "")}%`;
}

function scopeLabel(scope: Scope) {
  if (scope === "transactions") return "Lançamentos";
  if (scope === "investments") return "Investimentos";
  if (scope === "goals") return "Metas";
  if (scope === "wishlist") return "Lista de Desejo";
  if (scope === "market") return "Mercado";
  return "Tudo";
}

function normalizeScope(value?: string): Scope {
  if (value === "transactions" || value === "investments" || value === "goals" || value === "wishlist" || value === "market") {
    return value;
  }
  return "all";
}

async function getSearchData(query: string, scope: Scope) {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      results: [] as SearchResult[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      results: [] as SearchResult[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  if (query.trim().length < 2) {
    return {
      hasEnv: true,
      prefs,
      results: [] as SearchResult[],
    };
  }

  const like = toLikeQuery(query.trim());
  const shouldRun = (target: Exclude<Scope, "all">) => scope === "all" || scope === target;

  const [transactionsRes, investmentsRes, goalsRes, wishlistRes, marketRes] = await Promise.all([
    shouldRun("transactions")
      ? supabase
          .from("transactions")
          .select("id, description, amount, type, status, competency_date, created_at")
          .eq("user_id", userId)
          .or(`description.ilike.${like},notes.ilike.${like}`)
          .order("competency_date", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    shouldRun("investments")
      ? supabase
          .from("investment_assets")
          .select("id, name, ticker, asset_class, broker, created_at")
          .eq("user_id", userId)
          .or(`name.ilike.${like},ticker.ilike.${like},broker.ilike.${like},notes.ilike.${like}`)
          .order("updated_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    shouldRun("goals")
      ? supabase
          .from("financial_goals")
          .select("id, name, target_amount, status, category, target_date, created_at")
          .eq("user_id", userId)
          .or(`name.ilike.${like},description.ilike.${like},category.ilike.${like}`)
          .order("updated_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    shouldRun("wishlist")
      ? supabase
          .from("wishlist_items")
          .select("id, name, status, current_price, target_price, category, created_at")
          .eq("user_id", userId)
          .or(`name.ilike.${like},category.ilike.${like},store_name.ilike.${like},notes.ilike.${like}`)
          .order("updated_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
    shouldRun("market")
      ? supabase
          .from("grocery_items")
          .select("id, raw_name, establishment, unit_price, was_purchased, created_at")
          .eq("user_id", userId)
          .or(`raw_name.ilike.${like},normalized_name.ilike.${like},establishment.ilike.${like},item_category.ilike.${like}`)
          .order("updated_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const results: SearchResult[] = [];

  for (const row of transactionsRes.data ?? []) {
    results.push({
      id: row.id,
      scope: "transactions",
      title: row.description,
      subtitle: `${row.type} • ${row.status}`,
      meta: `${toMoney(Number(row.amount ?? 0), prefs.locale, prefs.currency)} • ${row.competency_date}`,
      href: "/financas/lancamentos",
      sortDate: row.competency_date ?? row.created_at,
    });
  }

  for (const row of investmentsRes.data ?? []) {
    results.push({
      id: row.id,
      scope: "investments",
      title: row.ticker ? `${row.ticker} - ${row.name}` : row.name,
      subtitle: `${row.asset_class} • ${row.broker ?? "Sem corretora"}`,
      meta: "Ativo de investimento",
      href:
        row.asset_class === "fixed_income"
          ? "/investimentos/renda-fixa"
          : row.asset_class === "fii"
            ? "/investimentos/fiis"
            : row.asset_class === "stock"
              ? "/investimentos/bolsa"
              : "/investimentos/cripto",
      sortDate: row.created_at,
    });
  }

  for (const row of goalsRes.data ?? []) {
    results.push({
      id: row.id,
      scope: "goals",
      title: row.name,
      subtitle: `${row.status} • ${row.category ?? "Sem categoria"}`,
      meta: `Alvo ${toMoney(Number(row.target_amount ?? 0), prefs.locale, prefs.currency)}${row.target_date ? ` • prazo ${row.target_date}` : ""}`,
      href: "/metas",
      sortDate: row.created_at,
    });
  }

  for (const row of wishlistRes.data ?? []) {
    results.push({
      id: row.id,
      scope: "wishlist",
      title: row.name,
      subtitle: `${row.status} • ${row.category ?? "Sem categoria"}`,
      meta:
        row.current_price !== null
          ? `Atual ${toMoney(Number(row.current_price), prefs.locale, prefs.currency)}${row.target_price !== null ? ` • alvo ${toMoney(Number(row.target_price), prefs.locale, prefs.currency)}` : ""}`
          : "Sem preco informado",
      href: "/lista-de-desejo",
      sortDate: row.created_at,
    });
  }

  for (const row of marketRes.data ?? []) {
    results.push({
      id: row.id,
      scope: "market",
      title: row.raw_name ?? "Item sem nome",
      subtitle: `${row.was_purchased ? "Comprado" : "Pendente"} • ${row.establishment ?? "Sem estabelecimento"}`,
      meta: row.unit_price !== null ? `Preco ${toMoney(Number(row.unit_price), prefs.locale, prefs.currency)}` : "Preco não informado",
      href: "/mercado/listas",
      sortDate: row.created_at,
    });
  }

  results.sort((a, b) => b.sortDate.localeCompare(a.sortDate));

  return {
    hasEnv: true,
    prefs,
    results,
  };
}

export default async function BuscaPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const params = (await searchParams) ?? {};
  const query = typeof params.q === "string" ? params.q : "";
  const scope = normalizeScope(params.scope);
  const { hasEnv, results } = await getSearchData(query, scope);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Busca Global"
        subtitle="Pesquisa unificada entre lancamentos, investimentos, metas, lista de desejo e mercado."
        bullets={[
          "Busca textual por nome, descricao, ticker e observacoes",
          "Filtro por modulo para refinar o escopo",
          "Resultados com contexto resumido",
          "Atalho de navegacao para o modulo de origem",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para usar a busca global com dados reais.
          </p>
        </Card>
      ) : null}

      <Card>
        <form action="/busca" method="get" className="grid gap-2 md:grid-cols-[minmax(0,1fr)_200px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Busque por ex: aluguel, PETR4, viagem, mercado"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <select name="scope" defaultValue={scope} className="rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="all">Todos os modulos</option>
            <option value="transactions">Lançamentos</option>
            <option value="investments">Investimentos</option>
            <option value="goals">Metas</option>
            <option value="wishlist">Lista de Desejo</option>
            <option value="market">Mercado</option>
          </select>
          <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Buscar
          </button>
        </form>
      </Card>

      {query.trim().length < 2 ? (
        <Card>
          <p className="text-sm text-slate-600">Digite ao menos 2 caracteres para iniciar a busca.</p>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">Nenhum resultado encontrado para essa busca.</p>
        </Card>
      ) : (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Resultados</h2>
            <p className="text-xs text-slate-500">{results.length} encontrados em {scopeLabel(scope)}</p>
          </div>
          <div className="space-y-2">
            {results.map((item) => (
              <a
                key={`${item.scope}-${item.id}`}
                href={item.href}
                className="block rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-sky-200 hover:bg-sky-50/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <Badge className="border-slate-200 bg-white text-slate-700">{scopeLabel(item.scope)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
                <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}