import { ModulePage } from "@/components/common/module-page";

export default function MercadoListasPage() {
  return (
    <ModulePage
      title="Mercado > Listas"
      subtitle="Listas de compra reutilizaveis e controle de itens."
      bullets={[
        "Itens favoritos",
        "Marcar como comprado",
        "Registrar preco por item",
        "Comparar estabelecimentos",
      ]}
    />
  );
}
