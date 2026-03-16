import { signOut } from "@/actions/auth";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:color-mix(in_srgb,var(--surface)_90%,transparent)] px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-2">
        <MobileNav />
        <form action="/busca" method="get" className="hidden flex-1 items-center gap-2 lg:flex">
          <input
            type="text"
            name="q"
            placeholder="Buscar em todo o app"
            className="w-full max-w-md rounded-xl border px-3 py-2 text-sm border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--foreground)]"
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
