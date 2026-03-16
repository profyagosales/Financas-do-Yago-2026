import { cn } from "@/lib/utils";

interface SiteBrandProps {
  compact?: boolean;
  className?: string;
}

export function SiteBrand({ compact = false, className }: SiteBrandProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="grid h-10 w-10 place-items-center rounded-2xl border border-[color:var(--border)] bg-[linear-gradient(145deg,color-mix(in_srgb,var(--accent)_22%,white),color-mix(in_srgb,var(--surface)_72%,#7dd3fc_28%))] shadow-[0_10px_25px_var(--shadow-color)]">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-[color:var(--foreground)]">
          <path d="M4.25 16.35c2.45-2.95 4.7-4.45 6.75-4.45 2.06 0 3.64 1.15 4.76 3.42l3.49-4.12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7.25" cy="7.25" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M6 7.25h2.5M7.25 6v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </span>

      {compact ? null : (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-[color:var(--muted)]">Painel pessoal</p>
          <p className="-mt-0.5 text-base font-black tracking-tight text-[color:var(--foreground)]">Financeiro do Yago</p>
        </div>
      )}
    </div>
  );
}