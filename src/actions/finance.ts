"use server";

import { revalidatePath } from "next/cache";
import { normalizeIconQuery, resolveAndCacheIcon } from "@/lib/icon-discovery";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { bankAccountSchema, creditCardSchema, transactionSchema } from "@/lib/validators/schemas";

function sanitizeFileName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toMonthStart(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00Z`);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function buildCardDates(referenceMonth: string, closingDay: number, dueDay: number) {
  const monthDate = new Date(`${referenceMonth}T00:00:00Z`);
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();

  const closingDate = new Date(
    Date.UTC(year, month, Math.min(closingDay, daysInMonth(year, month))),
  );

  const dueMonth = dueDay <= closingDay ? month + 1 : month;
  const dueYear = dueMonth > 11 ? year + 1 : year;
  const normalizedDueMonth = dueMonth > 11 ? 0 : dueMonth;
  const dueDate = new Date(
    Date.UTC(dueYear, normalizedDueMonth, Math.min(dueDay, daysInMonth(dueYear, normalizedDueMonth))),
  );

  return {
    closing_date: closingDate.toISOString().slice(0, 10),
    due_date: dueDate.toISOString().slice(0, 10),
  };
}

async function rebuildCardBillsForUser(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: cards } = await supabase
    .from("credit_cards")
    .select("id, closing_day, due_day")
    .eq("user_id", userId)
    .eq("is_active", true);

  const cardMap = new Map((cards ?? []).map((card) => [card.id, card]));
  if (cardMap.size === 0) {
    await supabase.from("card_bills").delete().eq("user_id", userId);
    return;
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, credit_card_id, competency_date, amount, status")
    .eq("user_id", userId)
    .not("credit_card_id", "is", null)
    .neq("status", "canceled");

  const txIds = (transactions ?? []).map((tx) => tx.id);
  const { data: installments } = txIds.length
    ? await supabase
        .from("transaction_installments")
        .select("transaction_id, bill_month, amount")
        .eq("user_id", userId)
        .in("transaction_id", txIds)
    : { data: [] as Array<{ transaction_id: string; bill_month: string; amount: number }> };

  const installmentsByTx = (installments ?? []).reduce<Record<string, Array<{ bill_month: string; amount: number }>>>(
    (acc, row) => {
      if (!acc[row.transaction_id]) acc[row.transaction_id] = [];
      acc[row.transaction_id].push({ bill_month: row.bill_month, amount: Number(row.amount) });
      return acc;
    },
    {},
  );

  const aggregate = new Map<string, number>();

  for (const tx of transactions ?? []) {
    if (!tx.credit_card_id) continue;
    if (!cardMap.has(tx.credit_card_id)) continue;

    const rows = installmentsByTx[tx.id];
    if (rows && rows.length > 0) {
      for (const row of rows) {
        const month = toMonthStart(row.bill_month);
        const key = `${tx.credit_card_id}|${month}`;
        aggregate.set(key, (aggregate.get(key) ?? 0) + Number(row.amount));
      }
      continue;
    }

    const month = toMonthStart(tx.competency_date);
    const key = `${tx.credit_card_id}|${month}`;
    aggregate.set(key, (aggregate.get(key) ?? 0) + Number(tx.amount));
  }

  await supabase.from("card_bills").delete().eq("user_id", userId);

  if (aggregate.size === 0) return;

  const rows = Array.from(aggregate.entries()).map(([key, total]) => {
    const [creditCardId, referenceMonth] = key.split("|");
    const card = cardMap.get(creditCardId);
    if (!card) {
      throw new Error("Cartao nao encontrado para consolidacao de fatura.");
    }
    const dates = buildCardDates(referenceMonth, card.closing_day, card.due_day);
    return {
      user_id: userId,
      credit_card_id: creditCardId,
      reference_month: referenceMonth,
      closing_date: dates.closing_date,
      due_date: dates.due_date,
      total_amount: Number(total.toFixed(2)),
      status: "open",
    };
  });

  await supabase.from("card_bills").insert(rows);
}

export async function createBankAccount(input: unknown) {
  const payload = bankAccountSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("bank_accounts").insert({ ...payload, user_id: userId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/financas/contas");
  return { ok: true };
}

export async function deleteBankAccount(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("bank_accounts").delete().eq("id", id).eq("user_id", userId);
  if (error) return;

  revalidatePath("/financas/contas");
  revalidatePath("/dashboard");
}

export async function createCreditCard(input: unknown) {
  const payload = creditCardSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase.from("credit_cards").insert({ ...payload, user_id: userId });
  if (error) return { ok: false, message: error.message };

  revalidatePath("/financas/cartoes");
  return { ok: true };
}

export async function deleteCreditCard(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("credit_cards").delete().eq("id", id).eq("user_id", userId);
  if (error) return;

  await rebuildCardBillsForUser(userId);
  revalidatePath("/financas/cartoes");
  revalidatePath("/financas/lancamentos");
  revalidatePath("/dashboard");
}

export async function createTransaction(input: unknown) {
  const payload = transactionSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { installments, fixed_expense, ...base } = payload;
  let resolvedIconUrl = base.icon_url ?? null;
  if (!resolvedIconUrl) {
    const autoIcon = await resolveAndCacheIcon(supabase, userId, base.description);
    resolvedIconUrl = autoIcon?.icon_url ?? null;
  }
  const recurringMonthly = (base.is_recurring && base.recurring_rule === "monthly") || (fixed_expense && base.type === "expense");

  const insertBase = {
    ...base,
    icon_url: resolvedIconUrl,
    is_recurring: recurringMonthly || Boolean(base.is_recurring),
    recurring_rule: recurringMonthly ? "monthly" : base.recurring_rule ?? null,
  };

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({ ...insertBase, user_id: userId, status: "pending" })
    .select("id, competency_date, amount")
    .single();

  if (error || !inserted) return { ok: false, message: error?.message ?? "Falha ao inserir" };

  if (installments > 1) {
    const installmentGroupId = crypto.randomUUID();
    const baseDate = new Date(inserted.competency_date);
    const amount = Number(inserted.amount) / installments;

    const rows = Array.from({ length: installments }, (_, i) => {
      const billMonth = new Date(baseDate);
      billMonth.setMonth(baseDate.getMonth() + i);
      return {
        user_id: userId,
        installment_group_id: installmentGroupId,
        transaction_id: inserted.id,
        installment_number: i + 1,
        total_installments: installments,
        bill_month: billMonth.toISOString().slice(0, 10),
        amount,
      };
    });

    await supabase.from("transaction_installments").insert(rows);
  }

  if (recurringMonthly && installments === 1) {
    const baseDate = new Date(`${inserted.competency_date}T00:00:00Z`);
    const recurringRows = Array.from({ length: 24 }, (_, i) => {
      const nextDate = new Date(baseDate);
      nextDate.setUTCMonth(baseDate.getUTCMonth() + i + 1);
      return {
        ...insertBase,
        user_id: userId,
        status: "pending",
        payment_date: null,
        competency_date: nextDate.toISOString().slice(0, 10),
      };
    });

    await supabase.from("transactions").insert(recurringRows);
  }

  await rebuildCardBillsForUser(userId);

  revalidatePath("/financas/lancamentos");
  revalidatePath("/financas/cartoes");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function uploadCustomTransactionIcon(formData: FormData) {
  const file = formData.get("file");
  const label = String(formData.get("label") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Arquivo invalido" };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Apenas imagens sao permitidas" };
  }

  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, message: "Imagem muito grande (max 2MB)" };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const safeBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const key = `${userId}/custom-icons/${Date.now()}-${safeBase}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("icons").upload(key, file, {
    upsert: false,
    contentType: file.type,
  });

  if (uploadError) {
    return { ok: false, message: uploadError.message };
  }

  const { data: publicData } = supabase.storage.from("icons").getPublicUrl(key);
  const iconUrl = publicData.publicUrl;

  const normalized = normalizeIconQuery(label || "custom");
  if (normalized) {
    await supabase.from("icon_cache").upsert(
      {
        user_id: userId,
        normalized_query: normalized,
        icon_url: iconUrl,
        source: "custom_upload",
        usage_count: 1,
      },
      { onConflict: "user_id,normalized_query" },
    );
  }

  return { ok: true, icon_url: iconUrl };
}

