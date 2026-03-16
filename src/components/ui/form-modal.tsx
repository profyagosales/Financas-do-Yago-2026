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
  footer?: ReactNode;
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
  footer,
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

          <div className={cn("relative z-10 w-full overflow-visible", WIDTH_BY_SIZE[size])}>
            <div className="pointer-events-none absolute -inset-2 rounded-[28px] bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--accent)_18%,transparent),transparent_55%)] opacity-90" />

            <div className="relative flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl border border-[color:color-mix(in_srgb,var(--border)_78%,var(--accent))] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--surface)_94%,white),color-mix(in_srgb,var(--muted-surface)_40%,white))] shadow-[0_28px_75px_color-mix(in_srgb,var(--foreground)_16%,transparent)] backdrop-blur-xl md:max-h-[calc(100vh-4rem)]">
              <div className="flex items-start justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3 md:px-5 md:py-4">
                <div>
                  <h2 className="text-lg font-bold text-[color:var(--foreground)]">{title}</h2>
                  {description ? <p className="mt-0.5 text-sm text-[color:var(--muted)]">{description}</p> : null}
                </div>
              </div>

              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-5 md:py-4">
                {children}
              </div>

              {footer ? (
                <div className="bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_10%,transparent),color-mix(in_srgb,var(--surface)_96%,transparent))] px-4 pb-3 pt-3 md:px-5">
                  {footer}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar modal"
              className="absolute -right-3 -top-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] shadow-lg transition hover:scale-[1.03] hover:bg-[color:var(--muted-surface)]"
            >
              <X size={18} className="shrink-0" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
