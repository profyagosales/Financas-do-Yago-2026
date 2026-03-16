import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-[0.99]",
        variant === "primary" && "bg-[color:var(--button-primary-bg)] text-[color:var(--button-primary-fg)] hover:bg-[color:var(--button-primary-hover)]",
        variant === "secondary" && "bg-[color:var(--button-secondary-bg)] text-[color:var(--button-secondary-fg)] hover:bg-[color:var(--button-secondary-hover)]",
        variant === "ghost" && "bg-transparent text-[color:var(--foreground)] hover:bg-[color:var(--button-ghost-hover)]",
        className,
      )}
      {...props}
    />
  );
}
