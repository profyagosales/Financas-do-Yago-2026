import { DashboardChartsShell } from "@/components/dashboard/dashboard-charts-shell";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

async function getDashboardData() {
  if (!hasSupabaseEnv()) {
    return {
      cards: [
        { title: "Saldo consolidado", value: 0 },
        { title: "Total investido", value: 0 },
        { title: "Patrimonio total", value: 0 },
        { title: "Resultado do mes", value: 0 },
        { title: "Cartoes a vencer", value: 0 },
        { title: "Metas ativas", value: 0 },
        { title: "Milhas totais", value: 0 },
        { title: "Lancamentos pendentes", value: 0 },
      ],
      latest: [] as Array<{ id: string; description: string; amount: number; competency_date: string }>,
      hasEnv: false,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      cards: [
        { title: "Saldo consolidado", value: 0 },
        { title: "Total investido", value: 0 },
        { title: "Patrimonio total", value: 0 },
        { title: "Resultado do mes", value: 0 },
        { title: "Cartoes a vencer", value: 0 },
        { title: "Metas ativas", value: 0 },
        { title: "Milhas totais", value: 0 },
        { title: "Lancamentos pendentes", value: 0 },
      ],
      latest: [] as Array<{ id: string; description: string; amount: number; competency_date: string }>,
      hasEnv: true,
    };
  }

  const { start, end } = monthRange();
  const dueLimit = new Date();
  dueLimit.setDate(dueLimit.getDate() + 7);
  const dueLimitDate = dueLimit.toISOString().slice(0, 10);

  const [
    { data: accountsData },
    { data: investmentData },
    { data: txMonthData },
    { data: cardBillsData },
    { data: goalsData },
    { data: mileageData },
    { data: pendingTxData },
    { data: latestData },
  ] = await Promise.all([
    supabase.from("bank_accounts").select("initial_balance").eq("user_id", userId).eq("is_active", true),
    supabase
      .from("investment_transactions")
      .select("transaction_type, total_amount, fees")
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("type, amount, status")
      .eq("user_id", userId)
      .gte("competency_date", start)
      .lt("competency_date", end)
      .neq("status", "canceled"),
    supabase
      .from("card_bills")
      .select("id")
      .eq("user_id", userId)
      .neq("status", "paid")
      .lte("due_date", dueLimitDate),
    supabase
      .from("financial_goals")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase.from("mileage_entries").select("entry_type, points").eq("user_id", userId),
    supabase.from("transactions").select("id").eq("user_id", userId).eq("status", "pending"),
    supabase
      .from("transactions")
      .select("id, description, amount, competency_date")
      .eq("user_id", userId)
      .order("competency_date", { ascending: false })
      .limit(8),
  ]);

  const saldoConsolidado = (accountsData ?? []).reduce((sum, item) => sum + Number(item.initial_balance ?? 0), 0);

  const totalInvestido = (investmentData ?? []).reduce((sum, item) => {
    if (["buy", "deposit"].includes(item.transaction_type)) {
      return sum + Number(item.total_amount ?? 0) + Number(item.fees ?? 0);
    }
    return sum;
  }, 0);

  const receitasMes = (txMonthData ?? [])
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);

  const despesasMes = (txMonthData ?? [])
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + Number(tx.amount ?? 0), 0);

  const milhasTotais = (mileageData ?? []).reduce((sum, item) => {
    const positive = ["earn", "transfer"].includes(item.entry_type);
    return sum + (positive ? Number(item.points ?? 0) : -Number(item.points ?? 0));
  }, 0);

  const cards = [
    { title: "Saldo consolidado", value: saldoConsolidado },
    { title: "Total investido", value: totalInvestido },
    { title: "Patrimonio total", value: saldoConsolidado + totalInvestido },
    { title: "Resultado do mes", value: receitasMes - despesasMes },
    { title: "Cartoes a vencer", value: (cardBillsData ?? []).length },
    { title: "Metas ativas", value: (goalsData ?? []).length },
    { title: "Milhas totais", value: milhasTotais },
    { title: "Lancamentos pendentes", value: (pendingTxData ?? []).length },
  ];

  return {
    cards,
    latest: (latestData ?? []).map((item) => ({
      id: item.id,
      description: item.description,
      amount: Number(item.amount ?? 0),
      competency_date: item.competency_date,
    })),
    hasEnv: true,
  };
}

export default async function DashboardPage() {
  const { cards, latest, hasEnv } = await getDashboardData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black">Dashboard</h1>
        <p className="text-sm text-slate-600">Panorama de contas, cartoes, investimentos, metas e milhas.</p>
      </div>

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar os dados reais do dashboard.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.title} className="bg-gradient-to-br from-white to-slate-50">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.title}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">
              {typeof item.value === "number" && item.value > 1000 ? toMoney(item.value) : item.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Ultimos lancamentos</h3>
        {latest.length === 0 ? (
          <p className="text-sm text-slate-600">Sem lancamentos recentes.</p>
        ) : (
          <div className="space-y-2">
            {latest.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="truncate pr-3 text-slate-700">{item.description}</span>
                <span className="font-semibold text-slate-900">{toMoney(item.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <DashboardChartsShell />
    </div>
  );
}
