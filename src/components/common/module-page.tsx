import { BackButton } from "@/components/common/back-button";

interface Props {
  title: string;
  subtitle: string;
  bullets: string[];
}

export function ModulePage({ title, subtitle, bullets }: Props) {
  const breadcrumb = title.split(/\s[>›]\s/).filter(Boolean);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[color:var(--border)] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_12%,var(--surface)_88%),color-mix(in_srgb,var(--surface)_96%,transparent))] p-4 md:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <BackButton />
          {breadcrumb.length > 1 ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">
              {breadcrumb.join(" / ")}
            </p>
          ) : null}
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[color:var(--foreground)]">{title}</h1>
        <p className="mt-1 text-sm text-[color:var(--muted)]">{subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {bullets.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
