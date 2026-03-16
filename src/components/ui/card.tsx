import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        "border-[color:var(--border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_98%,transparent),color-mix(in_srgb,var(--surface)_92%,var(--accent)_8%))] text-[color:var(--foreground)] shadow-[0_14px_34px_var(--shadow-color)]",
        className,
      )}
      {...props}
    />
  );
}
