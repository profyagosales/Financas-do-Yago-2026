import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2",
        "border-[color:var(--border)] bg-[color:var(--surface)]/90 text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] ring-[color:var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
