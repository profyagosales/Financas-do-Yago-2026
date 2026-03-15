"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addGoalContribution } from "@/actions/goals";
import { goalContributionSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof goalContributionSchema>;

export function GoalContributionForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(goalContributionSchema),
    defaultValues: {
      contribution_date: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (values: FormData) => {
    await addGoalContribution(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <Input placeholder="Goal ID (UUID)" {...register("goal_id")} />
      <Input type="number" step="0.01" placeholder="Valor" {...register("amount")} />
      <Input type="date" placeholder="Data" {...register("contribution_date")} />
      <Input placeholder="Conta origem (UUID)" {...register("source_account_id")} />
      <Input className="md:col-span-2" placeholder="Observacoes" {...register("notes")} />
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Registrar aporte"}
        </Button>
      </div>
    </form>
  );
}
