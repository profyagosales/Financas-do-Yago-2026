import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)] shadow-[0_10px_30px_var(--shadow-color)]",
        className,
      )}
      {...props}
    />
  );
}
