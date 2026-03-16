"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { categorySchema } from "@/lib/validators/schemas";

function normalizeOptional(value?: string | null) {
  if (!value || value.trim() === "") return null;
  return value.trim();
}

export async function createCategory(input: unknown) {
  const payload = categorySchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Não autenticado" };

  const { error } = await supabase.from("categories").insert({
    user_id: userId,
    name: payload.name.trim(),
    type: payload.type,
    icon: normalizeOptional(payload.icon),
    color: normalizeOptional(payload.color),
    is_default: false,
    is_active: true,
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financas/categorias");
  revalidatePath("/financas/lancamentos");
  return { ok: true };
}

export async function setCategoryActive(id: string, isActive: boolean) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return;

  revalidatePath("/financas/categorias");
  revalidatePath("/financas/lancamentos");
}

export async function deleteCategory(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { data: rows } = await supabase
    .from("categories")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1);

  if (rows?.[0]?.is_default) return;

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", userId);
  if (error) return;

  revalidatePath("/financas/categorias");
  revalidatePath("/financas/lancamentos");
}
