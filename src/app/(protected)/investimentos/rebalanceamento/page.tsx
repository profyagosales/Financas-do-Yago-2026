import { RebalancingCalculator } from "@/components/investments/rebalancing-calculator";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AssetClass = "fixed_income" | "fii" | "stock" | "crypto";

const CLASS_LABELS: Record<AssetClass, string> = {
  fixed_income: "Renda Fixa",
  fii: "FIIs",
  stock: "Bolsa",
  crypto: "Cripto",
};

const CLASSES: AssetClass[] = ["fixed_income", "fii", "stock", "crypto"];

async function getRebalancingData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      classes: CLASSES.map((key) => ({ key, label: CLASS_LABELS[key], totalInvested: 0 })),
      prefs: { currency: "BRL", locale: "pt-BR" },
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      classes: CLASSES.map((key) => ({ key, label: CLASS_LABELS[key], totalInvested: 0 })),
      prefs: { currency: "BRL", locale: "pt-BR" },
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  // Buscar todos os ativos + transacoes para calcular total investido por classe
  const [{ data: assetsData }, { data: txsData }] = await Promise.all([
    supabase
      .from("investment_assets")
      .select("id, asset_class")
      .eq("user_id", userId),
    supabase
      .from("investment_transactions")
      .select("asset_id, transaction_type, total_amount, fees")
      .eq("user_id", userId),
  ]);

  const assetClassMap = new Map(
    (assetsData ?? []).map((a) => [a.id as string, a.asset_class as AssetClass]),
  );

  const totalByClass: Record<AssetClass, number> = {
    fixed_income: 0,
    fii: 0,
    stock: 0,
    crypto: 0,
  };

  for (const tx of txsData ?? []) {
    const assetClass = assetClassMap.get(tx.asset_id);
    if (!assetClass || !(assetClass in totalByClass)) continue;

    const isBuy = ["buy", "deposit"].includes(tx.transaction_type);
    const isSell = ["sell", "withdraw"].includes(tx.transaction_type);

    if (isBuy) {
      totalByClass[assetClass] += Number(tx.total_amount ?? 0) + Number(tx.fees ?? 0);
    } else if (isSell) {
      totalByClass[assetClass] -= Number(tx.total_amount ?? 0) - Number(tx.fees ?? 0);
    }
  }

  const classes = CLASSES.map((key) => ({
    key,
    label: CLASS_LABELS[key],
    totalInvested: Math.max(0, totalByClass[key]),
  }));

  return { hasEnv: true, classes, prefs };
}

export default async function RebalanceamentoPage() {
  const { hasEnv, classes, prefs } = await getRebalancingData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Investimentos › Rebalanceamento</h1>
        <p className="text-sm text-slate-600">
          Compare sua alocacao atual com a meta desejada e veja quanto comprar ou vender por classe.
        </p>
      </div>

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <h2 className="mb-1 text-sm font-bold text-slate-700">Como usar</h2>
            <p className="text-xs text-slate-500">
              Defina a porcentagem alvo para cada classe de ativo. O sistema calcula quanto voce precisa comprar ou vender para atingir a alocacao desejada com base no total ja investido.
              As metas sao salvas localmente no navegador.
            </p>
          </Card>

          <RebalancingCalculator
            classes={classes}
            locale={prefs.locale}
            currency={prefs.currency}
          />
        </>
      )}
    </div>
  );
}
