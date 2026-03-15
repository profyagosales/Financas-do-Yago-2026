import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

type MonthlyTx = { type: "income" | "expense" | "transfer" | "adjustment"; amount: number };

type CategoryAgg = { name: string; total: number };
type BillAgg = { card_name: string; reference_month: string; total_amount: number; status: string };
type InvClassAgg = { asset_class: string; invested: number; sold: number; income: number };
type MileageAgg = { name: string; balance: number; earned: number; redeemed: number };

async function getReportsData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      monthly: { income: 0, expense: 0, result: 0 },
      categories: [] as CategoryAgg[],
      bills: [] as BillAgg[],
      invByClass: [] as InvClassAgg[],
      mileageByProgram: [] as MileageAgg[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      monthly: { income: 0, expense: 0, result: 0 },
      categories: [] as CategoryAgg[],
      bills: [] as BillAgg[],
      invByClass: [] as InvClassAgg[],
      mileageByProgram: [] as MileageAgg[],
    };
  }

  const { start, end } = monthRange();

  const [
    { data: monthTxData },
    { data: expenseTxData },
    { data: categoriesData },
    { data: billsData },
    { data: assetsData },
    { data: invTxData },
    { data: mileageProgramsData },
    { data: mileageEntriesData },
    { data: profileData },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("competency_date", start)
      .lt("competency_date", end)
      .neq("status", "canceled"),
    supabase
      .from("transactions")
      .select("amount, category_id")
      .eq("user_id", userId)
      .eq("type", "expense")
      .neq("status", "canceled")
      .gte("competency_date", start)
      .lt("competency_date", end),
    supabase.from("categories").select("id, name").eq("user_id", userId),
    supabase
      .from("card_bills")
      .select("credit_card_id, reference_month, total_amount, status")
      .eq("user_id", userId)
      .order("reference_month", { ascending: false })
      .limit(24),
    supabase.from("investment_assets").select("id, asset_class").eq("user_id", userId),
    supabase
      .from("investment_transactions")
      .select("asset_id, transaction_type, total_amount, fees")
      .eq("user_id", userId)
      .limit(5000),
    supabase.from("mileage_programs").select("id, name").eq("user_id", userId),
    supabase
      .from("mileage_entries")
      .select("program_id, entry_type, points")
      .eq("user_id", userId)
      .limit(5000),
    supabase.from("profiles").select("currency, locale").eq("id", userId).maybeSingle(),
  ]);

  const monthRows = (monthTxData ?? []).map((item) => ({
    type: item.type,
    amount: Number(item.amount ?? 0),
  })) as MonthlyTx[];

  const monthlyIncome = monthRows
    .filter((row) => row.type === "income")
    .reduce((sum, row) => sum + row.amount, 0);
  const monthlyExpense = monthRows
    .filter((row) => row.type === "expense")
    .reduce((sum, row) => sum + row.amount, 0);

  const categoriesMap = new Map((categoriesData ?? []).map((c) => [c.id, c.name]));
  const expenseRows = (expenseTxData ?? []).map((item) => ({
    amount: Number(item.amount ?? 0),
    category_id: item.category_id as string | null,
  }));

  const categoryAggMap = expenseRows.reduce<Record<string, number>>((acc, row) => {
    const name = (row.category_id ? categoriesMap.get(row.category_id) : null) ?? "Sem categoria";
    acc[name] = (acc[name] ?? 0) + row.amount;
    return acc;
  }, {});

  const categories = Object.entries(categoryAggMap)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const cardsMap = new Map<string, string>();
  const { data: cardsData } = await supabase.from("credit_cards").select("id, name").eq("user_id", userId);
  for (const card of cardsData ?? []) cardsMap.set(card.id, card.name);

  const bills = (billsData ?? []).map((row) => ({
    card_name: cardsMap.get(row.credit_card_id) ?? "Cartao removido",
    reference_month: row.reference_month,
    total_amount: Number(row.total_amount ?? 0),
    status: row.status,
  })) as BillAgg[];

  const assetClassById = new Map((assetsData ?? []).map((a) => [a.id, a.asset_class]));
  const invByClassMap = (invTxData ?? []).reduce<Record<string, InvClassAgg>>((acc, row) => {
    const cls = assetClassById.get(row.asset_id) ?? "unknown";
    if (!acc[cls]) {
      acc[cls] = { asset_class: cls, invested: 0, sold: 0, income: 0 };
    }

    const amount = Number(row.total_amount ?? 0);
    const fees = Number(row.fees ?? 0);

    if (row.transaction_type === "buy" || row.transaction_type === "deposit") {
      acc[cls].invested += amount + fees;
    } else if (row.transaction_type === "sell" || row.transaction_type === "withdraw") {
      acc[cls].sold += Math.max(amount - fees, 0);
    } else if (
      row.transaction_type === "income" ||
      row.transaction_type === "dividend" ||
      row.transaction_type === "interest"
    ) {
      acc[cls].income += amount;
    }

    return acc;
  }, {});

  const invByClass = Object.values(invByClassMap).sort((a, b) => b.invested - a.invested);

  const mileageNameById = new Map((mileageProgramsData ?? []).map((p) => [p.id, p.name]));
  const mileageByProgramMap = (mileageEntriesData ?? []).reduce<Record<string, MileageAgg>>((acc, row) => {
    const name = mileageNameById.get(row.program_id) ?? "Programa removido";
    if (!acc[name]) {
      acc[name] = { name, balance: 0, earned: 0, redeemed: 0 };
    }

    const points = Number(row.points ?? 0);
    const positive = row.entry_type === "earn" || row.entry_type === "transfer";
    acc[name].balance += positive ? points : -points;

    if (positive) acc[name].earned += points;
    if (row.entry_type === "redeem") acc[name].redeemed += points;

    return acc;
  }, {});

  const mileageByProgram = Object.values(mileageByProgramMap).sort((a, b) => b.balance - a.balance);

  return {
    hasEnv: true,
    prefs: {
      currency: (profileData?.currency as string) ?? "BRL",
      locale: (profileData?.locale as string) ?? "pt-BR",
    },
    monthly: {
      income: monthlyIncome,
      expense: monthlyExpense,
      result: monthlyIncome - monthlyExpense,
    },
    categories,
    bills,
    invByClass,
    mileageByProgram,
  };
}

