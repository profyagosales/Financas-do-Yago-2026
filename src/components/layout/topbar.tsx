import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 backdrop-blur md:px-6 border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_88%,transparent)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--muted)]">Painel financeiro pessoal</p>
        <p className="text-sm text-[color:var(--foreground)]">Controle completo em um unico lugar</p>
      </div>
      <div className="flex items-center gap-2">
        <form action="/busca" method="get" className="hidden items-center gap-2 lg:flex">
          <input
            type="text"
            name="q"
            placeholder="Buscar em todo o app"
            className="w-64 rounded-xl border px-3 py-2 text-sm border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]"
          />
          <Button variant="secondary" type="submit">Buscar</Button>
        </form>
        <form action={signOut}>
          <Button variant="secondary" type="submit">
            Sair
          </Button>
        </form>
      </div>
    </header>
  );
}
