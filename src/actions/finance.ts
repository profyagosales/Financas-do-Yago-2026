"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeIconQuery, resolveAndCacheIcon } from "@/lib/icon-discovery";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { bankAccountReconciliationSchema, bankAccountSchema, creditCardSchema, transactionSchema } from "@/lib/validators/schemas";

function sanitizeFileName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeCsvHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseCsvRow(line: string, delimiter: "," | ";") {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvContent(content: string) {
  const normalized = content.replace(/^\uFEFF/, "");
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { headers: [] as string[], rows: [] as Array<Record<string, string>> };
  }

  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const delimiter: "," | ";" = semicolonCount > commaCount ? ";" : ",";

  const rawHeaders = parseCsvRow(firstLine, delimiter).map((value) => normalizeCsvHeader(value));
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvRow(line, delimiter);
    return rawHeaders.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });

  return { headers: rawHeaders, rows };
}

function parseCsvMoney(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(/\./g, "").replace(/,/g, ".");
  const parsed = Number(cleaned);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function normalizeCsvType(value: string) {
  const v = value.trim().toLowerCase();
  if (["income", "receita"].includes(v)) return "income" as const;
  if (["expense", "despesa"].includes(v)) return "expense" as const;
  if (["transfer", "transferencia"].includes(v)) return "transfer" as const;
  if (["adjustment", "ajuste"].includes(v)) return "adjustment" as const;
  return null;
}

function normalizeCsvStatus(value: string) {
  const v = value.trim().toLowerCase();
  if (["paid", "pago"].includes(v)) return "paid" as const;
  if (["canceled", "cancelado"].includes(v)) return "canceled" as const;
  if (["pending", "pendente", ""].includes(v)) return "pending" as const;
  return null;
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

export async function updateBankAccount(id: string, input: unknown) {
  const payload = bankAccountSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase
    .from("bank_accounts")
    .update({ ...payload })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/financas/contas");
  revalidatePath("/dashboard");
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

export async function reconcileBankAccount(input: unknown) {
  const payload = bankAccountReconciliationSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase
    .from("bank_accounts")
    .update({
      reconciled_balance: payload.reconciled_balance,
      reconciled_at: payload.reconciled_at,
      reconciliation_notes: payload.reconciliation_notes?.trim() || null,
    })
    .eq("id", payload.account_id)
    .eq("user_id", userId);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/financas/contas");
  revalidatePath("/dashboard");
  return { ok: true };
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

export async function updateCreditCard(id: string, input: unknown) {
  const payload = creditCardSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  const { error } = await supabase
    .from("credit_cards")
    .update({ ...payload })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/financas/cartoes");
  revalidatePath("/dashboard");
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
  return { ok: true, id: inserted.id };
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

export async function importTransactionsCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return;
  }

  const maxBytes = 2 * 1024 * 1024;
  if (file.size > maxBytes) {
    return;
  }

  const content = await file.text();
  const { headers, rows } = parseCsvContent(content);

  const requiredHeaders = ["competency_date", "description", "type", "amount"];
  const missing = requiredHeaders.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const [{ data: categoriesData }, { data: accountsData }, { data: cardsData }] = await Promise.all([
    supabase.from("categories").select("id, name").eq("user_id", userId),
    supabase.from("bank_accounts").select("id, name").eq("user_id", userId),
    supabase.from("credit_cards").select("id, name").eq("user_id", userId),
  ]);

  const categoryByName = new Map(
    (categoriesData ?? []).map((item) => [item.name.trim().toLowerCase(), item.id]),
  );
  const accountByName = new Map(
    (accountsData ?? []).map((item) => [item.name.trim().toLowerCase(), item.id]),
  );
  const cardByName = new Map(
    (cardsData ?? []).map((item) => [item.name.trim().toLowerCase(), item.id]),
  );

  const validRows: Array<{
    user_id: string;
    type: "income" | "expense" | "transfer" | "adjustment";
    description: string;
    amount: number;
    category_id: string | null;
    account_id: string | null;
    destination_account_id: string | null;
    credit_card_id: string | null;
    competency_date: string;
    payment_date: string | null;
    notes: string | null;
    status: "pending" | "paid" | "canceled";
  }> = [];

  const errors: string[] = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const type = normalizeCsvType(row.type ?? "");
    const amount = parseCsvMoney(row.amount ?? "");
    const description = (row.description ?? "").trim();
    const competencyDate = (row.competency_date ?? "").trim();
    const categoryId = categoryByName.get((row.category ?? "").trim().toLowerCase()) ?? null;
    const accountId = accountByName.get((row.account ?? "").trim().toLowerCase()) ?? null;
    const destinationAccountId = accountByName.get((row.destination_account ?? "").trim().toLowerCase()) ?? null;
    const cardId = cardByName.get((row.credit_card ?? "").trim().toLowerCase()) ?? null;
    const status = normalizeCsvStatus(row.status ?? "pending");
    const paymentDate = (row.payment_date ?? "").trim() || null;
    const notes = (row.notes ?? "").trim() || null;

    if (!type) {
      errors.push(`Linha ${line}: tipo invalido.`);
      return;
    }
    if (!description || description.length < 3) {
      errors.push(`Linha ${line}: descricao invalida.`);
      return;
    }
    if (!competencyDate) {
      errors.push(`Linha ${line}: competency_date obrigatoria.`);
      return;
    }
    if (amount === null || amount <= 0) {
      errors.push(`Linha ${line}: valor invalido.`);
      return;
    }
    if (!status) {
      errors.push(`Linha ${line}: status invalido.`);
      return;
    }

    if (["income", "expense", "adjustment"].includes(type) && !categoryId) {
      errors.push(`Linha ${line}: categoria obrigatoria e deve existir.`);
      return;
    }

    if (type === "transfer" && (!accountId || !destinationAccountId)) {
      errors.push(`Linha ${line}: transferencia exige account e destination_account validos.`);
      return;
    }

    if (type === "expense" && !accountId && !cardId) {
      errors.push(`Linha ${line}: despesa exige account ou credit_card valido.`);
      return;
    }

    validRows.push({
      user_id: userId,
      type,
      description,
      amount,
      category_id: categoryId,
      account_id: accountId,
      destination_account_id: destinationAccountId,
      credit_card_id: cardId,
      competency_date: competencyDate,
      payment_date: status === "paid" ? paymentDate ?? competencyDate : null,
      notes,
      status,
    });
  });

  if (errors.length > 0) {
    return;
  }

  if (validRows.length === 0) {
    return;
  }

  const { error } = await supabase.from("transactions").insert(validRows);
  if (error) {
    return;
  }

  await rebuildCardBillsForUser(userId);
  revalidatePath("/financas/lancamentos");
  revalidatePath("/financas/cartoes");
  revalidatePath("/dashboard");
}

export async function updateTransaction(id: string, input: unknown) {
  const updateSchema = z.object({
    type: z.enum(["income", "expense", "transfer", "adjustment"]),
    description: z.string().min(3),
    amount: z.coerce.number().positive(),
    category_id: z.string().uuid().nullable().optional(),
    account_id: z.string().uuid().nullable().optional(),
    destination_account_id: z.string().uuid().nullable().optional(),
    credit_card_id: z.string().uuid().nullable().optional(),
    competency_date: z.string(),
    payment_date: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    status: z.enum(["pending", "paid", "canceled"]),
  });
  const payload = updateSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Nao autenticado" };

  function opt(v?: string | null) {
    return v && v.trim() !== "" ? v : null;
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      ...payload,
      category_id: opt(payload.category_id),
      account_id: opt(payload.account_id),
      destination_account_id: opt(payload.destination_account_id),
      credit_card_id: opt(payload.credit_card_id),
      payment_date: opt(payload.payment_date),
      notes: opt(payload.notes),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return { ok: false, message: error.message };

  await rebuildCardBillsForUser(userId);
  revalidatePath("/financas/lancamentos");
  revalidatePath("/financas/cartoes");
  revalidatePath("/dashboard");
  return { ok: true };
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
