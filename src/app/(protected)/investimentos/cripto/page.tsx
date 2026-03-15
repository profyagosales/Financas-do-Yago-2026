import { InvestmentClassPage } from "@/components/common/investment-class-page";

export const dynamic = "force-dynamic";

export default async function CriptoPage() {
  return (
    <InvestmentClassPage
      assetClass="crypto"
      title="Cripto"
      subtitle="Criptoativos, tokens e movimentacoes em blockchain."
    />
  );
}
