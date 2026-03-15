import { ModulePage } from "@/components/common/module-page";

export default function BolsaPage() {
  return (
    <ModulePage
      title="Investimentos > Bolsa"
      subtitle="Gestao de ativos em renda variavel."
      bullets={[
        "Ticker e corretora",
        "Quantidade e custo medio",
        "Historico de ordens",
        "Rentabilidade acumulada",
      ]}
    />
  );
}
