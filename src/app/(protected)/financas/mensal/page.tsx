import { ModulePage } from "@/components/common/module-page";
import { PrintFiltersModal } from "@/components/common/print-filters-modal";
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
  status: "pending" | "paid" | "overdue" | "canceled";
  category_id: string | null;
};

type CalendarDay = {
  date: string;
  day: number;
  entries: TxRow[];
  income: number;
  expense: number;
  pending: number;
};

function monthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function buildMonthCalendar(rows: TxRow[], year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const byDate = rows.reduce<Record<string, TxRow[]>>((acc, row) => {
    if (!acc[row.competency_date]) acc[row.competency_date] = [];
    acc[row.competency_date].push(row);
    return acc;
  }, {});

  const startPad = (firstDay.getUTCDay() + 6) % 7;
  const cells: Array<CalendarDay | null> = Array.from({ length: startPad }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
    const entries = byDate[date] ?? [];
    const income = entries.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
    const expense = entries.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const pending = entries.filter((item) => item.status === "pending").length;

    cells.push({
      date,
      day,
      entries: entries.sort((a, b) => b.amount - a.amount),
      income,
      expense,
      pending,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

async function getMonthlyData(year: number, month: number) {
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
  const { start, end } = monthRange(year, month);

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

export default async function MensalPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  let selYear = now.getUTCFullYear();
  let selMonth = now.getUTCMonth();
  if (params.month && /^\d{4}-\d{2}$/.test(params.month)) {
    const [py, pm] = params.month.split("-").map(Number);
    selYear = py;
    selMonth = pm - 1;
  }

  const prevDate = new Date(Date.UTC(selYear, selMonth - 1, 1));
  const nextDate = new Date(Date.UTC(selYear, selMonth + 1, 1));
  const prevMonthParam = `${prevDate.getUTCFullYear()}-${String(prevDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextMonthParam = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthLabel = new Date(Date.UTC(selYear, selMonth, 1)).toLocaleDateString("pt-BR", { year: "numeric", month: "long" });

  const { hasEnv, prefs, rows, categoriesMap } = await getMonthlyData(selYear, selMonth);
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const startCurrentMonth = new Date(Date.UTC(selYear, selMonth, 1)).toISOString().slice(0, 10);
  const endCurrentMonth = new Date(Date.UTC(selYear, selMonth + 1, 1)).toISOString().slice(0, 10);

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

  const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const calendarCells = buildMonthCalendar(rows, selYear, selMonth);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Mensal"
        subtitle="Fechamento mensal com filtros e indicadores."
        bullets={[
          "Receitas e despesas do mes",
          "Parcelas apenas na competencia correta",
          "Recorrencias ativas automaticamente",
          "Impressao e calendario financeiro",
        ]}
      />

      <Card className="no-print">
        <div className="flex items-center justify-between gap-4">
          <a
            href={`?month=${prevMonthParam}`}
            className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:opacity-80"
          >
            ← Anterior
          </a>
          <span className="text-sm font-bold capitalize text-[color:var(--foreground)]">{monthLabel}</span>
          <a
            href={`?month=${nextMonthParam}`}
            className="rounded-xl border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:opacity-80"
          >
            Proximo →
          </a>
        </div>
      </Card>

      <Card className="no-print bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_9%,var(--surface)_91%),var(--surface))]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Impressao da visao mensal</p>
              <p className="text-xs text-slate-500">Abra os filtros e gere a pagina pronta para imprimir.</p>
            </div>
            <PrintFiltersModal
              title="Imprimir painel mensal"
              description="Defina intervalo e filtros antes de imprimir o fechamento mensal."
              defaultStart={startCurrentMonth}
              defaultEnd={endCurrentMonth}
            />
          </div>
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
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Receitas do mes</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(receitas)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-orange-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Despesas do mes</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{formatMoney(despesas)}</p>
        </Card>
        <Card className={resultado >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50" : "bg-gradient-to-br from-rose-50 to-orange-50"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Resultado</p>
          <p className={"mt-1 text-2xl font-black " + (resultado >= 0 ? "text-emerald-800" : "text-rose-800")}>
            {formatMoney(resultado)}
          </p>
        </Card>
        <Card className="bg-gradient-to-br from-sky-50 to-cyan-50">
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
                <div key={row.name} className="flex items-center justify-between rounded-lg bg-white/85 px-3 py-2 text-sm">
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
                <div key={row.id} className="flex items-center justify-between rounded-lg bg-white/85 px-3 py-2 text-sm">
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

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">Calendario financeiro do mes</h3>
          <p className="text-xs text-slate-500">Visao por dia com volume e pendencias</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekdayLabels.map((label) => (
            <div key={label} className="rounded-lg bg-slate-100 px-2 py-1 text-center text-xs font-semibold text-slate-600">
              {label}
            </div>
          ))}

          {calendarCells.map((cell, index) => {
            if (!cell) {
              return <div key={`empty-${index}`} className="min-h-28 rounded-lg border border-dashed border-slate-200 bg-slate-50/60" />;
            }

            const net = cell.income - cell.expense;

            return (
              <div key={cell.date} className="min-h-28 rounded-lg border border-slate-200 bg-white p-2">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-700">{cell.day}</p>
                  {cell.pending > 0 ? (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      {cell.pending} pend.
                    </span>
                  ) : null}
                </div>

                {cell.entries.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Sem lancamentos</p>
                ) : (
                  <>
                    <p className={"text-[11px] font-semibold " + (net >= 0 ? "text-emerald-700" : "text-rose-700")}>{formatMoney(net)}</p>
                    <div className="mt-1 space-y-1">
                      {cell.entries.slice(0, 2).map((entry) => (
                        <p key={entry.id} className="truncate text-[10px] text-slate-600" title={entry.description}>
                          {entry.description}
                        </p>
                      ))}
                      {cell.entries.length > 2 ? (
                        <p className="text-[10px] text-slate-500">+{cell.entries.length - 2} itens</p>
                      ) : null}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
