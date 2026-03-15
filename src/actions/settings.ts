"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { appSettingsSchema, profileSettingsSchema } from "@/lib/validators/schemas";

export async function upsertProfileSettings(input: unknown) {
  const payload = profileSettingsSchema.parse(input);
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: payload.full_name.trim(),
      currency: payload.currency,
      locale: payload.locale,
    },
    { onConflict: "id" },
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function upsertAppSettings(input: unknown) {
  const payload = appSettingsSchema.parse(input);
  const supabase = await createServerSupabaseClient();

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("settings").upsert(
    {
      user_id: userId,
      theme: payload.theme,
      dashboard_config: {
        show_charts: payload.show_charts,
      },
      notification_prefs: {
        email_alerts: payload.email_alerts,
        weekly_digest: payload.weekly_digest,
      },
    },
    { onConflict: "user_id" },
  );

  if (error) return { ok: false, message: error.message };

  revalidatePath("/configuracoes");
  return { ok: true };
}
