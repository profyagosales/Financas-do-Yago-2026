import { MileageProgramPage } from "@/components/common/mileage-program-page";

export const dynamic = "force-dynamic";

export default async function LiveloPage() {
  return (
    <MileageProgramPage
      programName="Livelo"
      subtitle="Entradas, saidas e validade de pontos Livelo."
    />
  );
}
