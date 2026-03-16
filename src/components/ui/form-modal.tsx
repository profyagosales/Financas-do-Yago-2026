"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormModalProps {
  title: string;
  triggerLabel: string;
  description?: string;
  children: ReactNode;
  triggerVariant?: "primary" | "secondary" | "ghost";
  size?: "md" | "lg" | "xl";
}

const WIDTH_BY_SIZE: Record<NonNullable<FormModalProps["size"]>, string> = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
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
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Fechar modal"
            onClick={() => setOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-2xl md:p-6",
              WIDTH_BY_SIZE[size],
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[color:var(--foreground)]">{title}</h2>
                {description ? <p className="mt-1 text-sm text-[color:var(--muted)]">{description}</p> : null}
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </div>

            <div>{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
