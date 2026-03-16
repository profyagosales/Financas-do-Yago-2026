"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { label: string; href: Route };
type NavSection = {
  label: string;
  href?: string;
  prefix?: string;
  items?: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "Painel",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Busca Global", href: "/busca" },
    ],
  },
  {
    label: "Financas",
    prefix: "/financas",
    items: [
      { label: "Mensal", href: "/financas/mensal" },
      { label: "Anual", href: "/financas/anual" },
      { label: "Contas", href: "/financas/contas" },
      { label: "Cartoes", href: "/financas/cartoes" },
      { label: "Lancamentos", href: "/financas/lancamentos" },
      { label: "Categorias", href: "/financas/categorias" },
    ],
  },
  {
    label: "Investimentos",
    prefix: "/investimentos",
    items: [
      { label: "Renda Fixa", href: "/investimentos/renda-fixa" },
      { label: "FIIs", href: "/investimentos/fiis" },
      { label: "Bolsa", href: "/investimentos/bolsa" },
      { label: "Cripto", href: "/investimentos/cripto" },
      { label: "Rebalanceamento", href: "/investimentos/rebalanceamento" },
    ],
  },
  {
    label: "Milhas",
    prefix: "/milhas",
    items: [
      { label: "Livelo", href: "/milhas/livelo" },
      { label: "Latam Pass", href: "/milhas/latam-pass" },
      { label: "Azul", href: "/milhas/azul" },
    ],
  },
  {
    label: "Mercado",
    prefix: "/mercado",
    items: [
      { label: "Listas", href: "/mercado/listas" },
      { label: "Notas", href: "/mercado/notas" },
      { label: "Historico", href: "/mercado/historico" },
    ],
  },
  {
    label: "Planejamento",
    items: [
      { label: "Lista de Desejo", href: "/lista-de-desejo" },
      { label: "Metas", href: "/metas" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Relatorios", href: "/relatorios" },
      { label: "Configuracoes", href: "/configuracoes" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  const isSectionOpen = (section: NavSection) => {
    if (!section.items || section.items.length === 0) return false;
    if (section.prefix && pathname.startsWith(section.prefix)) return true;
    return section.items.some((item) => pathname === item.href);
  };

  return (
    <aside className="hidden h-screen w-72 overflow-y-auto border-r px-4 py-6 lg:block border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,transparent)]">
      <p className="mb-6 text-xl font-black tracking-tight text-[color:var(--accent)]">Financeiro do Yago</p>
      <nav className="space-y-3">
        {sections.map((section) => (
          <details key={section.label} open={isSectionOpen(section)} className="group rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/70 px-2 py-2">
            <summary className="cursor-pointer list-none px-2 py-1 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
              <div className="flex items-center justify-between">
                <span>{section.label}</span>
                <span className="text-[10px] transition group-open:rotate-90">▸</span>
              </div>
            </summary>

            <div className="mt-1 space-y-1">
              {section.items?.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition",
                    isActive(item.href)
                      ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                      : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </nav>
    </aside>
  );
}
