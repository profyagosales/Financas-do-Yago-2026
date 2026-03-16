"use client";

import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormModalProps {
  title: string;
  triggerLabel: ReactNode;
  description?: string;
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "xl";
}

const WIDTH_BY_SIZE: Record<NonNullable<FormModalProps["size"]>, string> = {
  md: "max-w-xl",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function FormModal({
  title,
  triggerLabel,
  description,
  children,
  triggerVariant = "secondary",
  size = "lg",
}: FormModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <Button type="button" variant={triggerVariant} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
          <button
            type="button"
            className="absolute inset-0 bg-[color:color-mix(in_srgb,var(--foreground)_30%,transparent)] backdrop-blur-sm"
            aria-label="Fechar modal"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-3xl border border-[color:color-mix(in_srgb,var(--border)_82%,var(--accent))] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] p-3 shadow-[0_30px_80px_color-mix(in_srgb,var(--foreground)_18%,transparent)] backdrop-blur-xl md:max-h-[calc(100vh-4rem)] md:p-4",
              WIDTH_BY_SIZE[size],
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[color:var(--foreground)]">{title}</h2>
                {description ? <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p> : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} aria-label="Fechar modal" className="h-9 w-9 p-0">
                <X size={18} />
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
