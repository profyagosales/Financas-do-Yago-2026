"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { investmentAssetSchema, investmentTransactionSchema } from "@/lib/validators/schemas";

function assetClassToPath(assetClass: string) {
  const map: Record<string, string> = {
    fixed_income: "renda-fixa",
    fii: "fiis",
    stock: "bolsa",
    crypto: "cripto",
  };
  return `/investimentos/${map[assetClass] ?? assetClass}`;
}

function opt(v?: string | null): string | null {
  if (!v || v.trim() === "") return null;
  return v.trim();
}

export async function createInvestmentAsset(input: unknown) {
  const payload = investmentAssetSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("investment_assets").insert({
    user_id: userId,
    name: payload.name,
    ticker: opt(payload.ticker),
    asset_class: payload.asset_class,
    asset_subtype: opt(payload.asset_subtype),
    broker: opt(payload.broker),
    currency: payload.currency || "BRL",
    notes: opt(payload.notes),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(assetClassToPath(payload.asset_class));
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteInvestmentAsset(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { data: assets } = await supabase
    .from("investment_assets")
    .select("asset_class")
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1);

  await supabase.from("investment_assets").delete().eq("id", id).eq("user_id", userId);

  if (assets?.[0]) revalidatePath(assetClassToPath(assets[0].asset_class));
  revalidatePath("/dashboard");
}

export async function createInvestmentTransaction(input: unknown) {
  const payload = investmentTransactionSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { data: assets } = await supabase
    .from("investment_assets")
    .select("id, asset_class")
    .eq("id", payload.asset_id)
    .eq("user_id", userId)
    .limit(1);

  if (!assets || assets.length === 0) return { ok: false, message: "Ativo nao encontrado" };

  const { error } = await supabase.from("investment_transactions").insert({
    user_id: userId,
    asset_id: payload.asset_id,
    transaction_type: payload.transaction_type,
    transaction_date: payload.transaction_date,
    quantity: payload.quantity ?? null,
    unit_price: payload.unit_price ?? null,
    total_amount: payload.total_amount,
    fees: payload.fees ?? 0,
    notes: opt(payload.notes),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath(assetClassToPath(assets[0].asset_class));
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteInvestmentTransaction(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { data: txs } = await supabase
    .from("investment_transactions")
    .select("asset_id")
    .eq("id", id)
    .eq("user_id", userId)
    .limit(1);

  await supabase.from("investment_transactions").delete().eq("id", id).eq("user_id", userId);

  if (txs?.[0]) {
    const { data: assets } = await supabase
      .from("investment_assets")
      .select("asset_class")
      .eq("id", txs[0].asset_id)
      .limit(1);
    if (assets?.[0]) revalidatePath(assetClassToPath(assets[0].asset_class));
  }
  revalidatePath("/dashboard");
}
