import { ModulePage } from "@/components/common/module-page";

export default function LatamPassPage() {
  return (
    <ModulePage
      title="Milhas > Latam Pass"
      subtitle="Controle de aculo, resgate e expiracao."
      bullets={[
        "Movimentacoes por tipo",
        "Validade de pontos",
        "Historico filtravel",
        "Indicadores do periodo",
      ]}
    />
  );
}
