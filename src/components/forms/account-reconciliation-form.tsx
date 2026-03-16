"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { reconcileBankAccount } from "@/actions/finance";
import { bankAccountReconciliationSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof bankAccountReconciliationSchema>;

interface Props {
  accountId: string;
  reconciledBalance?: number | null;
  reconciledAt?: string | null;
  reconciliationNotes?: string | null;
}

export function AccountReconciliationForm({
  accountId,
  reconciledBalance,
  reconciledAt,
  reconciliationNotes,
}: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(bankAccountReconciliationSchema),
    defaultValues: {
      account_id: accountId,
      reconciled_balance: reconciledBalance ?? 0,
      reconciled_at: reconciledAt ?? new Date().toISOString().slice(0, 10),
      reconciliation_notes: reconciliationNotes ?? "",
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await reconcileBankAccount(values);
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao salvar conciliacao.");
      return;
    }
    setMessage("Conciliacao salva.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-2 md:grid-cols-4">
      <input type="hidden" {...register("account_id")} />
      <Input type="number" step="0.01" placeholder="Saldo conciliado" {...register("reconciled_balance")} />
      <Input type="date" placeholder="Data da conciliacao" {...register("reconciled_at")} />
      <Input className="md:col-span-2" placeholder="Observacoes da conciliacao" {...register("reconciliation_notes")} />
      {message ? <p className="md:col-span-4 text-sm text-slate-600">{message}</p> : null}
      <div className="md:col-span-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar conciliacao"}
        </Button>
      </div>
    </form>
  );
}
