"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import { ChartColumnBig, CircleDollarSign, Goal, Heart, Plane, Search, Settings, ShoppingCart, TrendingUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { SiteBrand } from "@/components/common/site-brand";
import { Button } from "@/components/ui/button";
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

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (item: NavLink) => pathname === item.href || (item.prefix ? pathname.startsWith(item.prefix) : false);

  return (
    <div className="fixed bottom-4 right-4 z-40 lg:hidden">
      <Button type="button" variant="secondary" onClick={() => setOpen(true)} className="rounded-full px-5 shadow-xl">
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

          <aside className="absolute right-0 top-0 h-full w-[84%] max-w-xs overflow-y-auto border-l border-[color:var(--border)] bg-[linear-gradient(182deg,color-mix(in_srgb,var(--surface)_96%,transparent),color-mix(in_srgb,var(--surface)_84%,var(--accent)_16%))] p-4">
            <div className="mb-5 flex items-center justify-between">
              <SiteBrand compact />
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
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition",
                    isActive(item)
                      ? "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)]"
                      : "text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
                  )}
                >
                  <item.icon size={15} />
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
