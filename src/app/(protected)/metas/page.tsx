import { GoalContributionForm } from "@/components/forms/goal-contribution-form";
import { ModulePage } from "@/components/common/module-page";

export default function MetasPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Metas e Projetos"
        subtitle="Controle de objetivo, prazo, percentual concluido e historico de aportes."
        bullets={[
          "Aportes multiplos por meta",
          "Calculo de valor restante e prazo",
          "Origem do aporte registrada",
          "Status ativa, pausada e concluida",
        ]}
      />
      <GoalContributionForm />
    </div>
  );
}
