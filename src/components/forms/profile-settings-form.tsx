"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { upsertProfileSettings } from "@/actions/settings";
import { profileSettingsSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type FormData = z.input<typeof profileSettingsSchema>;

interface Props {
  fullName: string;
  currency: "BRL" | "USD" | "EUR";
  locale: "pt-BR" | "en-US" | "es-ES";
}

export function ProfileSettingsForm({ fullName, currency, locale }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      full_name: fullName,
      currency,
      locale,
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await upsertProfileSettings(values);
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao salvar perfil.");
      return;
    }
    setMessage("Perfil atualizado com sucesso.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
      <Input placeholder="Nome completo" {...register("full_name")} />

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("locale")}>
        <option value="pt-BR">pt-BR (Portugues Brasil)</option>
        <option value="en-US">en-US (English US)</option>
        <option value="es-ES">es-ES (Espanol)</option>
      </select>

      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("currency")}>
        <option value="BRL">BRL (Real)</option>
        <option value="USD">USD (Dolar)</option>
        <option value="EUR">EUR (Euro)</option>
      </select>

      <div className="md:col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>

      {message ? <p className="md:col-span-2 text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
