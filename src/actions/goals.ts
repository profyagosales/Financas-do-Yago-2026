"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { goalContributionSchema, goalSchema } from "@/lib/validators/schemas";

function normalizeOptional(value?: string | null) {
  if (!value || value.trim() === "") return undefined;
  return value;
}

export async function createGoal(input: unknown) {
  const payload = goalSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Não autenticado" };

  const { error } = await supabase.from("financial_goals").insert({
    ...payload,
    user_id: userId,
    description: normalizeOptional(payload.description),
    target_date: normalizeOptional(payload.target_date),
    category: normalizeOptional(payload.category),
    destination_account_id: normalizeOptional(payload.destination_account_id),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addGoalContribution(input: unknown) {
  const payload = goalContributionSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Não autenticado" };

  const { error } = await supabase.from("goal_contributions").insert({
    ...payload,
    user_id: userId,
    source_account_id: normalizeOptional(payload.source_account_id),
    notes: normalizeOptional(payload.notes),
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setGoalStatus(id: string, status: "active" | "paused" | "completed") {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from("financial_goals")
    .update({ status })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return;

  revalidatePath("/metas");
  revalidatePath("/dashboard");
}

export async function deleteGoal(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("financial_goals").delete().eq("id", id).eq("user_id", userId);
  if (error) return;

  revalidatePath("/metas");
  revalidatePath("/dashboard");
}
