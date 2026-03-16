"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
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

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (item: NavLink) => pathname === item.href || (item.prefix ? pathname.startsWith(item.prefix) : false);

  return (
    <aside className="hidden h-screen w-72 overflow-y-auto border-r px-4 py-6 lg:block border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_96%,transparent)]">
      <p className="mb-6 text-xl font-black tracking-tight text-[color:var(--accent)]">Financeiro do Yago</p>
      <nav className="space-y-1">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
  );
}
