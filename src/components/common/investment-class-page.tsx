import {
  deleteInvestmentAsset,
  deleteInvestmentTransaction,
  setInvestmentAssetCurrentValue,
} from "@/actions/investments";
import { InvestmentAssetForm } from "@/components/forms/investment-asset-form";
import { InvestmentTransactionForm } from "@/components/forms/investment-transaction-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

type AssetClass = "fixed_income" | "fii" | "stock" | "crypto";

type AssetRow = {
  id: string;
  name: string;
  ticker: string | null;
  asset_subtype: string | null;
  broker: string | null;
  currency: string;
  current_value: number | null;
};

type TxRow = {
  id: string;
  asset_id: string;
  transaction_type: string;
  transaction_date: string;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number;
  fees: number;
  notes: string | null;
};

type AssetPosition = AssetRow & {
  total_invested: number;
  total_sold: number;
  income_total: number;
  qty_bought: number;
  qty_sold: number;
  net_qty: number;
  avg_cost: number;
  cost_basis: number;
  market_value: number;
  nominal_return: number;
  return_pct: number;
  participation_pct: number;
  last_date: string | null;
};

const BUY_TYPES = new Set(["buy", "deposit"]);
const SELL_TYPES = new Set(["sell", "withdraw"]);
const INCOME_TYPES = new Set(["income", "dividend", "interest"]);
const BONUS_TYPES = new Set(["bonus"]);

function computePositions(assets: AssetRow[], txs: TxRow[]): AssetPosition[] {
  const txByAsset = txs.reduce<Record<string, TxRow[]>>((acc, tx) => {
    if (!acc[tx.asset_id]) acc[tx.asset_id] = [];
    acc[tx.asset_id].push(tx);
    return acc;
  }, {});

  const basePositions = assets.map((asset) => {
    const assetTxs = txByAsset[asset.id] ?? [];

    const buyTxs = assetTxs.filter((t) => BUY_TYPES.has(t.transaction_type));
    const sellTxs = assetTxs.filter((t) => SELL_TYPES.has(t.transaction_type));
    const incomeTxs = assetTxs.filter((t) => INCOME_TYPES.has(t.transaction_type));
    const bonusTxs = assetTxs.filter((t) => BONUS_TYPES.has(t.transaction_type));

    const total_invested = buyTxs.reduce((s, t) => s + t.total_amount + t.fees, 0);
    const total_sold = sellTxs.reduce((s, t) => s + t.total_amount - t.fees, 0);
    const income_total = incomeTxs.reduce((s, t) => s + t.total_amount, 0);

    const qty_bought = buyTxs.reduce((s, t) => s + (t.quantity ?? 0), 0);
    const qty_sold = sellTxs.reduce((s, t) => s + (t.quantity ?? 0), 0);
    const qty_bonus = bonusTxs.reduce((s, t) => s + (t.quantity ?? 0), 0);
    const net_qty = qty_bought + qty_bonus - qty_sold;
    const avg_cost = qty_bought > 0 ? total_invested / qty_bought : 0;
    const sold_cost = qty_bought > 0 ? avg_cost * qty_sold : 0;
    const cost_basis = Math.max(total_invested - sold_cost, 0);
    const market_value = asset.current_value ?? (net_qty > 0 ? avg_cost * net_qty : 0);
    const nominal_return = market_value + total_sold + income_total - total_invested;
    const return_pct = total_invested > 0 ? (nominal_return / total_invested) * 100 : 0;

    const sorted = [...assetTxs].sort((a, b) =>
      b.transaction_date.localeCompare(a.transaction_date),
    );
    const last_date = sorted[0]?.transaction_date ?? null;

    return {
      ...asset,
      total_invested,
      total_sold,
      income_total,
      qty_bought,
      qty_sold,
      net_qty,
      avg_cost,
      cost_basis,
      market_value,
      nominal_return,
      return_pct,
      participation_pct: 0,
      last_date,
    };
  });

  const totalMarketValue = basePositions.reduce((sum, p) => sum + p.market_value, 0);
  return basePositions.map((position) => ({
    ...position,
    participation_pct: totalMarketValue > 0 ? (position.market_value / totalMarketValue) * 100 : 0,
  }));
}

async function getPageData(assetClass: AssetClass) {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      assets: [] as AssetRow[],
      txs: [] as TxRow[],
      positions: [] as AssetPosition[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      assets: [] as AssetRow[],
      txs: [] as TxRow[],
      positions: [] as AssetPosition[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data: assetsData }, { data: txsData }] = await Promise.all([
    supabase
      .from("investment_assets")
      .select("id, name, ticker, asset_subtype, broker, currency, current_value")
      .eq("user_id", userId)
      .eq("asset_class", assetClass)
      .order("name", { ascending: true }),
    supabase
      .from("investment_transactions")
      .select("id, asset_id, transaction_type, transaction_date, quantity, unit_price, total_amount, fees, notes")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(1000),
  ]);

  const assets = (assetsData ?? []) as AssetRow[];
  const assetIds = new Set(assets.map((a) => a.id));

  const txs = ((txsData ?? []) as TxRow[])
    .filter((t) => assetIds.has(t.asset_id))
    .map((t) => ({
      ...t,
      quantity: t.quantity == null ? null : Number(t.quantity),
      unit_price: t.unit_price == null ? null : Number(t.unit_price),
      total_amount: Number(t.total_amount),
      fees: Number(t.fees),
    }));

  const positions = computePositions(assets, txs);
  return { hasEnv: true, prefs, assets, txs, positions };
}

