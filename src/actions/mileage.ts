"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { mileageEntrySchema, mileageGoalSchema } from "@/lib/validators/schemas";

const PATHS = ["/milhas/livelo", "/milhas/latam-pass", "/milhas/azul", "/dashboard"];

export async function addMileageEntry(input: unknown) {
  const payload = mileageEntrySchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Não autenticado" };

  const { data: programs } = await supabase
    .from("mileage_programs")
    .select("id")
    .eq("id", payload.program_id)
    .eq("user_id", userId)
    .limit(1);

  if (!programs || programs.length === 0) return { ok: false, message: "Programa não encontrado" };

  const { error } = await supabase.from("mileage_entries").insert({
    user_id: userId,
    program_id: payload.program_id,
    entry_type: payload.entry_type,
    points: payload.points,
    occurred_at: payload.occurred_at,
    expires_at: payload.expires_at?.trim() || null,
    source: payload.source?.trim() || null,
    notes: payload.notes?.trim() || null,
  });

  if (error) return { ok: false, message: error.message };

  for (const path of PATHS) revalidatePath(path);
  return { ok: true };
}

export async function deleteMileageEntry(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase.from("mileage_entries").delete().eq("id", id).eq("user_id", userId);

  for (const path of PATHS) revalidatePath(path);
}

export async function upsertMileageGoal(input: unknown) {
  const payload = mileageGoalSchema.parse(input);
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, message: "Não autenticado" };

  const { error } = await supabase
    .from("mileage_programs")
    .update({
      goal_points: payload.goal_points,
      goal_due_date: payload.goal_due_date?.trim() || null,
      goal_notes: payload.goal_notes?.trim() || null,
    })
    .eq("id", payload.program_id)
    .eq("user_id", userId);

  if (error) return { ok: false, message: error.message };

  for (const path of PATHS) revalidatePath(path);
  return { ok: true };
}

export async function clearMileageGoal(programId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  await supabase
    .from("mileage_programs")
    .update({ goal_points: null, goal_due_date: null, goal_notes: null })
    .eq("id", programId)
    .eq("user_id", userId);

  for (const path of PATHS) revalidatePath(path);
}

const VALID_ENTRY_TYPES = new Set(["earn", "transfer", "redeem", "expire", "adjustment"]);

export async function importMileageCsv(
  formData: FormData,
): Promise<{ ok: boolean; imported: number; errors: string[] }> {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return { ok: false, imported: 0, errors: ["Não autenticado"] };

  const file = formData.get("file");
  if (!(file instanceof Blob)) return { ok: false, imported: 0, errors: ["Arquivo não encontrado"] };
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { ok: false, imported: 0, errors: ["CSV vazio ou sem dados"] };

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["program_name", "entry_type", "points", "occurred_at"];
  const missing = required.filter((r) => !header.includes(r));
  if (missing.length > 0)
    return { ok: false, imported: 0, errors: [`Colunas obrigatorias ausentes: ${missing.join(", ")}`] };

  const idx = (col: string) => header.indexOf(col);
  const cell = (row: string[], col: string) => row[idx(col)]?.trim() ?? "";

  const programCache = new Map<string, string>();
  const errors: string[] = [];
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(",");
    const lineNum = i + 1;

    const programName = cell(row, "program_name");
    const entryType = cell(row, "entry_type");
    const pointsRaw = cell(row, "points");
    const occurredAt = cell(row, "occurred_at");

    if (!programName || !entryType || !pointsRaw || !occurredAt) {
      errors.push(`Linha ${lineNum}: campos obrigatorios faltando`);
      continue;
    }
    if (!VALID_ENTRY_TYPES.has(entryType)) {
      errors.push(`Linha ${lineNum}: entry_type inválido: "${entryType}"`);
      continue;
    }
    const points = parseInt(pointsRaw.replace(/[^0-9-]/g, ""), 10);
    if (isNaN(points)) {
      errors.push(`Linha ${lineNum}: points inválido`);
      continue;
    }

    let programId = programCache.get(programName.toLowerCase());
    if (!programId) {
      const { data: existing } = await supabase
        .from("mileage_programs")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", programName)
        .limit(1);
      if (existing && existing.length > 0) {
        programId = existing[0].id as string;
      } else {
        const { data: inserted, error: insertErr } = await supabase
          .from("mileage_programs")
          .insert({ user_id: userId, name: programName, color: "#6366f1" })
          .select("id")
          .single();
        if (insertErr || !inserted) {
          errors.push(
            `Linha ${lineNum}: erro ao criar programa "${programName}": ${insertErr?.message ?? "desconhecido"}`,
          );
          continue;
        }
        programId = inserted.id as string;
      }
      programCache.set(programName.toLowerCase(), programId);
    }

    const expiresAt = cell(row, "expires_at") || null;
    const source = cell(row, "source") || null;
    const notes = cell(row, "notes") || null;

    const { error: entryErr } = await supabase.from("mileage_entries").insert({
      user_id: userId,
      program_id: programId,
      entry_type: entryType,
      points,
      occurred_at: occurredAt,
      expires_at: expiresAt,
      source,
      notes,
    });

    if (entryErr) {
      errors.push(`Linha ${lineNum}: ${entryErr.message}`);
    } else {
      imported++;
    }
  }

  for (const path of PATHS) revalidatePath(path);
  return { ok: true, imported, errors };
}
