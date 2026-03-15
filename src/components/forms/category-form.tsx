"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createCategory } from "@/actions/categories";
import { categorySchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof categorySchema>;

export function CategoryForm() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      type: "expense",
      color: "#0ea5e9",
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await createCategory({
      ...values,
      icon: values.icon?.trim() || undefined,
      color: values.color?.trim() || undefined,
    });

    if (!result.ok) {
      setMessage(result.message ?? "Nao foi possivel criar categoria.");
      return;
    }

    reset({ name: "", type: values.type, icon: "", color: values.color || "#0ea5e9" });
    setMessage("Categoria criada com sucesso.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-4">
      <Input placeholder="Nome da categoria" {...register("name")} />

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("type")}>
        <option value="expense">Despesa</option>
        <option value="income">Receita</option>
        <option value="transfer">Transferencia</option>
        <option value="investment">Investimento</option>
        <option value="mileage">Milhas</option>
        <option value="grocery">Mercado</option>
        <option value="goal">Meta</option>
      </select>

      <Input placeholder="Icone (opcional)" {...register("icon")} />
      <Input type="color" placeholder="Cor" {...register("color")} />

      {message ? <p className="md:col-span-4 text-sm text-slate-600">{message}</p> : null}

      <div className="md:col-span-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar categoria"}
        </Button>
      </div>
    </form>
  );
}
