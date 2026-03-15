import { hasSupabaseEnv } from "@/lib/supabase/env";
import { csvCell, parseDateRange, parseStatusFilter, parseTypeFilter } from "@/lib/exports/finance-export";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function monthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
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

  const url = new URL(request.url);
  const fallback = monthRange();
  const range = parseDateRange(url, fallback.start, fallback.end);
  if (!range.ok) {
    return new Response(range.error, { status: 400 });
  }

  const start = range.start;
  const end = range.end;
  const typeFilter = parseTypeFilter(url);
  const statusFilter = parseStatusFilter(url, "all");

  let txQuery = supabase
    .from("transactions")
    .select("id, competency_date, type, status, description, amount, category_id")
    .eq("user_id", userId)
    .gte("competency_date", start)
    .lt("competency_date", end)
    .order("competency_date", { ascending: true })
    .limit(5000);

  if (typeFilter !== "all") {
    txQuery = txQuery.eq("type", typeFilter);
  }
  if (statusFilter === "non_canceled") {
    txQuery = txQuery.neq("status", "canceled");
  } else if (statusFilter !== "all") {
    txQuery = txQuery.eq("status", statusFilter);
  }

  const [{ data: txData }, { data: categoriesData }] = await Promise.all([
    txQuery,
    supabase.from("categories").select("id, name").eq("user_id", userId),
  ]);

  const categoriesMap = new Map((categoriesData ?? []).map((c) => [c.id, c.name]));

  const header = ["id", "competency_date", "type", "status", "description", "category", "amount"];
  const lines = [header.join(",")];

  for (const tx of txData ?? []) {
    const categoryName = tx.category_id ? categoriesMap.get(tx.category_id) ?? "Sem categoria" : "Sem categoria";
    lines.push(
      [
        csvCell(tx.id),
        csvCell(tx.competency_date),
        csvCell(tx.type),
        csvCell(tx.status),
        csvCell(tx.description),
        csvCell(categoryName),
        csvCell(Number(tx.amount ?? 0).toFixed(2)),
      ].join(","),
    );
  }

  const filename = `financas-mensal-${start}_a_${end}.csv`;

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename=${filename}`,
      "cache-control": "no-store",
    },
  });
}