export async function deleteTransaction(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
  if (error) return;

  await rebuildCardBillsForUser(userId);

  revalidatePath("/financas/lancamentos");
  revalidatePath("/financas/cartoes");
  revalidatePath("/dashboard");
}

export async function setTransactionStatus(id: string, status: "pending" | "paid") {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await supabase
    .from("transactions")
    .update({ status, payment_date: status === "paid" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return;

  revalidatePath("/financas/lancamentos");
  revalidatePath("/dashboard");
}

export async function uploadTransactionAttachment(formData: FormData) {
  const transactionId = String(formData.get("transaction_id") ?? "");
  const attachmentKind = String(formData.get("attachment_kind") ?? "general") as "bill" | "receipt" | "general";
  const file = formData.get("file");

  if (!transactionId || !(file instanceof File) || file.size === 0) return;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) return;

  const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const safeBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, ""));
  const key = `${userId}/transactions/${transactionId}/${attachmentKind}-${Date.now()}-${safeBase}.${fileExt}`;

  const { error: uploadError } = await supabase.storage.from("attachments").upload(key, file, {
    upsert: false,
    contentType: file.type || "application/octet-stream",
  });

  if (uploadError) return;

  const { error: rowError } = await supabase.from("attachments").insert({
    user_id: userId,
    related_type: "transaction",
    related_id: transactionId,
    file_path: key,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    file_size: file.size,
    attachment_kind: attachmentKind,
  });

  if (rowError) {
    await supabase.storage.from("attachments").remove([key]);
    return;
  }

  revalidatePath("/financas/lancamentos");
}
