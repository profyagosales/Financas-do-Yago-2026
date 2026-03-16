interface Insertable {
  insert: (payload: unknown) => unknown;
}

interface Fromable {
  from: (table: string) => Insertable;
}

interface ExportAuditInput {
  userId: string;
  module: string;
  exportName: string;
  format: "csv" | "json";
  mode?: string | null;
  filters: Record<string, unknown>;
  rowCount: number;
}

export async function logExportAudit(supabase: Fromable, input: ExportAuditInput) {
  try {
    await (supabase.from("export_history").insert({
      user_id: input.userId,
      module: input.module,
      export_name: input.exportName,
      format: input.format,
      mode: input.mode ?? null,
      filters: input.filters,
      row_count: input.rowCount,
    }) as Promise<unknown>);
  } catch {
    // Não bloquear download por falha de auditoria.
  }
}
