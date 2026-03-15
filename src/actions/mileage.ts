"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mileageEntrySchema } from "@/lib/validators/schemas";

const PATHS = ["/milhas/livelo", "/milhas/latam-pass", "/milhas/azul", "/dashboard"];

export async function addMileageEntry(input: unknown) {
  const payload = mileageEntrySchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { data: programs } = await supabase
    .from("mileage_programs")
    .select("id")
    .eq("id", payload.program_id)
    .eq("user_id", userId)
    .limit(1);

  if (!programs || programs.length === 0) return { ok: false, message: "Programa nao encontrado" };

  const { error } = await supabase.from("mileage_entries").insert({
    user_id: userId,
    program_id: payload.program_id,
    entry_type: payload.entry_type,
    points: payload.points,
    occurred_at: payload.occurred_at,
    expires_at: payload.expires_at?.trim() || null,
    source: payload.source?.trim() || null,
    notes: payload.notes?.trim() || null,
  });

  if (error) return { ok: false, message: error.message };

  for (const path of PATHS) revalidatePath(path);
  return { ok: true };
}

export async function deleteMileageEntry(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase.from("mileage_entries").delete().eq("id", id).eq("user_id", userId);

  for (const path of PATHS) revalidatePath(path);
}
