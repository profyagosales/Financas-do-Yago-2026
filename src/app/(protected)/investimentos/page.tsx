import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const items = [
  { label: "Renda Fixa", href: "/investimentos/renda-fixa", desc: "Titulos, CDBs, LCIs, LCAs e outros ativos de renda fixa." },
  { label: "FIIs", href: "/investimentos/fiis", desc: "Fundos imobiliarios e proventos." },
  { label: "Bolsa", href: "/investimentos/bolsa", desc: "Acoes, ETFs, BDRs e demais ativos de bolsa." },
  { label: "Cripto", href: "/investimentos/cripto", desc: "Criptoativos e movimentacoes manuais." },
  { label: "Rebalanceamento", href: "/investimentos/rebalanceamento", desc: "Comparativo da alocacao atual com metas da carteira." },
] as const;

type AssetClass = "fixed_income" | "fii" | "stock" | "crypto";

type AssetRow = {
  id: string;
  asset_class: AssetClass;
  current_value: number | string | null;
};

type TxRow = {
  transaction_type: string;
  total_amount: number | string | null;
  fees: number | string | null;
};

async function getInvestimentosHubData() {
  if (!hasSupabaseEnv()) {
    return {
      prefs: { currency: "BRL", locale: "pt-BR" },
      totalAtivos: 0,
      totalInvestido: 0,
      totalProventos: 0,
      valorAtualInformado: 0,
      classes: { fixed_income: 0, fii: 0, stock: 0, crypto: 0 } as Record<AssetClass, number>,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      prefs: { currency: "BRL", locale: "pt-BR" },
      totalAtivos: 0,
      totalInvestido: 0,
      totalProventos: 0,
      valorAtualInformado: 0,
      classes: { fixed_income: 0, fii: 0, stock: 0, crypto: 0 } as Record<AssetClass, number>,
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data: assets }, { data: txs }] = await Promise.all([
    supabase.from("investment_assets").select("id, asset_class, current_value").eq("user_id", userId),
    supabase.from("investment_transactions").select("transaction_type, total_amount, fees").eq("user_id", userId),
  ]);

  const rows = (assets ?? []) as AssetRow[];
  const classes = rows.reduce<Record<AssetClass, number>>(
    (acc, row) => {
      acc[row.asset_class] += 1;
      return acc;
    },
    { fixed_income: 0, fii: 0, stock: 0, crypto: 0 },
  );

  const totalInvestido = ((txs ?? []) as TxRow[])
    .filter((tx) => tx.transaction_type === "buy" || tx.transaction_type === "deposit")
    .reduce((acc, tx) => acc + Number(tx.total_amount ?? 0) + Number(tx.fees ?? 0), 0);

  const totalProventos = ((txs ?? []) as TxRow[])
    .filter((tx) => tx.transaction_type === "income" || tx.transaction_type === "dividend" || tx.transaction_type === "interest")
    .reduce((acc, tx) => acc + Number(tx.total_amount ?? 0), 0);

  const valorAtualInformado = rows.reduce((acc, row) => acc + Number(row.current_value ?? 0), 0);

  return {
    prefs,
    totalAtivos: rows.length,
    totalInvestido,
    totalProventos,
    valorAtualInformado,
    classes,
  };
}

export default async function InvestimentosPage() {
  const data = await getInvestimentosHubData();
  const formatMoney = (value: number) => toMoney(value, data.prefs.locale, data.prefs.currency);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Investimentos"
        subtitle="Dashboard do modulo. Escolha abaixo o tipo de ativo para entrar no detalhe."
        bullets={[
          "Visao central por classe",
          "Entrada manual de movimentacoes",
          "Indicadores de rentabilidade e participacao",
          "Rebalanceamento da carteira",
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Ativos cadastrados</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.totalAtivos}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total investido</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(data.totalInvestido)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Proventos acumulados</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatMoney(data.totalProventos)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Valor atual informado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(data.valorAtualInformado)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Distribuicao por classe</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Renda fixa: <span className="font-bold">{data.classes.fixed_income}</span></div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">FIIs: <span className="font-bold">{data.classes.fii}</span></div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Bolsa: <span className="font-bold">{data.classes.stock}</span></div>
          <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">Cripto: <span className="font-bold">{data.classes.crypto}</span></div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Acessar classe de investimento</h3>
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
