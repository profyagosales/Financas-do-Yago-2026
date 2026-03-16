"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { clearMileageGoal, upsertMileageGoal } from "@/actions/mileage";
import { mileageGoalSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof mileageGoalSchema>;

interface Props {
  programId: string;
  goalPoints?: number | null;
  goalDueDate?: string | null;
  goalNotes?: string | null;
}

export function MileageGoalForm({ programId, goalPoints, goalDueDate, goalNotes }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(mileageGoalSchema),
    defaultValues: {
      program_id: programId,
      goal_points: goalPoints ?? undefined,
      goal_due_date: goalDueDate ?? "",
      goal_notes: goalNotes ?? "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await upsertMileageGoal(values);
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao salvar meta.");
      return;
    }
    setMessage("Meta atualizada com sucesso.");
  };

  const handleClear = async () => {
    setMessage(null);
    await clearMileageGoal(programId);
    setMessage("Meta removida.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <input type="hidden" {...register("program_id")} />

      <Input type="number" min={1} placeholder="Meta de pontos" {...register("goal_points")} />
      <Input type="date" placeholder="Data alvo (opcional)" {...register("goal_due_date")} />
      <Input className="md:col-span-2" placeholder="Observações da emissao desejada" {...register("goal_notes")} />

      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}

      <div className="md:col-span-2 flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar meta"}
        </Button>
        <Button type="button" variant="ghost" onClick={handleClear}>
          Limpar meta
        </Button>
      </div>
    </form>
  );
}
