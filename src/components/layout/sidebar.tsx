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
import { SiteBrand } from "@/components/common/site-brand";
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
  { label: "Finanças", href: "/financas", prefix: "/financas", icon: CircleDollarSign },
  { label: "Investimentos", href: "/investimentos", prefix: "/investimentos", icon: TrendingUp },
  { label: "Milhas", href: "/milhas", prefix: "/milhas", icon: Plane },
  { label: "Mercado", href: "/mercado", prefix: "/mercado", icon: ShoppingCart },
  { label: "Lista de Desejo", href: "/lista-de-desejo", icon: Heart },
  { label: "Metas", href: "/metas", icon: Goal },
  { label: "Relatórios", href: "/relatorios", icon: ChartColumnBig },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (item: NavLink) => pathname === item.href || (item.prefix ? pathname.startsWith(item.prefix) : false);

  const principal = links.slice(0, 6);
  const secundario = links.slice(6);

  return (
    <aside className="sticky top-0 hidden h-screen w-52 shrink-0 overflow-y-auto border-r border-[color:var(--border)] bg-[linear-gradient(182deg,color-mix(in_srgb,var(--surface)_95%,transparent),color-mix(in_srgb,var(--surface)_84%,var(--accent)_16%))] px-2.5 py-5 lg:block">
      <div className="mb-5 px-1">
        <SiteBrand compact />
      </div>

      <nav className="space-y-1">
        {principal.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition",
                isActive(item)
                  ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                  : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
              )}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="my-4 h-px bg-[color:var(--border)]" />

      <nav className="space-y-1">
        {secundario.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-2.5 py-2 text-[13px] font-semibold transition",
                isActive(item)
                  ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                  : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
              )}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
