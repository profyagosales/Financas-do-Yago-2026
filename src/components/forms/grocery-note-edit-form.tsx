"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateGroceryNote } from "@/actions/grocery";
import { groceryNoteSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof groceryNoteSchema>;

interface Props {
  noteId: string;
  initialData: {
    establishment?: string | null;
    note_date?: string | null;
    total_amount?: number | null;
    raw_extracted_text?: string | null;
  };
  onSuccess?: () => void;
}

export function GroceryNoteEditForm({ noteId, initialData, onSuccess }: Props) {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(groceryNoteSchema),
    defaultValues: {
      establishment: initialData.establishment ?? "",
      note_date: initialData.note_date ?? "",
      total_amount: initialData.total_amount ?? undefined,
      raw_extracted_text: initialData.raw_extracted_text ?? "",
    },
  });

  const onSubmit = async (values: FormData) => {
    await updateGroceryNote(noteId, values);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
      <Input placeholder="Estabelecimento" {...register("establishment")} />
      <Input type="date" placeholder="Data da nota" {...register("note_date")} />
      <Input
        type="number"
        step="0.01"
        placeholder="Total da nota (opcional)"
        {...register("total_amount")}
      />
      <div className="md:col-span-2">
        <textarea
          placeholder="Texto da nota fiscal / itens e preços"
          rows={5}
          className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] outline-none ring-[color:var(--accent)] focus:ring-2"
          {...register("raw_extracted_text")}
        />
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
