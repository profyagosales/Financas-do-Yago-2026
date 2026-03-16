"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createGroceryNote } from "@/actions/grocery";
import { groceryNoteSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof groceryNoteSchema>;

export function GroceryNoteForm() {
  const [message, setMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(groceryNoteSchema),
    defaultValues: { note_date: new Date().toISOString().slice(0, 10) },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await createGroceryNote({
      ...values,
      establishment: values.establishment?.trim() || undefined,
      raw_extracted_text: values.raw_extracted_text?.trim() || undefined,
    });
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao registrar nota.");
      return;
    }
    reset({ note_date: new Date().toISOString().slice(0, 10) });
    setMessage("Nota registrada para revisão.");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <Input placeholder="Estabelecimento" {...register("establishment")} />
      <Input type="date" placeholder="Data da nota" {...register("note_date")} />
      <Input type="number" step="0.01" placeholder="Total da nota (opcional)" {...register("total_amount")} />

      <div className="md:col-span-2">
        <textarea
          placeholder="Texto da nota fiscal / itens e preços (revisão manual obrigatoria antes de gravar)"
          rows={5}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-400 placeholder:text-slate-400 focus:ring-2"
          {...register("raw_extracted_text")}
        />
      </div>

      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Registrar nota para revisão"}
        </Button>
      </div>
    </form>
  );
}
