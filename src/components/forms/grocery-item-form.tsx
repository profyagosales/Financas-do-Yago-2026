"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addGroceryItem } from "@/actions/grocery";
import { groceryItemSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = groceryItemSchema.safeExtend({
  list_id: z.string().uuid().optional(),
});

type FormData = z.input<typeof formSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  lists: Option[];
}

export function GroceryItemForm({ lists }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { list_id: lists[0]?.id },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await addGroceryItem({
      ...values,
      list_id: values.list_id?.trim() || undefined,
      unit: values.unit?.trim() || undefined,
      establishment: values.establishment?.trim() || undefined,
      item_category: values.item_category?.trim() || undefined,
    });
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao adicionar item.");
      return;
    }
    reset({ list_id: values.list_id, raw_name: "", quantity: undefined, unit: "", unit_price: undefined, establishment: values.establishment, item_category: "" });
    setMessage("Item adicionado.");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3"
    >
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("list_id")}>
        <option value="">Sem lista</option>
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.label}
          </option>
        ))}
      </select>

      <Input placeholder="Nome do item" {...register("raw_name")} />
      <Input placeholder="Categoria" {...register("item_category")} />
      <Input type="number" step="0.01" placeholder="Qtd" {...register("quantity")} />
      <Input placeholder="Unidade (kg, un, L...)" {...register("unit")} />
      <Input type="number" step="0.01" placeholder="Preco unitario" {...register("unit_price")} />
      <Input className="md:col-span-3" placeholder="Estabelecimento" {...register("establishment")} />

      {message ? <p className="md:col-span-3 text-sm text-slate-600">{message}</p> : null}

      <div className="md:col-span-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Adicionar item"}
        </Button>
      </div>
    </form>
  );
}
