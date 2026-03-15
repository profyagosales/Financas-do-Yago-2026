import { ModulePage } from "@/components/common/module-page";

export default function ListaDesejoPage() {
  return (
    <ModulePage
      title="Lista de Desejo"
      subtitle="Acompanhamento de itens desejados e oportunidades de compra."
      bullets={[
        "Preco atual e preco alvo",
        "Prioridade",
        "Status ativo/comprado/pausado/descartado",
        "Links e imagens",
      ]}
    />
  );
}
