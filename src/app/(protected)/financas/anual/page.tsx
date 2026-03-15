import { ModulePage } from "@/components/common/module-page";

export default function AnualPage() {
  return (
    <ModulePage
      title="Financas > Anual"
      subtitle="Comparativo mes a mes e consolidado anual."
      bullets={[
        "Grafico receitas x despesas",
        "Economia mensal",
        "Ranking de categorias",
        "Total anual consolidado",
      ]}
    />
  );
}
