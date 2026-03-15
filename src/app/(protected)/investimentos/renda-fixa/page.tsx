import { InvestmentClassPage } from "@/components/common/investment-class-page";

export const dynamic = "force-dynamic";

export default async function RendaFixaPage() {
  return (
    <InvestmentClassPage
      assetClass="fixed_income"
      title="Renda Fixa"
      subtitle="CDB, LCI, LCA, Tesouro Direto, debentures e outros ativos de renda fixa."
    />
  );
}
