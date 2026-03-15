import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type HistoryRow = {
  normalized_name: string;
  establishment: string;
  unit_price: number;
  purchased_at: string;
};

async function getPriceHistory() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      rows: [] as HistoryRow[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      rows: [] as HistoryRow[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const { data } = await supabase
    .from("grocery_price_history")
    .select("normalized_name, establishment, unit_price, purchased_at")
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false })
    .limit(1000);

  return {
    hasEnv: true,
    prefs,
    rows: (data ?? []).map((row) => ({ ...row, unit_price: Number(row.unit_price) })) as HistoryRow[],
  };
}

type AggregatedItem = {
  name: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  lastDate: string;
  lastEstablishment: string;
  establishments: string[];
};

function aggregate(rows: HistoryRow[]): AggregatedItem[] {
  const groups = new Map<string, HistoryRow[]>();
  for (const row of rows) {
    const list = groups.get(row.normalized_name) ?? [];
    list.push(row);
    groups.set(row.normalized_name, list);
  }

  return Array.from(groups.entries())
    .map(([name, entries]) => {
      const prices = entries.map((e) => e.unit_price);
      const sorted = [...entries].sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));
      const uniqueEst = [...new Set(entries.map((e) => e.establishment))];
      return {
        name,
        count: entries.length,
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((s, p) => s + p, 0) / prices.length,
        lastDate: sorted[0].purchased_at,
        lastEstablishment: sorted[0].establishment,
        establishments: uniqueEst,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default async function MercadoHistoricoPage() {
  const { hasEnv, prefs, rows } = await getPriceHistory();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);
  const items = aggregate(rows);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Mercado > Historico de precos"
        subtitle="Variacao por item e estabelecimento. Alimentado automaticamente ao marcar itens como comprados."
        bullets={[
          "Preco medio por item",
          "Comparativo por mercado",
          "Variacao historica",
          "Base para previsoes futuras",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Produtos rastreados</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{items.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total de registros</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{rows.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estabelecimentos distintos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {new Set(rows.map((r) => r.establishment)).size}
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Historico agregado por produto</h3>
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">
            Nenhum registro ainda. Marque itens como comprados nas listas para gerar historico automaticamente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Produto</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Registros</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Minimo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Maximo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Media</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Ultima compra</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Ultimo local</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Estabelecimentos</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.name}>
                    <td className="border-b border-slate-100 py-2 pr-3 font-medium">{item.name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.count}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 text-emerald-700">{formatMoney(item.min)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 text-rose-700">{formatMoney(item.max)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{formatMoney(item.avg)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.lastDate}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.lastEstablishment}</td>
                    <td className="border-b border-slate-100 py-2 pr-3 text-xs text-slate-500">
                      {item.establishments.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
