import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const items = [
  { label: "Mensal", href: "/financas/mensal", desc: "Fechamento mensal com receitas, despesas e saldo." },
  { label: "Anual", href: "/financas/anual", desc: "Comparativo anual e sazonalidade dos lancamentos." },
  { label: "Contas", href: "/financas/contas", desc: "Gestao de contas e conciliacao manual." },
  { label: "Cartoes", href: "/financas/cartoes", desc: "Limites, faturas e compras por cartao." },
  { label: "Lancamentos", href: "/financas/lancamentos", desc: "CRUD completo de transacoes com anexos e tags." },
  { label: "Categorias", href: "/financas/categorias", desc: "Cadastro e manutencao de categorias." },
] as const;

type TxRow = {
  type: string;
  amount: number | string | null;
  competency_date: string;
  status: string;
};

async function getFinancasHubData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      contasAtivas: 0,
      cartoesAtivos: 0,
      categoriasAtivas: 0,
      transacoesMes: 0,
      saldoMes: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      contasAtivas: 0,
      cartoesAtivos: 0,
      categoriasAtivas: 0,
      transacoesMes: 0,
      saldoMes: 0,
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartIso = monthStart.toISOString().slice(0, 10);

  const [{ data: contas }, { data: cartoes }, { data: categorias }, { data: txs }] = await Promise.all([
    supabase.from("bank_accounts").select("id").eq("user_id", userId).eq("is_active", true),
    supabase.from("credit_cards").select("id").eq("user_id", userId).eq("is_active", true),
    supabase.from("categories").select("id").eq("user_id", userId).eq("is_active", true),
    supabase
      .from("transactions")
      .select("type, amount, competency_date, status")
      .eq("user_id", userId)
      .gte("competency_date", monthStartIso),
  ]);

  const transacoes = (txs ?? []) as TxRow[];
  const transacoesMes = transacoes.length;
  const saldoMes = transacoes.reduce((acc, tx) => {
    if (tx.status === "canceled") return acc;
    const amount = Number(tx.amount ?? 0);
    if (tx.type === "income" || tx.type === "adjustment") return acc + amount;
    if (tx.type === "expense") return acc - amount;
    return acc;
  }, 0);

  return {
    hasEnv: true,
    prefs,
    contasAtivas: (contas ?? []).length,
    cartoesAtivos: (cartoes ?? []).length,
    categoriasAtivas: (categorias ?? []).length,
    transacoesMes,
    saldoMes,
  };
}

export default async function FinancasPage() {
  const data = await getFinancasHubData();
  const formatMoney = (value: number) => toMoney(value, data.prefs.locale, data.prefs.currency);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas"
        subtitle="Dashboard do modulo. Entre no subdominio desejado pelos atalhos abaixo."
        bullets={[
          "Visao mensal e anual",
          "Contas, cartoes e lancamentos",
          "Categorias e filtros",
          "Base central do fluxo financeiro",
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
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
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Transacoes no mes</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.transacoesMes}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Saldo do mes</p>
          <p className={`mt-1 text-2xl font-black ${data.saldoMes >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {formatMoney(data.saldoMes)}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Submodulos de financas</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition hover:bg-[color:var(--button-ghost-hover)]"
            >
              <p className="text-base font-bold text-[color:var(--foreground)]">{item.label}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
