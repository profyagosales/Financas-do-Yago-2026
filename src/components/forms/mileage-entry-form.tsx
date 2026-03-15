"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addMileageEntry } from "@/actions/mileage";
import { mileageEntrySchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof mileageEntrySchema>;

interface Props {
  programId: string;
}

const ENTRY_TYPE_LABELS: [string, string][] = [
  ["earn", "Acumulo"],
  ["transfer", "Transferencia recebida"],
  ["redeem", "Resgate"],
  ["expire", "Expiracao"],
  ["adjustment", "Ajuste"],
];

export function MileageEntryForm({ programId }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const { control, register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(mileageEntrySchema),
    defaultValues: {
      program_id: programId,
      entry_type: "earn",
      occurred_at: new Date().toISOString().slice(0, 10),
    },
  });

  const entryType = useWatch({ control, name: "entry_type" });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await addMileageEntry({
      ...values,
      expires_at: values.expires_at?.trim() || undefined,
      source: values.source?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    });
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao registrar movimentacao.");
      return;
    }
    reset({
      program_id: programId,
      entry_type: values.entry_type,
      occurred_at: new Date().toISOString().slice(0, 10),
    });
    setMessage("Movimentacao registrada com sucesso.");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <input type="hidden" {...register("program_id")} />

      <select
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        {...register("entry_type")}
      >
        {ENTRY_TYPE_LABELS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <Input type="number" min={1} placeholder="Quantidade de pontos" {...register("points")} />

      <Input type="date" placeholder="Data da movimentacao" {...register("occurred_at")} />

      <Input placeholder="Origem (cartao, compra, parceiro...)" {...register("source")} />

      <div className={entryType === "earn" ? "" : "hidden"}>
        <Input type="date" placeholder="Vencimento dos pontos (opcional)" {...register("expires_at")} />
      </div>

      <Input
        className={entryType === "earn" ? "" : "md:col-span-2"}
        placeholder="Observacoes"
        {...register("notes")}
      />

      {message && (
        <p className="md:col-span-2 text-sm text-slate-600">{message}</p>
      )}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Registrar movimentacao"}
        </Button>
      </div>
    </form>
  );
}
