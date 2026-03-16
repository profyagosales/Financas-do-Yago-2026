"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavLink = {
  label: string;
  href: Route;
  prefix?: string;
};

const links: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Busca Global", href: "/busca" },
  { label: "Financas", href: "/financas", prefix: "/financas" },
  { label: "Investimentos", href: "/investimentos", prefix: "/investimentos" },
  { label: "Milhas", href: "/milhas", prefix: "/milhas" },
  { label: "Mercado", href: "/mercado", prefix: "/mercado" },
  { label: "Lista de Desejo", href: "/lista-de-desejo" },
  { label: "Metas", href: "/metas" },
  { label: "Relatorios", href: "/relatorios" },
  { label: "Configuracoes", href: "/configuracoes" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavLink) => pathname === item.href || (item.prefix ? pathname.startsWith(item.prefix) : false);

  return (
    <div className="fixed bottom-4 right-4 z-40 lg:hidden">
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="shadow-xl">
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

            <nav className="space-y-1">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm transition",
                    isActive(item)
                      ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                      : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
