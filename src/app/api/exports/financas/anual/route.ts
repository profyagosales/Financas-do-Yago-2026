import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function csvCell(value: unknown) {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET() {
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
  const start = `${year}-01-01`;
  const end = `${year + 1}-01-01`;

  const { data } = await supabase
    .from("transactions")
    .select("type, amount, competency_date")
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

  const filename = `financas-anual-${year}.csv`;

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
