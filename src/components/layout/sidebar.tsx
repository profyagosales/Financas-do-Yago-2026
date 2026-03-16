"use client";

import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  ChartColumnBig,
  CircleDollarSign,
  Goal,
  Heart,
  Plane,
  Search,
  Settings,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavLink = {
  label: string;
  href: Route;
  prefix?: string;
  icon: LucideIcon;
};

const links: NavLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: ChartColumnBig },
  { label: "Busca Global", href: "/busca", icon: Search },
  { label: "Financas", href: "/financas", prefix: "/financas", icon: CircleDollarSign },
  { label: "Investimentos", href: "/investimentos", prefix: "/investimentos", icon: TrendingUp },
  { label: "Milhas", href: "/milhas", prefix: "/milhas", icon: Plane },
  { label: "Mercado", href: "/mercado", prefix: "/mercado", icon: ShoppingCart },
  { label: "Lista de Desejo", href: "/lista-de-desejo", icon: Heart },
  { label: "Metas", href: "/metas", icon: Goal },
  { label: "Relatorios", href: "/relatorios", icon: ChartColumnBig },
  { label: "Configuracoes", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (item: NavLink) => pathname === item.href || (item.prefix ? pathname.startsWith(item.prefix) : false);

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 overflow-y-auto border-r border-[color:var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_97%,transparent),color-mix(in_srgb,var(--surface)_86%,var(--accent)_14%))] px-3 py-6 lg:block">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--muted)]">Painel</p>
      <p className="mb-6 text-xl font-black tracking-tight text-[color:var(--accent)]">Financeiro do Yago</p>
      <nav className="space-y-1">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                isActive(item)
                  ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                  : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
              )}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
