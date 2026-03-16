import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const items = [
  { label: "Renda Fixa", href: "/investimentos/renda-fixa", desc: "Titulos, CDBs, LCIs, LCAs e outros ativos de renda fixa." },
  { label: "FIIs", href: "/investimentos/fiis", desc: "Fundos imobiliarios e proventos." },
  { label: "Bolsa", href: "/investimentos/bolsa", desc: "Acoes, ETFs, BDRs e demais ativos de bolsa." },
  { label: "Cripto", href: "/investimentos/cripto", desc: "Criptoativos e movimentacoes manuais." },
  { label: "Rebalanceamento", href: "/investimentos/rebalanceamento", desc: "Comparativo da alocacao atual com metas da carteira." },
] as const;

export default function InvestimentosPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Investimentos"
        subtitle="Dashboard do modulo. Escolha abaixo o tipo de ativo para entrar no detalhe."
        bullets={[
          "Visao central por classe",
          "Entrada manual de movimentacoes",
          "Indicadores de rentabilidade e participacao",
          "Rebalanceamento da carteira",
        ]}
      />

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Acessar classe de investimento</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
