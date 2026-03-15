import { ModulePage } from "@/components/common/module-page";

export default function CategoriasPage() {
  return (
    <ModulePage
      title="Financas > Categorias"
      subtitle="Categorias base para receitas, despesas e modulos extras."
      bullets={[
        "Tipos obrigatorios de categoria",
        "Ativar/desativar categoria",
        "Cores e icones",
        "Base para filtros globais",
      ]}
    />
  );
}