function classLabel(assetClass: string) {
  if (assetClass === "fixed_income") return "Renda Fixa";
  if (assetClass === "fii") return "FIIs";
  if (assetClass === "stock") return "Bolsa";
  if (assetClass === "crypto") return "Cripto";
  return assetClass;
}

export default async function RelatoriosPage() {
  const { hasEnv, prefs, monthly, categories, bills, invByClass, mileageByProgram } = await getReportsData();

  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);
  const formatNumber = (value: number) => new Intl.NumberFormat(prefs.locale).format(value);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Relatorios"
        subtitle="Consolidacao de indicadores financeiros por modulo."
        bullets={[
          "Fluxo do mes (receitas, despesas e resultado)",
          "Top categorias de despesa",
          "Cartoes por referencia e status",
          "Investimentos por classe e milhas por programa",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar os dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Receitas do mes</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(monthly.income)}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Despesas do mes</p>
          <p className="mt-1 text-2xl font-black text-rose-700">{formatMoney(monthly.expense)}</p>
        </Card>
        <Card className={monthly.result >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50" : "bg-gradient-to-br from-rose-50 to-orange-50"}>
          <p className="text-xs uppercase tracking-wide text-slate-500">Resultado do mes</p>
          <p className={"mt-1 text-2xl font-black " + (monthly.result >= 0 ? "text-emerald-800" : "text-rose-800")}>
            {formatMoney(monthly.result)}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Top despesas por categoria (mes)</h3>
          {categories.length === 0 ? (
            <p className="text-sm text-slate-600">Sem despesas no periodo.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-700">{row.name}</span>
                  <span className="font-semibold text-slate-900">{formatMoney(row.total)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Milhas por programa</h3>
          {mileageByProgram.length === 0 ? (
            <p className="text-sm text-slate-600">Sem movimentacoes de milhas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Programa</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Saldo</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Acumulado</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Resgatado</th>
                  </tr>
                </thead>
                <tbody>
                  {mileageByProgram.map((row) => (
                    <tr key={row.name}>
                      <td className="border-b border-slate-100 py-2 pr-3">{row.name}</td>
                      <td className="border-b border-slate-100 py-2 pr-3 font-semibold">{formatNumber(row.balance)}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{formatNumber(row.earned)}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{formatNumber(row.redeemed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Cartoes por referencia</h3>
          {bills.length === 0 ? (
            <p className="text-sm text-slate-600">Sem faturas encontradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Cartao</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Referencia</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Total</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.slice(0, 12).map((row, idx) => (
                    <tr key={`${row.card_name}-${row.reference_month}-${idx}`}>
                      <td className="border-b border-slate-100 py-2 pr-3">{row.card_name}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{row.reference_month}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(row.total_amount)}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-bold text-slate-700">Investimentos por classe</h3>
          {invByClass.length === 0 ? (
            <p className="text-sm text-slate-600">Sem movimentacoes de investimentos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-slate-500">
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Classe</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Investido</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Resgatado</th>
                    <th className="border-b border-slate-200 py-2 pr-3 font-medium">Proventos</th>
                  </tr>
                </thead>
                <tbody>
                  {invByClass.map((row) => (
                    <tr key={row.asset_class}>
                      <td className="border-b border-slate-100 py-2 pr-3">{classLabel(row.asset_class)}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(row.invested)}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(row.sold)}</td>
                      <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(row.income)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
