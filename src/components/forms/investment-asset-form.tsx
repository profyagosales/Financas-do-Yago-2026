"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createInvestmentAsset } from "@/actions/investments";
import { investmentAssetSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof investmentAssetSchema>;
type AssetClass = "fixed_income" | "fii" | "stock" | "crypto";

interface Props {
  assetClass: AssetClass;
}

export function InvestmentAssetForm({ assetClass }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(investmentAssetSchema),
    defaultValues: { asset_class: assetClass, currency: "BRL", current_value: undefined },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await createInvestmentAsset({ ...values });
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao cadastrar ativo.");
      return;
    }
    reset({ asset_class: assetClass, currency: "BRL", current_value: undefined });
    setMessage("Ativo cadastrado com sucesso.");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
    >
      <input type="hidden" {...register("asset_class")} />

      <Input placeholder="Nome do ativo *" {...register("name")} />
      <Input placeholder="Ticker (PETR4, BTC, TESOURO SELIC 2027...)" {...register("ticker")} />
      <Input placeholder="Subtipo (CDB, LCI, ETF, PN...)" {...register("asset_subtype")} />
      <Input placeholder="Corretora / Banco" {...register("broker")} />
      <Input type="number" step="0.01" placeholder="Valor atual manual (opcional)" {...register("current_value")} />

      <select
        className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        {...register("currency")}
      >
        <option value="BRL">BRL — Real</option>
        <option value="USD">USD — Dolar</option>
        <option value="EUR">EUR — Euro</option>
        <option value="BTC">BTC — Bitcoin</option>
      </select>

      <Input className="md:col-span-2" placeholder="Observações" {...register("notes")} />

      {message && <p className="md:col-span-2 text-sm text-slate-600">{message}</p>}

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Cadastrar ativo"}
        </Button>
      </div>
    </form>
  );
}
