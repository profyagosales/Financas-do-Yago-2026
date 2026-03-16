"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createGoal } from "@/actions/goals";
import { goalSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = goalSchema.safeExtend({
  destination_account_id: z.string().uuid().optional(),
});

type FormData = z.input<typeof formSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  accounts: Option[];
}

export function GoalForm({ accounts }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      priority: "medium",
      status: "active",
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);

    const result = await createGoal({
      ...values,
      description: values.description?.trim() || undefined,
      category: values.category?.trim() || undefined,
      target_date: values.target_date?.trim() || undefined,
      destination_account_id: values.destination_account_id?.trim() || undefined,
    });

    if (!result.ok) {
      setMessage(result.message ?? "Não foi possível criar a meta.");
      return;
    }

    reset({
      name: "",
      description: "",
      target_amount: 0,
      target_date: "",
      category: "",
      priority: "medium",
      status: "active",
      destination_account_id: "",
    });
    setMessage("Meta criada com sucesso.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <Input placeholder="Nome da meta" {...register("name")} />
      <Input type="number" step="0.01" placeholder="Valor alvo" {...register("target_amount")} />
      <Input placeholder="Categoria ou projeto" {...register("category")} />
      <Input type="date" placeholder="Prazo" {...register("target_date")} />

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("priority")}>
        <option value="low">Prioridade baixa</option>
        <option value="medium">Prioridade media</option>
        <option value="high">Prioridade alta</option>
      </select>

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("destination_account_id")}>
        <option value="">Conta destino (opcional)</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label}
          </option>
        ))}
      </select>

      <Input className="md:col-span-2" placeholder="Descrição curta da meta" {...register("description")} />

      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar meta"}
        </Button>
      </div>
    </form>
  );
}