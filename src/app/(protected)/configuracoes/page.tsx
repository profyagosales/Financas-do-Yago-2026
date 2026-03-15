import { ModulePage } from "@/components/common/module-page";

export default function ConfiguracoesPage() {
  return (
    <ModulePage
      title="Configuracoes"
      subtitle="Preferencias visuais, perfil, categorias e exportacoes."
      bullets={[
        "Tema claro/escuro/sistema",
        "Categorias personalizadas",
        "Backup e exportacao",
        "Dados iniciais",
      ]}
    />
  );
}
