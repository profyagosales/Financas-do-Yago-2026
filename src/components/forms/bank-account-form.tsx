"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBankAccount } from "@/actions/finance";
import { ACCOUNT_TYPES, INSTITUTIONS } from "@/lib/institutions";
import { bankAccountSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof bankAccountSchema>;

export function BankAccountForm() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: { initial_balance: 0 },
  });

  const onSubmit = async (values: FormData) => {
    await createBankAccount(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <Input placeholder="Nome da conta" {...register("name")} />
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("institution")}>
        <option value="">Selecione uma instituicao</option>
        {INSTITUTIONS.map((item) => (
          <option key={item.id} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("account_type")}>
        <option value="">Selecione um tipo</option>
        {ACCOUNT_TYPES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("icon_key")}>
        <option value="">Icone automatico</option>
        {INSTITUTIONS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <Input placeholder="Saldo inicial" type="number" step="0.01" {...register("initial_balance")} />
      <Input className="md:col-span-2" placeholder="Observacoes" {...register("notes")} />
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar conta"}
        </Button>
      </div>
    </form>
  );
}
