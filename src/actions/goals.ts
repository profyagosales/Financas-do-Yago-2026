"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { goalContributionSchema, goalSchema } from "@/lib/validators/schemas";

export async function createGoal(input: unknown) {
  const payload = goalSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("financial_goals").insert({ ...payload, user_id: userId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/metas");
  return { ok: true };
}

export async function addGoalContribution(input: unknown) {
  const payload = goalContributionSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("goal_contributions").insert({ ...payload, user_id: userId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/metas");
  revalidatePath("/dashboard");
  return { ok: true };
}
