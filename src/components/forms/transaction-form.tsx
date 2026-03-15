"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTransaction, uploadCustomTransactionIcon } from "@/actions/finance";
import { transactionSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = transactionSchema.safeExtend({
  category_id: z.string().uuid().optional(),
  account_id: z.string().uuid().optional(),
  destination_account_id: z.string().uuid().optional(),
  credit_card_id: z.string().uuid().optional(),
});
type FormInput = z.input<typeof formSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  categories: Option[];
  accounts: Option[];
  cards: Option[];
  icons: Option[];
}

export function TransactionForm({ categories, accounts, cards, icons }: Props) {
  const [customIconFile, setCustomIconFile] = useState<File | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      competency_date: new Date().toISOString().slice(0, 10),
      installments: 1,
      fixed_expense: false,
    },
  });

  const onSubmit = async (values: FormInput) => {
    const normalize = (value?: string) => {
      if (!value || value.trim() === "") return undefined;
      return value;
    };

    let customIconUrl: string | undefined;
    if (customIconFile) {
      const formData = new FormData();
      formData.append("file", customIconFile);
      formData.append("label", values.description);
      const upload = await uploadCustomTransactionIcon(formData);
      if (upload.ok && upload.icon_url) {
        customIconUrl = upload.icon_url;
      }
    }

    await createTransaction({
      ...values,
      icon_url: customIconUrl,
      category_id: normalize(values.category_id),
      account_id: normalize(values.account_id),
      destination_account_id: normalize(values.destination_account_id),
      credit_card_id: normalize(values.credit_card_id),
    });

    setCustomIconFile(null);
  };

  const currentType = useWatch({ control, name: "type" });
  const isTransfer = currentType === "transfer";
  const isExpense = currentType === "expense";
  const categoryOptions = categories;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <Input placeholder="Descricao" {...register("description")} />
      <Input placeholder="Valor" type="number" step="0.01" {...register("amount")} />
      <Input placeholder="Data" type="date" {...register("competency_date")} />
      <Input placeholder="Parcelas" type="number" min={1} max={48} {...register("installments")} />
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("type")}>
        <option value="expense">Despesa</option>
        <option value="income">Receita</option>
        <option value="transfer">Transferencia</option>
        <option value="adjustment">Ajuste</option>
      </select>

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("category_id")}>
        <option value="">Selecione categoria</option>
        {categoryOptions.map((category) => (
          <option key={category.id} value={category.id}>
            {category.label}
          </option>
        ))}
      </select>

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("account_id")}>
        <option value="">Conta origem</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label}
          </option>
        ))}
      </select>

      <select
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        {...register("destination_account_id")}
        disabled={!isTransfer}
      >
        <option value="">Conta destino (transferencia)</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.label}
          </option>
        ))}
      </select>

      <select
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
        {...register("credit_card_id")}
        disabled={!isExpense}
      >
        <option value="">Cartao (despesa no credito)</option>
        {cards.map((card) => (
          <option key={card.id} value={card.id}>
            {card.label}
          </option>
        ))}
      </select>
      <Input className="md:col-span-2" placeholder="Observacoes" {...register("notes")} />

      <select className="md:col-span-2 rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("icon_key")}>
        <option value="">Icone automatico por descricao</option>
        {icons.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>

      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
        <p className="mb-2 font-semibold text-slate-700">Icone personalizado (opcional)</p>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-xs"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0] ?? null;
            setCustomIconFile(file);
          }}
        />
      </div>

      <label className="md:col-span-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input type="checkbox" {...register("fixed_expense")} disabled={!isExpense} />
        <span>
          Marcar como despesa fixa (repete automaticamente nos proximos meses, ex: aluguel, academia)
        </span>
      </label>

      {errors.root?.message ? <p className="text-xs text-red-600">{errors.root.message}</p> : null}
      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Criar lancamento"}
        </Button>
      </div>
    </form>
  );
}
