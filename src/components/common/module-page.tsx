interface Props {
  title: string;
  subtitle: string;
  bullets: string[];
}

export function ModulePage({ title, subtitle, bullets }: Props) {
  return (
    <div className="space-y-3">
      <div>
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
