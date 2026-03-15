"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { groceryItemSchema, groceryListSchema, groceryNoteSchema } from "@/lib/validators/schemas";

function sanitizeFileName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeItemName(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

function opt(value?: string | null): string | undefined {
  if (!value || value.trim() === "") return undefined;
  return value.trim();
}

export async function createGroceryList(input: unknown) {
  const payload = groceryListSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("grocery_lists").insert({
    user_id: userId,
    name: payload.name,
    notes: opt(payload.notes) ?? null,
    status: "active",
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/mercado/listas");
  return { ok: true };
}

export async function deleteGroceryList(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  await supabase.from("grocery_lists").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/mercado/listas");
}

export async function addGroceryItem(input: unknown) {
  const payload = groceryItemSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const normalized = normalizeItemName(payload.raw_name);
  const qty = payload.quantity && !Number.isNaN(payload.quantity) ? payload.quantity : undefined;
  const unitPrice =
    payload.unit_price !== undefined && !Number.isNaN(payload.unit_price) ? payload.unit_price : undefined;
  const totalPrice = qty && unitPrice ? Number((qty * unitPrice).toFixed(2)) : undefined;

  const { error } = await supabase.from("grocery_items").insert({
    user_id: userId,
    list_id: opt(payload.list_id) ?? null,
    normalized_name: normalized,
    raw_name: payload.raw_name.trim(),
    quantity: qty ?? null,
    unit: opt(payload.unit) ?? null,
    unit_price: unitPrice ?? null,
    total_price: totalPrice ?? null,
    establishment: opt(payload.establishment) ?? null,
    item_category: opt(payload.item_category) ?? null,
    was_purchased: false,
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/mercado/listas");
  return { ok: true };
}

export async function markGroceryItemPurchased(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const today = new Date().toISOString().slice(0, 10);

  const { data: item } = await supabase
    .from("grocery_items")
    .select("unit_price, establishment, normalized_name, quantity, unit, was_purchased")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!item) return;

  const nowPurchased = !item.was_purchased;

  await supabase
    .from("grocery_items")
    .update({
      was_purchased: nowPurchased,
      purchased_at: nowPurchased ? today : null,
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (nowPurchased && item.unit_price && item.establishment) {
    await supabase.from("grocery_price_history").insert({
      user_id: userId,
      grocery_item_id: id,
      normalized_name: item.normalized_name,
      establishment: item.establishment,
      unit_price: Number(item.unit_price),
      quantity_reference: item.quantity ? Number(item.quantity) : null,
      unit: item.unit ?? null,
      purchased_at: today,
    });
  }

  revalidatePath("/mercado/listas");
  revalidatePath("/mercado/historico");
}

export async function deleteGroceryItem(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  await supabase.from("grocery_items").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/mercado/listas");
}

export async function createGroceryNote(input: unknown) {
  const payload = groceryNoteSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("grocery_notes").insert({
    user_id: userId,
    establishment: opt(payload.establishment) ?? null,
    note_date: opt(payload.note_date) ?? null,
    total_amount:
      payload.total_amount !== undefined && !Number.isNaN(payload.total_amount) ? payload.total_amount : null,
    raw_extracted_text: opt(payload.raw_extracted_text) ?? null,
    review_status: "pending_review",
  });

  if (error) return { ok: false, message: error.message };
  revalidatePath("/mercado/notas");
  return { ok: true };
}

export async function setGroceryNoteReviewed(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  await supabase
    .from("grocery_notes")
    .update({ review_status: "reviewed" })
    .eq("id", id)
    .eq("user_id", userId);
  revalidatePath("/mercado/notas");
}

export async function deleteGroceryNote(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;
  await supabase.from("grocery_notes").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/mercado/notas");
}

export async function uploadGroceryNoteFile(formData: FormData) {
  const file = formData.get("file");
  const noteId = String(formData.get("note_id") ?? "");

  if (!(file instanceof File) || file.size === 0) return;

  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  if (!allowedMimes.includes(file.type)) return;

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) return;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const key = `${userId}/grocery-notes/${noteId}/${Date.now()}-${safeBase}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("attachments").upload(key, file, {
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) return;

  const { error: attachError } = await supabase.from("attachments").insert({
    user_id: userId,
    related_type: "grocery_note",
    related_id: noteId,
    file_path: key,
    file_name: file.name,
    mime_type: file.type,
    file_size: file.size,
  });

  if (attachError) {
    await supabase.storage.from("attachments").remove([key]);
    return;
  }

  revalidatePath("/mercado/notas");
}
