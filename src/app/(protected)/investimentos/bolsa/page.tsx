import { InvestmentClassPage } from "@/components/common/investment-class-page";

export const dynamic = "force-dynamic";

export default async function BolsaPage() {
  return (
    <InvestmentClassPage
      assetClass="stock"
      title="Bolsa"
      subtitle="Acoes, BDRs, ETFs e ativos de renda variavel em bolsa."
    />
  );
}
