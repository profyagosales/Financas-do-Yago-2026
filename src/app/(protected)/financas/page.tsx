import Link from "next/link";
import { ModulePage } from "@/components/common/module-page";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const items = [
  { label: "Mensal", href: "/financas/mensal", desc: "Fechamento mensal com receitas, despesas e saldo." },
  { label: "Anual", href: "/financas/anual", desc: "Comparativo anual e sazonalidade dos lancamentos." },
  { label: "Contas", href: "/financas/contas", desc: "Gestao de contas e conciliacao manual." },
  { label: "Cartoes", href: "/financas/cartoes", desc: "Limites, faturas e compras por cartao." },
  { label: "Lancamentos", href: "/financas/lancamentos", desc: "CRUD completo de transacoes com anexos e tags." },
  { label: "Categorias", href: "/financas/categorias", desc: "Cadastro e manutencao de categorias." },
] as const;

export default function FinancasPage() {
  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas"
        subtitle="Dashboard do modulo. Entre no subdominio desejado pelos atalhos abaixo."
        bullets={[
          "Visao mensal e anual",
          "Contas, cartoes e lancamentos",
          "Categorias e filtros",
          "Base central do fluxo financeiro",
        ]}
      />

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Submodulos de financas</h3>
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
