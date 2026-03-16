import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logExportAudit } from "@/lib/exports/export-audit";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return new Response("Supabase não configurado", { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return new Response("Não autenticado", { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const [
    { data: profile },
    { data: settings },
    { data: bankAccounts },
    { data: creditCards },
    { data: categories },
    { data: tags },
    { data: transactions },
    { data: transactionInstallments },
    { data: cardBills },
    { data: attachments },
    { data: investmentAssets },
    { data: investmentTransactions },
    { data: mileagePrograms },
    { data: mileageEntries },
    { data: groceryLists },
    { data: groceryItems },
    { data: groceryNotes },
    { data: groceryPriceHistory },
    { data: wishlistItems },
    { data: financialGoals },
    { data: goalContributions },
    { data: exportHistory },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("bank_accounts").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("credit_cards").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("categories").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("tags").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("transaction_installments").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("card_bills").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("attachments").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("investment_assets").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("investment_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("mileage_programs").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("mileage_entries").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("grocery_lists").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("grocery_items").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("grocery_notes").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("grocery_price_history").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("wishlist_items").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("financial_goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("goal_contributions").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
    supabase.from("export_history").select("*").eq("user_id", userId).order("created_at", { ascending: true }).limit(50000),
  ]);

  const payload = {
    meta: {
      generated_at: nowIso,
      user_id: userId,
      version: 1,
      module: "backup",
      mode: "full",
    },
    data: {
      profile: profile ?? null,
      settings: settings ?? null,
      bank_accounts: bankAccounts ?? [],
      credit_cards: creditCards ?? [],
      categories: categories ?? [],
      tags: tags ?? [],
      transactions: transactions ?? [],
      transaction_installments: transactionInstallments ?? [],
      card_bills: cardBills ?? [],
      attachments: attachments ?? [],
      investment_assets: investmentAssets ?? [],
      investment_transactions: investmentTransactions ?? [],
      mileage_programs: mileagePrograms ?? [],
      mileage_entries: mileageEntries ?? [],
      grocery_lists: groceryLists ?? [],
      grocery_items: groceryItems ?? [],
      grocery_notes: groceryNotes ?? [],
      grocery_price_history: groceryPriceHistory ?? [],
      wishlist_items: wishlistItems ?? [],
      financial_goals: financialGoals ?? [],
      goal_contributions: goalContributions ?? [],
      export_history: exportHistory ?? [],
    },
  };

  const totalRows =
    (bankAccounts?.length ?? 0) +
    (creditCards?.length ?? 0) +
    (categories?.length ?? 0) +
    (tags?.length ?? 0) +
    (transactions?.length ?? 0) +
    (transactionInstallments?.length ?? 0) +
    (cardBills?.length ?? 0) +
    (attachments?.length ?? 0) +
    (investmentAssets?.length ?? 0) +
    (investmentTransactions?.length ?? 0) +
    (mileagePrograms?.length ?? 0) +
    (mileageEntries?.length ?? 0) +
    (groceryLists?.length ?? 0) +
    (groceryItems?.length ?? 0) +
    (groceryNotes?.length ?? 0) +
    (groceryPriceHistory?.length ?? 0) +
    (wishlistItems?.length ?? 0) +
    (financialGoals?.length ?? 0) +
    (goalContributions?.length ?? 0) +
    (exportHistory?.length ?? 0) +
    (profile ? 1 : 0) +
    (settings ? 1 : 0);

  await logExportAudit(supabase, {
    userId,
    module: "backup",
    exportName: "conta-completa",
    format: "json",
    mode: "full",
    filters: { generated_at: nowIso },
    rowCount: totalRows,
  });

  const filename = `financeiro-do-yago-backup-completo-${nowIso.slice(0, 10)}.json`;

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
