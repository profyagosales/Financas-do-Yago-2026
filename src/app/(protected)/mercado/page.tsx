import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const items = [
  { label: "Listas", href: "/mercado/listas", desc: "Listas de compra e itens recorrentes." },
  { label: "Notas", href: "/mercado/notas", desc: "Registro/revisao de notas com anexos." },
  { label: "Historico", href: "/mercado/historico", desc: "Historico de precos e comparativos." },
] as const;

type ItemRow = { was_purchased: boolean; unit_price: number | string | null };
type NoteRow = { review_status: "pending_review" | "reviewed" };

async function getMercadoHubData() {
  if (!hasSupabaseEnv()) {
    return {
      prefs: { currency: "BRL", locale: "pt-BR" },
      listas: 0,
      itens: 0,
      pendentesCompra: 0,
      notasPendentes: 0,
      estimativa: 0,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      prefs: { currency: "BRL", locale: "pt-BR" },
      listas: 0,
      itens: 0,
      pendentesCompra: 0,
      notasPendentes: 0,
      estimativa: 0,
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const [{ data: lists }, { data: items }, { data: notes }] = await Promise.all([
    supabase.from("grocery_lists").select("id").eq("user_id", userId),
    supabase.from("grocery_items").select("was_purchased, unit_price").eq("user_id", userId),
    supabase.from("grocery_notes").select("review_status").eq("user_id", userId),
  ]);

  const rows = (items ?? []) as ItemRow[];
  const noteRows = (notes ?? []) as NoteRow[];
  const pendentesCompra = rows.filter((item) => !item.was_purchased).length;
  const notasPendentes = noteRows.filter((note) => note.review_status === "pending_review").length;
  const estimativa = rows
    .filter((item) => !item.was_purchased)
    .reduce((acc, item) => acc + Number(item.unit_price ?? 0), 0);

  return {
    prefs,
    listas: (lists ?? []).length,
    itens: rows.length,
    pendentesCompra,
    notasPendentes,
    estimativa,
  };
}

export default async function MercadoPage() {
  const data = await getMercadoHubData();
  const formatMoney = (value: number) => toMoney(value, data.prefs.locale, data.prefs.currency);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Mercado"
        subtitle="Dashboard do modulo. Selecione o fluxo de listas, notas ou historico."
        bullets={[
          "Listas de compras",
          "Notas e revisao",
          "Historico de precos",
          "Comparativo por estabelecimento",
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Listas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.listas}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Itens</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.itens}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Pendentes de compra</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.pendentesCompra}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Notas pendentes</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{data.notasPendentes}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimativa restante</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{formatMoney(data.estimativa)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Submodulos de mercado</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition hover:bg-[color:var(--button-ghost-hover)]"
            >
              <p className="text-base font-bold text-[color:var(--foreground)]">{item.label}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{item.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
