import { ModulePage } from "@/components/common/module-page";

export default function RelatoriosPage() {
  return (
    <ModulePage
      title="Relatorios"
      subtitle="Consolidacao de indicadores financeiros por modulo."
      bullets={[
        "Despesas por categoria",
        "Cartoes por periodo",
        "Investimentos por classe",
        "Milhas por programa",
      ]}
    />
  );
}
