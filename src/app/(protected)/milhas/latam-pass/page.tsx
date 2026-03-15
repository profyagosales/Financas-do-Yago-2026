import { MileageProgramPage } from "@/components/common/mileage-program-page";

export const dynamic = "force-dynamic";

export default async function LatamPassPage() {
  return (
    <MileageProgramPage
      programName="Latam Pass"
      subtitle="Controle de acumulo, resgate e expiracao de pontos Latam Pass."
    />
  );
}
