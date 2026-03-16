import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const items = [
  { label: "Listas", href: "/mercado/listas", desc: "Listas de compra e itens recorrentes." },
  { label: "Notas", href: "/mercado/notas", desc: "Registro/revisao de notas com anexos." },
  { label: "Historico", href: "/mercado/historico", desc: "Historico de precos e comparativos." },
] as const;

export default function MercadoPage() {
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
