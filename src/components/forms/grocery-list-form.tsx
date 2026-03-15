"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createGroceryList } from "@/actions/grocery";
import { groceryListSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof groceryListSchema>;

export function GroceryListForm() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(groceryListSchema) });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await createGroceryList({ ...values, notes: values.notes?.trim() || undefined });
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao criar lista.");
      return;
    }
    reset();
    setMessage("Lista criada.");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <Input placeholder="Nome da lista" {...register("name")} />
      <Input placeholder="Observacoes" {...register("notes")} />
      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar lista"}
        </Button>
      </div>
    </form>
  );
}
