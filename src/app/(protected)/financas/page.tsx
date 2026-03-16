import { ModulePage } from "@/components/common/module-page";
import { FinanceHubHero } from "@/components/finance/finance-hub-hero";
import { Card } from "@/components/ui/card";
import { getUserTags } from "@/actions/tags";
import { getIconsByDomains } from "@/lib/icon-registry";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type TxRow = {
  id: string;
  type: "income" | "expense" | "transfer" | "adjustment";
  amount: number;
  description: string;
  competency_date: string;
  status: "pending" | "paid" | "overdue" | "canceled";
  category_id: string | null;
  account_id: string | null;
  credit_card_id: string | null;
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

  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

async function getFinancasFormOptions() {
  if (!hasSupabaseEnv()) {
    return { categories: [], accounts: [], cards: [], icons: [], tags: [] };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { categories: [], accounts: [], cards: [], icons: [], tags: [] };
  }

  const [{ data: categoriesData }, { data: accountsData }, { data: cardsData }, tagsData] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("bank_accounts")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("credit_cards")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    getUserTags(),
  ]);

  return {
    categories: (categoriesData ?? []).map((item) => ({ id: item.id, label: item.name, type: item.type })),
    accounts: (accountsData ?? []).map((item) => ({ id: item.id, label: item.name })),
    cards: (cardsData ?? []).map((item) => ({ id: item.id, label: item.name })),
    icons: getIconsByDomains(["expense", "subscription", "saas", "market", "transport", "utility", "telecom", "insurance", "ecommerce", "mileage", "airline", "crypto", "broker", "wallet"]).map((item) => ({
      id: item.id,
      label: `${item.name} (${item.domain})`,
    })),
    tags: tagsData,
  };
}

async function getFinancasInlineData(params: {
  start: string;
  end: string;
  filterType?: string;
  filterStatus?: string;
  filterCategoryId?: string;
  filterAccountId?: string;
  filterCardId?: string;
}) {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      rows: [] as TxRow[],
      contasAtivas: 0,
      cartoesAtivos: 0,
      categoriasAtivas: 0,
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
      contasAtivas: 0,
      cartoesAtivos: 0,
      categoriasAtivas: 0,
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  let txQuery = supabase
    .from("transactions")
    .select("id, type, amount, description, competency_date, status, category_id, account_id, credit_card_id")
    .eq("user_id", userId)
    .gte("competency_date", params.start)
    .lt("competency_date", params.end)
    .order("competency_date", { ascending: false })
    .limit(5000);

  if (params.filterType && params.filterType !== "all") txQuery = txQuery.eq("type", params.filterType);
  if (params.filterStatus && params.filterStatus !== "all") txQuery = txQuery.eq("status", params.filterStatus);
  if (params.filterCategoryId) txQuery = txQuery.eq("category_id", params.filterCategoryId);
  if (params.filterAccountId) txQuery = txQuery.eq("account_id", params.filterAccountId);
  if (params.filterCardId) txQuery = txQuery.eq("credit_card_id", params.filterCardId);

  const [{ data: txData }, { data: contas }, { data: cartoes }, { data: categorias }] = await Promise.all([
    txQuery,
    supabase.from("bank_accounts").select("id").eq("user_id", userId).eq("is_active", true),
    supabase.from("credit_cards").select("id").eq("user_id", userId).eq("is_active", true),
    supabase.from("categories").select("id").eq("user_id", userId).eq("is_active", true),
  ]);

  const rows = (txData ?? []).map((item) => ({ ...item, amount: Number(item.amount ?? 0) })) as TxRow[];

  return {
    hasEnv: true,
    prefs,
    rows,
    contasAtivas: (contas ?? []).length,
    cartoesAtivos: (cartoes ?? []).length,
    categoriasAtivas: (categorias ?? []).length,
  };
}