const TX_TYPE_LABELS: Record<string, string> = {
  buy: "Compra",
  sell: "Venda",
  deposit: "Deposito",
  withdraw: "Resgate",
  income: "Rendimento",
  dividend: "Dividendo",
  interest: "Juros",
  adjustment: "Ajuste",
  bonus: "Bonificacao",
};

interface Props {
  assetClass: AssetClass;
  title: string;
  subtitle: string;
}

export async function InvestmentClassPage({ assetClass, title, subtitle }: Props) {
  const { hasEnv, prefs, assets, txs, positions } = await getPageData(assetClass);
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);
  const formatQty = (value: number) =>
    value.toLocaleString(prefs.locale, { maximumFractionDigits: 8 });

  const totalInvested = positions.reduce((s, p) => s + p.total_invested, 0);
  const totalSold = positions.reduce((s, p) => s + p.total_sold, 0);
  const totalIncome = positions.reduce((s, p) => s + p.income_total, 0);
  const totalMarketValue = positions.reduce((s, p) => s + p.market_value, 0);
  const totalNominalReturn = positions.reduce((s, p) => s + p.nominal_return, 0);
  const totalReturnPct = totalInvested > 0 ? (totalNominalReturn / totalInvested) * 100 : 0;

  const assetOptions = assets.map((a) => ({
    id: a.id,
    label: a.ticker ? `${a.ticker} — ${a.name}` : a.name,
  }));

  const recentTxs = [...txs]
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
    .slice(0, 50);

  const assetMap = new Map(assets.map((a) => [a.id, a]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Investimentos › {title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {!hasEnv && (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ativos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{assets.length}</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total investido</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(totalInvested)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total resgatado</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(totalSold)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Proventos recebidos</p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{formatMoney(totalIncome)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Valor atual</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(totalMarketValue)}</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 lg:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Rentabilidade nominal</p>
          <p className={`mt-1 text-2xl font-black ${totalNominalReturn >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {totalNominalReturn >= 0 ? "+" : ""}{formatMoney(totalNominalReturn)}
          </p>
          <p className={`text-xs font-semibold ${totalNominalReturn >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            {totalReturnPct >= 0 ? "+" : ""}
            {totalReturnPct.toLocaleString(prefs.locale, { maximumFractionDigits: 2 })}%
          </p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Cadastrar ativo
          </h2>
          <InvestmentAssetForm assetClass={assetClass} />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Registrar movimentacao
          </h2>
          <InvestmentTransactionForm assets={assetOptions} />
        </div>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Posicao por ativo</h3>
        {positions.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhum ativo cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Ativo</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Ticker</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Corretora</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Investido</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Resgatado</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Proventos</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Valor atual</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Rentab.</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Partic.</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Qtd liq.</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Custo medio</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Ultima mov.</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-slate-50">
                    <td className="border-b border-slate-100 py-2 pr-3 font-medium">{pos.name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 font-mono text-slate-500">
                      {pos.ticker ?? "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 text-slate-600">
                      {pos.broker ?? "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                      {formatMoney(pos.total_invested)}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                      {formatMoney(pos.total_sold)}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums text-emerald-700">
                      {formatMoney(pos.income_total)}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                      <form className="flex items-center gap-2" action={setInvestmentAssetCurrentValue.bind(null, pos.id)}>
                        <input
                          name="current_value"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={pos.current_value ?? undefined}
                          placeholder={pos.market_value > 0 ? pos.market_value.toFixed(2) : "0.00"}
                          className="w-28 rounded-lg border border-slate-300 px-2 py-1 text-xs"
                        />
                        <Button type="submit" variant="secondary">
                          Salvar
                        </Button>
                      </form>
                    </td>
                    <td className={`border-b border-slate-100 py-2 pr-3 tabular-nums ${pos.nominal_return >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {pos.nominal_return >= 0 ? "+" : ""}
                      {formatMoney(pos.nominal_return)}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                      {pos.participation_pct.toLocaleString(prefs.locale, { maximumFractionDigits: 2 })}%
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                      {pos.net_qty > 0
                        ? formatQty(pos.net_qty)
                        : "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                      {pos.avg_cost > 0 ? formatMoney(pos.avg_cost) : "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3 text-slate-500">
                      {pos.last_date ?? "—"}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <form action={deleteInvestmentAsset.bind(null, pos.id)}>
                        <Button type="submit" variant="ghost">
                          Excluir
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          Ultimas movimentacoes
        </h3>
        {recentTxs.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma movimentacao registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Data</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Ativo</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Tipo</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Qtd</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Preco un.</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Total</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Taxas</th>
                  <th className="border-b border-slate-200 py-2 pr-3 font-medium">Acao</th>
                </tr>
              </thead>
              <tbody>
                {recentTxs.map((tx) => {
                  const asset = assetMap.get(tx.asset_id);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 py-2 pr-3">{tx.transaction_date}</td>
                      <td className="border-b border-slate-100 py-2 pr-3 font-mono text-slate-600">
                        {asset?.ticker ?? asset?.name ?? "—"}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3">
                        {TX_TYPE_LABELS[tx.transaction_type] ?? tx.transaction_type}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                        {tx.quantity != null
                          ? formatQty(tx.quantity)
                          : "—"}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                        {tx.unit_price != null ? formatMoney(tx.unit_price) : "—"}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                        {formatMoney(tx.total_amount)}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3 tabular-nums">
                        {tx.fees > 0 ? formatMoney(tx.fees) : "—"}
                      </td>
                      <td className="border-b border-slate-100 py-2 pr-3">
                        <form action={deleteInvestmentTransaction.bind(null, tx.id)}>
                          <Button type="submit" variant="ghost">
                            Excluir
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
