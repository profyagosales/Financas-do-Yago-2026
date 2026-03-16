"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  ["Dashboard", "/dashboard"],
  ["Busca Global", "/busca"],
  ["Mensal", "/financas/mensal"],
  ["Anual", "/financas/anual"],
  ["Contas", "/financas/contas"],
  ["Cartoes", "/financas/cartoes"],
  ["Lancamentos", "/financas/lancamentos"],
  ["Categorias", "/financas/categorias"],
  ["Renda Fixa", "/investimentos/renda-fixa"],
  ["FIIs", "/investimentos/fiis"],
  ["Bolsa", "/investimentos/bolsa"],
  ["Cripto", "/investimentos/cripto"],
  ["Rebalanceamento", "/investimentos/rebalanceamento"],
  ["Livelo", "/milhas/livelo"],
  ["Latam Pass", "/milhas/latam-pass"],
  ["Azul", "/milhas/azul"],
  ["Mercado Listas", "/mercado/listas"],
  ["Mercado Notas", "/mercado/notas"],
  ["Historico de Precos", "/mercado/historico"],
  ["Lista de Desejo", "/lista-de-desejo"],
  ["Metas", "/metas"],
  ["Relatorios", "/relatorios"],
  ["Configuracoes", "/configuracoes"],
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 overflow-y-auto border-r px-4 py-6 lg:block border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,transparent)]">
      <p className="mb-6 text-xl font-black tracking-tight text-[color:var(--accent)]">Financeiro do Yago</p>
      <nav className="space-y-1">
        {links.map(([label, href]) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                  : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
