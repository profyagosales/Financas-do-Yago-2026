import { ModulePage } from "@/components/common/module-page";

export default function AzulPage() {
  return (
    <ModulePage
      title="Milhas > Azul"
      subtitle="Gestao completa do programa Azul."
      bullets={[
        "Saldo atual",
        "Entradas e saidas",
        "Expiracao",
        "Ajustes manuais",
      ]}
    />
  );
}
