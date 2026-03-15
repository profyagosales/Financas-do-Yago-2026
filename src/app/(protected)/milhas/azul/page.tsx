import { MileageProgramPage } from "@/components/common/mileage-program-page";

export const dynamic = "force-dynamic";

export default async function AzulPage() {
  return (
    <MileageProgramPage
      programName="Azul"
      subtitle="Gestao completa do programa Tudo Azul."
    />
  );
}
