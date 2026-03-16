"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createBankAccount, updateBankAccount } from "@/actions/finance";
import { ACCOUNT_TYPES, INSTITUTIONS } from "@/lib/institutions";
import { bankAccountSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof bankAccountSchema>;

interface Props {
  initialData?: {
    id: string;
    name: string;
    institution: string;
    account_type: string;
    icon_key?: string | null;
    initial_balance: number;
    notes?: string | null;
  };
  onSuccess?: () => void;
}

export function BankAccountForm({ initialData, onSuccess }: Props) {
  const isEdit = Boolean(initialData?.id);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          institution: initialData.institution,
          account_type: initialData.account_type,
          icon_key: initialData.icon_key ?? undefined,
          initial_balance: initialData.initial_balance,
          notes: initialData.notes ?? undefined,
        }
      : { initial_balance: 0 },
  });

  const onSubmit = async (values: FormData) => {
    if (isEdit && initialData?.id) {
      await updateBankAccount(initialData.id, values);
    } else {
      await createBankAccount(values);
    }
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 md:grid-cols-2">
      <Input placeholder="Nome da conta" {...register("name")} />
      <select className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)]" {...register("institution")}>
        <option value="">Selecione uma instituicao</option>
        {INSTITUTIONS.map((item) => (
          <option key={item.id} value={item.name}>
            {item.name}
          </option>
        ))}
      </select>
      <select className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)]" {...register("account_type")}>
        <option value="">Selecione um tipo</option>
        {ACCOUNT_TYPES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <select className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-sm text-[color:var(--foreground)]" {...register("icon_key")}>
        <option value="">Icone automatico</option>
        {INSTITUTIONS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
      <Input placeholder="Saldo inicial" type="number" step="0.01" {...register("initial_balance")} />
      <Input className="md:col-span-2" placeholder="Observações" {...register("notes")} />
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : isEdit ? "Salvar alteracoes" : "Cadastrar conta"}
        </Button>
      </div>
    </form>
  );
}
