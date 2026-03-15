import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TxRow = {
  type: "income" | "expense" | "transfer" | "adjustment";
  amount: number;
  competency_date: string;
};

async function getYearlyData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      rows: [] as TxRow[],
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
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);
  const now = new Date();
  const year = now.getUTCFullYear();
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, competency_date")
    .eq("user_id", userId)
    .gte("competency_date", start)
    .lt("competency_date", end)
    .neq("status", "canceled")
    .order("competency_date", { ascending: true })
    .limit(5000);

  const rows = (data ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount ?? 0),
  })) as TxRow[];

  return {
    hasEnv: true,
    prefs,
    rows,
  };
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function AnualPage() {
  const { hasEnv, prefs, rows } = await getYearlyData();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const monthly = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthRows = rows.filter((row) => {
      const month = new Date(`${row.competency_date}T00:00:00Z`).getUTCMonth();
      return month === monthIndex;
    });

    const income = monthRows
      .filter((row) => row.type === "income")
      .reduce((sum, row) => sum + row.amount, 0);
    const expense = monthRows
      .filter((row) => row.type === "expense")
      .reduce((sum, row) => sum + row.amount, 0);

    return {
      month: MONTHS[monthIndex],
      income,
      expense,
      result: income - expense,
      count: monthRows.length,
    };
  });

  const annualIncome = monthly.reduce((sum, item) => sum + item.income, 0);
  const annualExpense = monthly.reduce((sum, item) => sum + item.expense, 0);
  const annualResult = annualIncome - annualExpense;
  const totalTx = monthly.reduce((sum, item) => sum + item.count, 0);

  const best = [...monthly].sort((a, b) => b.result - a.result)[0];
  const worst = [...monthly].sort((a, b) => a.result - b.result)[0];

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Anual"
        subtitle="Comparativo mes a mes e consolidado anual."
        bullets={[
          "Grafico receitas x despesas",
          "Economia mensal",
          "Ranking de categorias",
          "Total anual consolidado",
        ]}
      />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Exportacao</p>
            <p className="text-xs text-slate-500">Baixe o consolidado anual por mes em CSV.</p>
          </div>
          <a
            href="/api/exports/financas/anual"
            className="rounded-xl bg-sky-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Baixar CSV anual
          </a>
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
          <p className="text-xs uppercase tracking-wide text-slate-500">Receita anual</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(annualIncome)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Despesa anual</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{formatMoney(annualExpense)}</p>
        </Card>
        <Card className={annualResult >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50" : "bg-gradient-to-br from-rose-50 to-orange-50"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Resultado anual</p>
          <p className={"mt-1 text-2xl font-black " + (annualResult >= 0 ? "text-emerald-800" : "text-rose-800")}>
            {formatMoney(annualResult)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Lancamentos no ano</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalTx}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Comparativo mensal</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-slate-200 py-2 pr-3">Mes</th>
                <th className="border-b border-slate-200 py-2 pr-3">Receitas</th>
                <th className="border-b border-slate-200 py-2 pr-3">Despesas</th>
                <th className="border-b border-slate-200 py-2 pr-3">Resultado</th>
                <th className="border-b border-slate-200 py-2 pr-3">Lancamentos</th>
              </tr>
            </thead>
            <tbody>
              {monthly.map((row) => (
                <tr key={row.month}>
                  <td className="border-b border-slate-100 py-2 pr-3 font-medium">{row.month}</td>
                  <td className="border-b border-slate-100 py-2 pr-3 text-emerald-700">{formatMoney(row.income)}</td>
                  <td className="border-b border-slate-100 py-2 pr-3 text-rose-700">{formatMoney(row.expense)}</td>
                  <td className={"border-b border-slate-100 py-2 pr-3 " + (row.result >= 0 ? "text-emerald-800" : "text-rose-800")}>
                    {formatMoney(row.result)}
                  </td>
                  <td className="border-b border-slate-100 py-2 pr-3">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Melhor mes</p>
          <p className="mt-1 text-xl font-black text-emerald-800">{best?.month ?? "-"}</p>
          <p className="text-sm text-slate-700">{best ? formatMoney(best.result) : "-"}</p>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Mes mais desafiador</p>
          <p className="mt-1 text-xl font-black text-rose-800">{worst?.month ?? "-"}</p>
          <p className="text-sm text-slate-700">{worst ? formatMoney(worst.result) : "-"}</p>
        </Card>
      </div>
    </div>
  );
}
