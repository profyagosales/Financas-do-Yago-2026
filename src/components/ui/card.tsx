import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 md:p-5",
        "border-[color:var(--border)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--surface)_97%,transparent),color-mix(in_srgb,var(--surface)_87%,var(--accent)_13%))] text-[color:var(--foreground)] shadow-[0_12px_30px_var(--shadow-color)]",
        className,
      )}
      {...props}
    />
  );
}
