"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { wishlistItemSchema } from "@/lib/validators/schemas";

function normalizeOptional(value?: string | null) {
  if (!value || value.trim() === "") return undefined;
  return value;
}

function normalizeNumber(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return undefined;
  return value;
}

export async function createWishlistItem(input: unknown) {
  const payload = wishlistItemSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("wishlist_items").insert({
    user_id: userId,
    name: payload.name,
    category: normalizeOptional(payload.category),
    url: normalizeOptional(payload.url),
    image_url: normalizeOptional(payload.image_url),
    current_price: normalizeNumber(payload.current_price),
    target_price: normalizeNumber(payload.target_price),
    priority: payload.priority,
    store_name: normalizeOptional(payload.store_name),
    status: payload.status,
    notes: normalizeOptional(payload.notes),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/lista-de-desejo");
  return { ok: true };
}

export async function setWishlistItemStatus(id: string, status: "active" | "bought" | "paused" | "discarded") {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("wishlist_items").update({ status }).eq("id", id).eq("user_id", userId);
  if (error) return;

  revalidatePath("/lista-de-desejo");
}

export async function deleteWishlistItem(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("wishlist_items").delete().eq("id", id).eq("user_id", userId);
  if (error) return;

  revalidatePath("/lista-de-desejo");
}