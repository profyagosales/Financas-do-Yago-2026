"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ── Listar todas as tags do usuario ───────────────────────────────────────────
export async function getUserTags() {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];

  const { data } = await supabase
    .from("tags")
    .select("id, name, color")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  return data ?? [];
}

// ── Criar tag ─────────────────────────────────────────────────────────────────
export async function createTag(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim() || null;
  if (!name) return;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase
    .from("tags")
    .upsert({ user_id: userId, name, color }, { onConflict: "user_id,name" });

  revalidatePath("/financas/lancamentos");
}

// ── Excluir tag ───────────────────────────────────────────────────────────────
export async function deleteTag(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase.from("tags").delete().eq("id", id).eq("user_id", userId);
  revalidatePath("/financas/lancamentos");
}

// ── Atualizar tags de um lancamento (substitui completamente) ─────────────────
export async function setTransactionTags(transactionId: string, tagIds: string[]): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  // Verificar que o lancamento pertence ao usuario
  const { data: tx } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .single();
  if (!tx) return;

  // Remover todas as tags existentes e inserir as novas
  await supabase.from("transaction_tags").delete().eq("transaction_id", transactionId);

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ transaction_id: transactionId, tag_id: tagId }));
    await supabase.from("transaction_tags").insert(rows);
  }

  revalidatePath("/financas/lancamentos");
}

// ── Vincular lancamento a uma tag (toggle) ────────────────────────────────────
export async function toggleTransactionTag(formData: FormData): Promise<void> {
  const transactionId = String(formData.get("transaction_id") ?? "").trim();
  const tagId = String(formData.get("tag_id") ?? "").trim();
  const action = String(formData.get("action") ?? "").trim(); // "add" | "remove"
  if (!transactionId || !tagId) return;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  // Verificar que o lancamento pertence ao usuario
  const { data: tx } = await supabase
    .from("transactions")
    .select("id")
    .eq("id", transactionId)
    .eq("user_id", userId)
    .single();
  if (!tx) return;

  if (action === "remove") {
    await supabase
      .from("transaction_tags")
      .delete()
      .eq("transaction_id", transactionId)
      .eq("tag_id", tagId);
  } else {
    await supabase
      .from("transaction_tags")
      .upsert({ transaction_id: transactionId, tag_id: tagId });
  }

  revalidatePath("/financas/lancamentos");
}
