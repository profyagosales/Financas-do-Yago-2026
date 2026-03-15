import { ModulePage } from "@/components/common/module-page";
import { ExportRangeForm } from "@/components/finance/export-range-form";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TxRow = {
  id: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  description: string;
  amount: number;
  competency_date: string;
  status: "pending" | "paid" | "canceled";
  category_id: string | null;
};

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

async function getMonthlyData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      rows: [] as TxRow[],
      categoriesMap: new Map<string, string>(),
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      rows: [] as TxRow[],
      categoriesMap: new Map<string, string>(),
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);
  const { start, end } = monthRange();

  const [{ data: txData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, description, amount, competency_date, status, category_id")
      .eq("user_id", userId)
      .gte("competency_date", start)
      .lt("competency_date", end)
      .neq("status", "canceled")
      .order("competency_date", { ascending: false })
      .limit(500),
    supabase.from("categories").select("id, name").eq("user_id", userId),
  ]);

  const rows = (txData ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount ?? 0),
  })) as TxRow[];

  const categoriesMap = new Map((categoriesData ?? []).map((c) => [c.id, c.name]));
  return { hasEnv: true, prefs, rows, categoriesMap };
}

export default async function MensalPage() {
  const { hasEnv, prefs, rows, categoriesMap } = await getMonthlyData();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const startCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const endCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const startLast7 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7)).toISOString().slice(0, 10);
  const startLast30 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 30)).toISOString().slice(0, 10);
  const startLast90 = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 90)).toISOString().slice(0, 10);
  const startYtd = `${now.getUTCFullYear()}-01-01`;
  const endTomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)).toISOString().slice(0, 10);
  const exportCurrentMonth = `/api/exports/financas/mensal?start=${startCurrentMonth}&end=${endCurrentMonth}`;
  const exportLast90Days = `/api/exports/financas/mensal?start=${startLast90}&end=${endCurrentMonth}`;
  const presets = [
    { label: "Hoje", href: `/api/exports/financas/mensal?start=${today}&end=${endTomorrow}` },
    { label: "7d", href: `/api/exports/financas/mensal?start=${startLast7}&end=${endTomorrow}` },
    { label: "30d", href: `/api/exports/financas/mensal?start=${startLast30}&end=${endTomorrow}` },
    { label: "YTD", href: `/api/exports/financas/mensal?start=${startYtd}&end=${endTomorrow}` },
  ];

  const receitas = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const despesas = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const resultado = receitas - despesas;
  const pendentes = rows.filter((r) => r.status === "pending").length;

  const expenseByCategory = rows
    .filter((r) => r.type === "expense")
    .reduce<Record<string, number>>((acc, row) => {
      const name = row.category_id ? categoriesMap.get(row.category_id) ?? "Sem categoria" : "Sem categoria";
      acc[name] = (acc[name] ?? 0) + row.amount;
      return acc;
    }, {});

  const topCategories = Object.entries(expenseByCategory)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Mensal"
        subtitle="Fechamento mensal com filtros e indicadores."
        bullets={[
          "Receitas e despesas do mes",
          "Parcelas apenas na competencia correta",
          "Recorrencias ativas automaticamente",
          "Exportacao e calendario financeiro",
        ]}
      />

      <Card>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Exportacao rapida</p>
              <p className="text-xs text-slate-500">Atalhos para periodos mais usados.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={exportCurrentMonth}
                className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
              >
                Baixar CSV do mes
              </a>
              <a
                href={exportLast90Days}
                className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
              >
                Baixar CSV ultimos 90 dias
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">Exportacao por intervalo</p>
            <p className="text-xs text-slate-500">Escolha o periodo manualmente para gerar o CSV.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <a
                key={preset.label}
                href={preset.href}
                className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {preset.label}
              </a>
            ))}
          </div>
          <ExportRangeForm
            action="/api/exports/financas/mensal"
            defaultStart={startCurrentMonth}
            defaultEnd={endCurrentMonth}
            submitLabel="Baixar CSV customizado"
          />
        </div>
      </Card>

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Receitas do mes</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(receitas)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Despesas do mes</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{formatMoney(despesas)}</p>
        </Card>
        <Card className={resultado >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50" : "bg-gradient-to-br from-rose-50 to-orange-50"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Resultado</p>
          <p className={"mt-1 text-2xl font-black " + (resultado >= 0 ? "text-emerald-800" : "text-rose-800")}>
            {formatMoney(resultado)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Lancamentos pendentes</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{pendentes}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Top categorias de despesa</h3>
          {topCategories.length === 0 ? (
            <p className="text-sm text-slate-600">Sem despesas no periodo.</p>
          ) : (
            <div className="space-y-2">
              {topCategories.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-700">{row.name}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(row.total)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Ultimos lancamentos do mes</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-600">Nenhum lancamento no mes atual.</p>
          ) : (
            <div className="space-y-2">
              {rows.slice(0, 12).map((row) => (
                <div key={row.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{row.description}</p>
                    <p className="text-xs text-slate-500">{row.competency_date} • {row.type} • {row.status}</p>
                  </div>
                  <span className={row.type === "expense" ? "font-semibold text-rose-700" : "font-semibold text-slate-900"}>
                    {formatMoney(row.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
