"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createInvestmentTransaction } from "@/actions/investments";
import { investmentTransactionSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof investmentTransactionSchema>;

interface Option {
  id: string;
  label: string;
}

interface Props {
  assets: Option[];
}

const TX_TYPE_LABELS: [string, string][] = [
  ["buy", "Compra"],
  ["sell", "Venda"],
  ["deposit", "Deposito / Aporte"],
  ["withdraw", "Resgate / Saque"],
  ["income", "Rendimento"],
  ["dividend", "Dividendo / Provento"],
  ["interest", "Juros / Cupom"],
  ["adjustment", "Ajuste manual"],
];

export function InvestmentTransactionForm({ assets }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(investmentTransactionSchema),
    defaultValues: {
      asset_id: assets[0]?.id ?? "",
      transaction_type: "buy",
      transaction_date: new Date().toISOString().slice(0, 10),
      fees: 0,
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await createInvestmentTransaction({
      ...values,
      quantity: values.quantity ? values.quantity : undefined,
      unit_price: values.unit_price ? values.unit_price : undefined,
      notes: values.notes?.trim() || undefined,
    });
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao registrar movimentacao.");
      return;
    }
    reset({
      asset_id: values.asset_id,
      transaction_type: values.transaction_type,
      transaction_date: new Date().toISOString().slice(0, 10),
      fees: 0,
    });
    setMessage("Movimentacao registrada com sucesso.");
  };

  const empty = assets.length === 0;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <select
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        {...register("asset_id")}
        disabled={empty}
      >
        {empty ? (
          <option value="">Cadastre um ativo primeiro</option>
        ) : (
          assets.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))
        )}
      </select>

      <select
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        {...register("transaction_type")}
      >
        {TX_TYPE_LABELS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <Input type="date" placeholder="Data" {...register("transaction_date")} />
      <Input type="number" step="0.00000001" placeholder="Quantidade (opcional)" {...register("quantity")} />
      <Input type="number" step="0.00000001" placeholder="Preco unitario (opcional)" {...register("unit_price")} />
      <Input type="number" step="0.01" placeholder="Valor total *" {...register("total_amount")} />
      <Input type="number" step="0.01" placeholder="Taxas e custos" {...register("fees")} />
      <Input placeholder="Observacoes" {...register("notes")} />

      {message && <p className="md:col-span-2 text-sm text-slate-600">{message}</p>}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting || empty}>
          {isSubmitting ? "Salvando..." : "Registrar movimentacao"}
        </Button>
      </div>
    </form>
  );
}
