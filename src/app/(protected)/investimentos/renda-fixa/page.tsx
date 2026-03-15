import { ModulePage } from "@/components/common/module-page";

export default function RendaFixaPage() {
  return (
    <ModulePage
      title="Investimentos > Renda Fixa"
      subtitle="Cadastro manual de ativos e movimentacoes."
      bullets={[
        "Aporte e resgate",
        "Preco medio",
        "Rentabilidade nominal",
        "Proventos e historico",
      ]}
    />
  );
}