export default async function FinancasPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    month?: string;
    year?: string;
    type?: string;
    status?: string;
    category_id?: string;
    account_id?: string;
    card_id?: string;
  }>;
}) {
  const params = await searchParams;
  const now = new Date();

  const monthParam = params.month && /^\d{4}-\d{2}$/.test(params.month)
    ? params.month
    : `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const yearParam = params.year && /^\d{4}$/.test(params.year) ? params.year : String(now.getUTCFullYear());
  const viewMode = params.view === "year" ? "year" : "month";

  const [monthYear, monthNumber] = monthParam.split("-").map(Number);
  const monthIndex = monthNumber - 1;
  const yearNumber = Number(yearParam);

  const monthRangeValue = monthRange(monthYear, monthIndex);
  const start = viewMode === "year" ? `${yearNumber}-01-01` : monthRangeValue.start;
  const end = viewMode === "year" ? `${yearNumber + 1}-01-01` : monthRangeValue.end;

  const [options, data] = await Promise.all([
    getFinancasFormOptions(),
    getFinancasInlineData({
      start,
      end,
      filterType: params.type,
      filterStatus: params.status,
      filterCategoryId: params.category_id,
      filterAccountId: params.account_id,
      filterCardId: params.card_id,
    }),
  ]);

  const formatMoney = (value: number) => toMoney(value, data.prefs.locale, data.prefs.currency);

  const receitas = data.rows.filter((r) => r.type === "income" || r.type === "adjustment").reduce((s, r) => s + r.amount, 0);
  const despesas = data.rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const resultado = receitas - despesas;
  const pendentes = data.rows.filter((r) => r.status === "pending").length;

  const categoriesMap = new Map(options.categories.map((item) => [item.id, item.label]));
  const accountsMap = new Map(options.accounts.map((item) => [item.id, item.label]));
  const cardsMap = new Map(options.cards.map((item) => [item.id, item.label]));

  const calendarRows = viewMode === "month"
    ? data.rows
    : data.rows.filter((row) => new Date(`${row.competency_date}T00:00:00Z`).getUTCMonth() === monthIndex);
  const calendarCells = buildMonthCalendar(calendarRows, monthYear, monthIndex);

  const weekdayLabels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
  const annualByMonth = Array.from({ length: 12 }, (_, idx) => {
    const monthRows = data.rows.filter((row) => new Date(`${row.competency_date}T00:00:00Z`).getUTCMonth() === idx);
    const income = monthRows.filter((row) => row.type === "income" || row.type === "adjustment").reduce((sum, row) => sum + row.amount, 0);
    const expense = monthRows.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.amount, 0);
    return {
      month: new Date(Date.UTC(2026, idx, 1)).toLocaleDateString("pt-BR", { month: "short" }),
      income,
      expense,
      result: income - expense,
      count: monthRows.length,
    };
  });

  return (
    <div className="space-y-4">
      <ModulePage title="Financas" />

      <FinanceHubHero
        viewMode={viewMode}
        monthParam={monthParam}
        yearParam={yearParam}
        categories={options.categories}
        accounts={options.accounts}
        cards={options.cards}
        icons={options.icons}
        tags={options.tags}
      />

      {!data.hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.</p>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Receitas</p>
              <p className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(receitas)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Despesas</p>
              <p className="mt-1 text-2xl font-black text-rose-700">{formatMoney(despesas)}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Resultado</p>
              <p className={`mt-1 text-2xl font-black ${resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                {formatMoney(resultado)}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Pendentes</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{pendentes}</p>
            </Card>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Contas ativas</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{data.contasAtivas}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Cartoes ativos</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{data.cartoesAtivos}</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-slate-500">Categorias ativas</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{data.categoriasAtivas}</p>
            </Card>
          </div>

          {viewMode === "year" ? (
            <Card>
              <h3 className="mb-3 text-sm font-bold text-slate-700">Resumo anual por mes</h3>
              <div className="space-y-2">
                {annualByMonth.map((row) => (
                  <div key={row.month} className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
                    <span className="font-semibold text-slate-700">{row.month}</span>
                    <span className="text-slate-600">{row.count} itens</span>
                    <span className={row.result >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                      {formatMoney(row.result)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">Lancamentos exibidos</h3>
            <span className="text-xs text-slate-500">{data.rows.length} itens no periodo</span>
          </div>

          <form method="get" className="no-print mb-3 grid gap-2 sm:grid-cols-2">
            <input type="hidden" name="view" value={viewMode} />
            <input type="hidden" name="month" value={monthParam} />
            <input type="hidden" name="year" value={yearParam} />

            <select name="category_id" defaultValue={params.category_id ?? ""} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
              <option value="">Todas as categorias</option>
              {options.categories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>

            <select name="account_id" defaultValue={params.account_id ?? ""} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
              <option value="">Todas as contas</option>
              {options.accounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>

            <select name="card_id" defaultValue={params.card_id ?? ""} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
              <option value="">Todos os cartoes</option>
              {options.cards.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>

            <select name="type" defaultValue={params.type ?? "all"} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
              <option value="all">Todos os tipos</option>
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
              <option value="transfer">Transferencia</option>
              <option value="adjustment">Ajuste</option>
            </select>

            <select name="status" defaultValue={params.status ?? "all"} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="canceled">Cancelado</option>
            </select>

            <button type="submit" className="rounded-xl bg-[color:var(--button-primary-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--button-primary-fg)] hover:bg-[color:var(--button-primary-hover)]">
              Filtrar
            </button>
          </form>

          <div className="space-y-2">
            {data.rows.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum lancamento para o filtro aplicado.</p>
            ) : (
              data.rows.slice(0, 24).map((row) => (
                <div key={row.id} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{row.description}</p>
                    <span className={row.type === "expense" ? "font-semibold text-rose-700" : "font-semibold text-emerald-700"}>
                      {row.type === "expense" ? "-" : "+"}{formatMoney(row.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {row.competency_date}
                    {row.category_id ? ` • ${categoriesMap.get(row.category_id) ?? "Sem categoria"}` : ""}
                    {row.account_id ? ` • ${accountsMap.get(row.account_id) ?? "Conta"}` : ""}
                    {row.credit_card_id ? ` • ${cardsMap.get(row.credit_card_id) ?? "Cartao"}` : ""}
                    {` • ${row.status}`}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-700">Calendario financeiro do mes selecionado</h3>
          <p className="text-xs text-slate-500">{monthParam}</p>
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
                    <p className={`text-[11px] font-semibold ${net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatMoney(net)}</p>
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
