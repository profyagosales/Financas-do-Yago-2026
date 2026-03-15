import { ModulePage } from "@/components/common/module-page";

export default function CriptoPage() {
  return (
    <ModulePage
      title="Investimentos > Cripto"
      subtitle="Movimentacoes manuais para criptoativos."
      bullets={[
        "Compra, venda e rendimento",
        "Quantidade com precisao",
        "Moedas e corretoras",
        "Participacao consolidada",
      ]}
    />
  );
}
