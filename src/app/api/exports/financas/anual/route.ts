import { hasSupabaseEnv } from "@/lib/supabase/env";
import { logExportAudit } from "@/lib/exports/export-audit";
import { csvCell, parseDateRange, parseFormatFilter, parseStatusFilter, parseTypeFilter } from "@/lib/exports/finance-export";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return new Response("Supabase não configurado", { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return new Response("Não autenticado", { status: 401 });
  }

  const now = new Date();
  const year = now.getUTCFullYear();

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") ?? "summary";
  const range = parseDateRange(url, `${year}-01-01`, `${year + 1}-01-01`);
  if (!range.ok) {
    return new Response(range.error, { status: 400 });
  }

  const start = range.start;
  const end = range.end;
  const typeFilter = parseTypeFilter(url);
  const statusFilter = parseStatusFilter(url, "non_canceled");
  const format = parseFormatFilter(url, "csv");

  let txQuery = supabase
    .from("transactions")
    .select("id, competency_date, type, status, description, amount")
    .eq("user_id", userId)
    .gte("competency_date", start)
    .lt("competency_date", end)
    .order("competency_date", { ascending: true })
    .limit(20000);

  if (typeFilter !== "all") {
    txQuery = txQuery.eq("type", typeFilter);
  }
  if (statusFilter === "non_canceled") {
    txQuery = txQuery.neq("status", "canceled");
  } else if (statusFilter !== "all") {
    txQuery = txQuery.eq("status", statusFilter);
  }

  const { data } = await txQuery;

  const rows = (data ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount ?? 0),
  }));

  if (mode === "detailed") {
    if (format === "json") {
      const filename = `financas-anual-detalhado-${start}_a_${end}.json`;
      const payload = {
        meta: {
          mode,
          range: { start, end },
          filters: { type: typeFilter, status: statusFilter, format },
          count: rows.length,
        },
        data: rows,
      };

      await logExportAudit(supabase, {
        userId,
        module: "financas",
        exportName: "anual",
        format,
        mode,
        filters: { start, end, type: typeFilter, status: statusFilter },
        rowCount: rows.length,
      });

      return new Response(JSON.stringify(payload, null, 2), {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "content-disposition": `attachment; filename=${filename}`,
          "cache-control": "no-store",
        },
      });
    }

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

    await logExportAudit(supabase, {
      userId,
      module: "financas",
      exportName: "anual",
      format,
      mode,
      filters: { start, end, type: typeFilter, status: statusFilter },
      rowCount: rows.length,
    });

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

  if (format === "json") {
    const filename = `financas-anual-resumo-${start}_a_${end}.json`;
    const payload = {
      meta: {
        mode,
        range: { start, end },
        filters: { type: typeFilter, status: statusFilter, format },
        count: monthly.length,
      },
      data: monthly,
    };

    await logExportAudit(supabase, {
      userId,
      module: "financas",
      exportName: "anual",
      format,
      mode,
      filters: { start, end, type: typeFilter, status: statusFilter },
      rowCount: monthly.length,
    });

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename=${filename}`,
        "cache-control": "no-store",
      },
    });
  }

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

  await logExportAudit(supabase, {
    userId,
    module: "financas",
    exportName: "anual",
    format,
    mode,
    filters: { start, end, type: typeFilter, status: statusFilter },
    rowCount: monthly.length,
  });

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
