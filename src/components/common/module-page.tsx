import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface Props {
  title: string;
  subtitle: string;
  bullets: string[];
}

export function ModulePage({ title, subtitle, bullets }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Escopo inicial</h2>
          <Badge>MVP</Badge>
        </div>
        <ul className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
          {bullets.map((item) => (
            <li key={item} className="rounded-lg bg-slate-50 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
