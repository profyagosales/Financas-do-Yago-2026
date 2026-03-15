import { ModulePage } from "@/components/common/module-page";

export default function MercadoNotasPage() {
  return (
    <ModulePage
      title="Mercado > Notas fiscais"
      subtitle="Upload de imagem/PDF com revisao humana obrigatoria."
      bullets={[
        "Upload para storage",
        "Texto OCR bruto salvo",
        "Tela de revisao antes de gravar",
        "Geracao de historico de precos",
      ]}
    />
  );
}
