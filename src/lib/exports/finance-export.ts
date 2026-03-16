export type TransactionTypeFilter = "all" | "income" | "expense" | "transfer" | "adjustment";
export type TransactionStatusFilter = "all" | "non_canceled" | "pending" | "paid" | "overdue" | "canceled";
export type ExportFormat = "csv" | "json";

function isIsoDate(value: string | null) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseDateRange(input: URL, fallbackStart: string, fallbackEnd: string) {
  const qStart = input.searchParams.get("start");
  const qEnd = input.searchParams.get("end");

  const start: string = isIsoDate(qStart) ? (qStart as string) : fallbackStart;
  const end: string = isIsoDate(qEnd) ? (qEnd as string) : fallbackEnd;

  if (start >= end) {
    return { ok: false as const, error: "Intervalo inválido" };
  }

  return {
    ok: true as const,
    start,
    end,
  };
}

export function parseTypeFilter(input: URL): TransactionTypeFilter {
  const raw = input.searchParams.get("type");
  if (raw === "income" || raw === "expense" || raw === "transfer" || raw === "adjustment") return raw;
  return "all";
}

export function parseStatusFilter(input: URL, fallback: TransactionStatusFilter = "all"): TransactionStatusFilter {
  const raw = input.searchParams.get("status");
  if (raw === "all" || raw === "non_canceled" || raw === "pending" || raw === "paid" || raw === "overdue" || raw === "canceled") {
    return raw;
  }
  return fallback;
}

export function parseFormatFilter(input: URL, fallback: ExportFormat = "csv"): ExportFormat {
  const raw = input.searchParams.get("format");
  if (raw === "csv" || raw === "json") return raw;
  return fallback;
}

export function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}
