"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { upsertAppSettings } from "@/actions/settings";
import { appSettingsSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";

type FormData = z.input<typeof appSettingsSchema>;

interface Props {
  theme: "system" | "light" | "dark";
  showCharts: boolean;
  emailAlerts: boolean;
  weeklyDigest: boolean;
}

export function AppSettingsForm({ theme, showCharts, emailAlerts, weeklyDigest }: Props) {
  const [message, setMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: {
      theme,
      show_charts: showCharts,
      email_alerts: emailAlerts,
      weekly_digest: weeklyDigest,
    },
  });

  const onSubmit = async (values: FormData) => {
    setMessage(null);
    const result = await upsertAppSettings(values);
    if (!result.ok) {
      setMessage(result.message ?? "Erro ao salvar preferencias.");
      return;
    }
    setMessage("Preferências atualizadas com sucesso.");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <select className="rounded-xl border border-slate-300 px-3 py-2 text-sm" {...register("theme")}>
        <option value="system">Tema do sistema</option>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("show_charts")} />
        Exibir graficos no dashboard
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("email_alerts")} />
        Receber alertas por email
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register("weekly_digest")} />
        Receber resumo semanal
      </label>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar preferencias"}
        </Button>
      </div>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
