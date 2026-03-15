import { ModulePage } from "@/components/common/module-page";

export default function MercadoHistoricoPage() {
  return (
    <ModulePage
      title="Mercado > Historico de precos"
      subtitle="Variacao por item e estabelecimento."
      bullets={[
        "Preco medio por item",
        "Comparativo por mercado",
        "Variacao historica",
        "Base para previsoes futuras",
      ]}
    />
  );
}
