"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addGoalContribution } from "@/actions/goals";
import { goalContributionSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = goalContributionSchema.safeExtend({
  source_account_id: z.string().uuid().optional(),
});

type FormData = z.input<typeof formSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  goals: Option[];
  accounts: Option[];
}

export function GoalContributionForm({ goals, accounts }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contribution_date: new Date().toISOString().slice(0, 10),
      goal_id: goals[0]?.id,
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);

    const result = await addGoalContribution({
      ...values,
      source_account_id: values.source_account_id?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });

    if (!result.ok) {
      setMessage(result.message ?? "Não foi possível registrar o aporte.");
      return;
    }

    reset({
      goal_id: values.goal_id,
      amount: undefined,
      contribution_date: new Date().toISOString().slice(0, 10),
      source_account_id: values.source_account_id,
      notes: "",
    });
    setMessage("Aporte registrado com sucesso.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("goal_id")} disabled={goals.length === 0}>
        <option value="">Selecione a meta</option>
        {goals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.label}
          </option>
        ))}
      </select>
      <Input type="number" step="0.01" placeholder="Valor" {...register("amount")} />
      <Input type="date" placeholder="Data" {...register("contribution_date")} />
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("source_account_id")}>
        <option value="">Conta origem (opcional)</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label}
          </option>
        ))}
      </select>
      <Input className="md:col-span-2" placeholder="Observações" {...register("notes")} />
      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting || goals.length === 0}>
          {isSubmitting ? "Salvando..." : "Registrar aporte"}
        </Button>
      </div>
    </form>
  );
}
