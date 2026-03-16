import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const simpleSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]),
  competency_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ ok: false, message: "Configuracao ausente" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return NextResponse.json({ ok: false, message: "Nao autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "JSON invalido" }, { status: 400 });
  }

  const parsed = simpleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Dados invalidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { data: inserted, error } = await supabase
    .from("transactions")
    .insert({ ...parsed.data, user_id: userId, status: "pending" })
    .select("id")
    .single();

  if (error ?? !inserted) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Erro ao inserir" },
      { status: 500 },
    );
  }

  revalidatePath("/financas/lancamentos");
  revalidatePath("/dashboard");

  return NextResponse.json({ ok: true, id: inserted.id });
}
