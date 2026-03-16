import Link from "next/link";
import { CircleDollarSign, Plane, ShieldCheck } from "lucide-react";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const programs = [
  { label: "Livelo", href: "/milhas/livelo", desc: "Saldo, vencimentos e historico do programa Livelo.", icon: CircleDollarSign, tone: "from-sky-50 to-cyan-50" },
  { label: "Latam Pass", href: "/milhas/latam-pass", desc: "Acompanhamento de pontos e emissao no Latam Pass.", icon: Plane, tone: "from-rose-50 to-orange-50" },
  { label: "Azul", href: "/milhas/azul", desc: "Controle de pontos e expiracao no Azul.", icon: ShieldCheck, tone: "from-blue-50 to-indigo-50" },
] as const;

type EntryRow = {
  program_id: string;
  entry_type: "earn" | "transfer" | "redeem" | "expire" | "adjustment";
  points: number | string;
  expires_at: string | null;
};

type ProgramRow = { id: string; name: string };

async function getMilhasHubData() {
  if (!hasSupabaseEnv()) {
    return { saldoTotal: 0, expiram90: 0, porPrograma: [] as Array<{ name: string; saldo: number }> };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { saldoTotal: 0, expiram90: 0, porPrograma: [] as Array<{ name: string; saldo: number }> };
  }

  const [{ data: programsData }, { data: entriesData }] = await Promise.all([
    supabase.from("mileage_programs").select("id, name").eq("user_id", userId).eq("is_active", true),
    supabase.from("mileage_entries").select("program_id, entry_type, points, expires_at").eq("user_id", userId),
  ]);

  const programs = (programsData ?? []) as ProgramRow[];
  const entries = (entriesData ?? []) as EntryRow[];
  const today = new Date();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + 90);

  const saldoByProgram = new Map<string, number>();
  let expiram90 = 0;

  for (const entry of entries) {
    const pts = Number(entry.points ?? 0);
    const plus = entry.entry_type === "earn" || entry.entry_type === "transfer";
    saldoByProgram.set(entry.program_id, (saldoByProgram.get(entry.program_id) ?? 0) + (plus ? pts : -pts));

    if (entry.entry_type === "earn" && entry.expires_at) {
      const expires = new Date(entry.expires_at);
      if (expires >= today && expires <= cutoff) expiram90 += pts;
    }
  }

  const porPrograma = programs.map((program) => ({ name: program.name, saldo: saldoByProgram.get(program.id) ?? 0 }));
  const saldoTotal = porPrograma.reduce((acc, item) => acc + item.saldo, 0);

  return { saldoTotal, expiram90, porPrograma };
}

export default async function MilhasPage() {
  const data = await getMilhasHubData();

  return (
    <div className="space-y-4">
      <ModulePage
        title="Milhas"
        subtitle="Dashboard do modulo. Selecione abaixo a companhia/programa para abrir o detalhe."
        bullets={[
          "Visao por programa",
          "Controle de vencimento",
          "Meta de emissao",
          "Importacao CSV de movimentacoes",
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Saldo total</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.saldoTotal.toLocaleString("pt-BR")}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Pontos vencendo em 90 dias</p>
          <p className="mt-1 text-2xl font-black text-amber-700">{data.expiram90.toLocaleString("pt-BR")}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Programas ativos</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{data.porPrograma.length}</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Saldo por programa</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {data.porPrograma.map((item) => (
            <div key={item.name} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
              {item.name}: <span className="font-bold">{item.saldo.toLocaleString("pt-BR")}</span>
            </div>
          ))}
          {data.porPrograma.length === 0 ? <p className="text-sm text-slate-600">Sem dados de programas ainda.</p> : null}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Programas de milhas</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.href}
              href={program.href}
              className={`rounded-2xl border border-[color:var(--border)] bg-gradient-to-br ${program.tone} p-4 transition hover:-translate-y-0.5`}
            >
              <div className="mb-2 inline-flex rounded-xl border border-[color:var(--border)] bg-white/80 p-2">
                <program.icon size={18} className="text-slate-700" />
              </div>
              <p className="text-base font-bold text-[color:var(--foreground)]">{program.label}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{program.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
