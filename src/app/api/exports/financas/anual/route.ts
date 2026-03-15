import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function isIsoDate(value: string | null) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return new Response("Supabase nao configurado", { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return new Response("Nao autenticado", { status: 401 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "summary";
  const qStart = url.searchParams.get("start");
  const qEnd = url.searchParams.get("end");
  const start: string = isIsoDate(qStart) ? (qStart as string) : `${year}-01-01`;
  const end: string = isIsoDate(qEnd) ? (qEnd as string) : `${year + 1}-01-01`;

  if (start >= end) {
    return new Response("Intervalo invalido", { status: 400 });
  }

  const { data } = await supabase
    .from("transactions")
    .select("id, competency_date, type, status, description, amount")
    .eq("user_id", userId)
    .gte("competency_date", start)
    .lt("competency_date", end)
    .neq("status", "canceled")
    .order("competency_date", { ascending: true })
    .limit(20000);

  const rows = (data ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount ?? 0),
  }));

  if (mode === "detailed") {
    const detailHeader = ["id", "competency_date", "type", "status", "description", "amount"];
    const detailLines = [detailHeader.join(",")];

    for (const row of rows) {
      detailLines.push(
        [
          csvCell(row.id),
          csvCell(row.competency_date),
          csvCell(row.type),
          csvCell(row.status),
          csvCell(row.description),
          csvCell(row.amount.toFixed(2)),
        ].join(","),
      );
    }

    return new Response(detailLines.join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=financas-anual-detalhado-${start}_a_${end}.csv`,
        "cache-control": "no-store",
      },
    });
  }

  const monthly = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthRows = rows.filter((row) => {
      const month = new Date(`${row.competency_date}T00:00:00Z`).getUTCMonth();
      return month === monthIndex;
    });

    const income = monthRows
      .filter((row) => row.type === "income")
      .reduce((sum, row) => sum + row.amount, 0);
    const expense = monthRows
      .filter((row) => row.type === "expense")
      .reduce((sum, row) => sum + row.amount, 0);

    return {
      month: MONTHS[monthIndex],
      income,
      expense,
      result: income - expense,
      count: monthRows.length,
    };
  });

  const header = ["month", "income", "expense", "result", "transactions_count"];
  const lines = [header.join(",")];

  for (const row of monthly) {
    lines.push(
      [
        csvCell(row.month),
        csvCell(row.income.toFixed(2)),
        csvCell(row.expense.toFixed(2)),
        csvCell(row.result.toFixed(2)),
        csvCell(row.count),
      ].join(","),
    );
  }

  const filename = `financas-anual-resumo-${start}_a_${end}.csv`;

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
