import { InvestmentClassPage } from "@/components/common/investment-class-page";

export const dynamic = "force-dynamic";

export default async function FiisPage() {
  return (
    <InvestmentClassPage
      assetClass="fii"
      title="FIIs"
      subtitle="Fundos de Investimento Imobiliario, cotas, rendimentos e proventos."
    />
  );
}
