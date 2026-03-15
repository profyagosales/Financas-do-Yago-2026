import { ModulePage } from "@/components/common/module-page";

export default function FiisPage() {
  return (
    <ModulePage
      title="Investimentos > FIIs"
      subtitle="Controle de cotas, rendimentos e distribuicao."
      bullets={[
        "Compras e vendas",
        "Dividendos",
        "Participacao por classe",
        "Analise de carteira",
      ]}
    />
  );
}
