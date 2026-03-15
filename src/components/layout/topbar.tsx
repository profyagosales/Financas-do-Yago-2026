import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function Topbar() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur md:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Painel financeiro pessoal</p>
        <p className="text-sm text-slate-700">Controle completo em um unico lugar</p>
      </div>
      <form action={signOut}>
        <Button variant="secondary" type="submit">
          Sair
        </Button>
      </form>
    </header>
  );
}
