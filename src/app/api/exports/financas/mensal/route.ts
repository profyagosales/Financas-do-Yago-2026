import { hasSupabaseEnv } from "@/lib/supabase/env";
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

  const url = new URL(request.url);
  const qStart = url.searchParams.get("start");
  const qEnd = url.searchParams.get("end");

  const fallback = monthRange();
  const start: string = isIsoDate(qStart) ? (qStart as string) : fallback.start;
  const end: string = isIsoDate(qEnd) ? (qEnd as string) : fallback.end;

  if (start >= end) {
    return new Response("Intervalo invalido", { status: 400 });
  }

  const [{ data: txData }, { data: categoriesData }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, competency_date, type, status, description, amount, category_id")
      .eq("user_id", userId)
      .gte("competency_date", start)
      .lt("competency_date", end)
      .order("competency_date", { ascending: true })
      .limit(5000),
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
