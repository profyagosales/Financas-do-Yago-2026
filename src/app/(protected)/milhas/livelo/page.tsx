import { ModulePage } from "@/components/common/module-page";

export default function LiveloPage() {
  return (
    <ModulePage
      title="Milhas > Livelo"
      subtitle="Entradas, saidas e validade de pontos."
      bullets={[
        "Saldo por programa",
        "Pontos a expirar",
        "Origem da pontuacao",
        "Meta de emissao",
      ]}
    />
  );
}
