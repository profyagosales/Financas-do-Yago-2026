"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavSection = {
  label: string;
  prefix?: string;
  items: Array<{ label: string; href: Route }>;
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

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const sectionOpen = (section: NavSection) => {
    if (section.prefix && pathname.startsWith(section.prefix)) return true;
    return section.items.some((item) => item.href === pathname);
  };

  return (
    <div className="lg:hidden">
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Menu
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Fechar menu"
            onClick={() => setOpen(false)}
          />

          <aside className="absolute left-0 top-0 h-full w-[86%] max-w-sm overflow-y-auto border-r border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-black tracking-wide text-[color:var(--accent)]">Navegacao</p>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>

            <nav className="space-y-3">
              {sections.map((section) => (
                <details key={section.label} open={sectionOpen(section)} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]/80 px-2 py-2">
                  <summary className="cursor-pointer list-none px-2 py-1 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">
                    {section.label}
                  </summary>

                  <div className="mt-1 space-y-1">
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "block rounded-lg px-3 py-2 text-sm transition",
                          pathname === item.href
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
        </div>
      ) : null}
    </div>
  );
}
