import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const programs = [
  { label: "Livelo", href: "/milhas/livelo", desc: "Saldo, vencimentos e historico do programa Livelo." },
  { label: "Latam Pass", href: "/milhas/latam-pass", desc: "Acompanhamento de pontos e emissao no Latam Pass." },
  { label: "Azul", href: "/milhas/azul", desc: "Controle de pontos e expiracao no Azul." },
] as const;

export default function MilhasPage() {
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

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Programas de milhas</h3>
        <div className="grid gap-3 md:grid-cols-3">
          {programs.map((program) => (
            <Link
              key={program.href}
              href={program.href}
              className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 transition hover:bg-[color:var(--button-ghost-hover)]"
            >
              <p className="text-base font-bold text-[color:var(--foreground)]">{program.label}</p>
              <p className="mt-1 text-sm text-[color:var(--muted)]">{program.desc}</p>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
