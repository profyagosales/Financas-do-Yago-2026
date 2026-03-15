import { ModulePage } from "@/components/common/module-page";

export default function MensalPage() {
  return (
    <ModulePage
      title="Financas > Mensal"
      subtitle="Fechamento mensal com filtros e indicadores."
      bullets={[
        "Receitas e despesas do mes",
        "Parcelas apenas na competencia correta",
        "Recorrencias ativas automaticamente",
        "Exportacao e calendario financeiro",
      ]}
    />
  );
}
