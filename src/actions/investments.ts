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

const VALID_TX_TYPES = new Set([
  "buy", "sell", "income", "dividend", "interest", "deposit", "withdraw", "adjustment",
]);
const VALID_ASSET_CLASSES = new Set(["fixed_income", "fii", "stock", "crypto"]);

export async function importInvestmentsCsv(
  formData: FormData,
): Promise<{ ok: boolean; imported: number; errors: string[] }> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, imported: 0, errors: ["Nao autenticado"] };

  const file = formData.get("file");
  if (!(file instanceof Blob)) return { ok: false, imported: 0, errors: ["Arquivo nao encontrado"] };
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { ok: false, imported: 0, errors: ["CSV vazio ou sem dados"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["asset_name", "transaction_type", "transaction_date", "total_amount"];
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length > 0)
    return { ok: false, imported: 0, errors: [`Colunas obrigatorias ausentes: ${missing.join(", ")}`] };

  const idx = (col: string) => header.indexOf(col);
  const cell = (row: string[], col: string) => row[idx(col)]?.trim() ?? "";

  const assetCache = new Map<string, string>();
  const errors: string[] = [];
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const lineNum = i + 1;

    const assetName = cell(row, "asset_name");
    const txType = cell(row, "transaction_type");
    const txDate = cell(row, "transaction_date");
    const totalAmountRaw = cell(row, "total_amount");

    if (!assetName || !txType || !txDate || !totalAmountRaw) {
      errors.push(`Linha ${lineNum}: campos obrigatorios faltando`);
      continue;
    }
    if (!VALID_TX_TYPES.has(txType)) {
      errors.push(`Linha ${lineNum}: transaction_type invalido: "${txType}"`);
      continue;
    }
    const totalAmount = parseFloat(totalAmountRaw.replace(",", "."));
    if (isNaN(totalAmount)) {
      errors.push(`Linha ${lineNum}: total_amount invalido`);
      continue;
    }

    const ticker = opt(cell(row, "ticker"));
    const rawClass = cell(row, "asset_class");
    const assetClass = VALID_ASSET_CLASSES.has(rawClass) ? rawClass : "stock";
    const broker = opt(cell(row, "broker"));

    const cacheKey = `${assetName}|${ticker ?? ""}`;
    let assetId = assetCache.get(cacheKey);

    if (!assetId) {
      const { data: existing } = await supabase
        .from("investment_assets")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", assetName)
        .limit(1);
      if (existing && existing.length > 0) {
        assetId = existing[0].id as string;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("investment_assets")
          .insert({ user_id: userId, name: assetName, ticker, asset_class: assetClass, broker, currency: "BRL" })
          .select("id")
          .single();
        if (insertErr || !inserted) {
          errors.push(
            `Linha ${lineNum}: erro ao criar ativo "${assetName}": ${insertErr?.message ?? "desconhecido"}`,
          );
          continue;
        }
        assetId = inserted.id as string;
      }
      assetCache.set(cacheKey, assetId);
    }

    const quantityRaw = cell(row, "quantity");
    const unitPriceRaw = cell(row, "unit_price");
    const feesRaw = cell(row, "fees");
    const notes = opt(cell(row, "notes"));

    const quantity = quantityRaw ? parseFloat(quantityRaw.replace(",", ".")) || null : null;
    const unitPrice = unitPriceRaw ? parseFloat(unitPriceRaw.replace(",", ".")) || null : null;
    const fees = feesRaw ? parseFloat(feesRaw.replace(",", ".")) || 0 : 0;

    const { error: txErr } = await supabase.from("investment_transactions").insert({
      user_id: userId,
      asset_id: assetId,
      transaction_type: txType,
      transaction_date: txDate,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      fees,
      notes,
    });

    if (txErr) {
      errors.push(`Linha ${lineNum}: ${txErr.message}`);
    } else {
      imported++;
    }
  }

  revalidatePath("/investimentos/bolsa");
  revalidatePath("/investimentos/fiis");
  revalidatePath("/investimentos/renda-fixa");
  revalidatePath("/investimentos/cripto");
  revalidatePath("/investimentos/rebalanceamento");
  revalidatePath("/dashboard");
  return { ok: true, imported, errors };
}
