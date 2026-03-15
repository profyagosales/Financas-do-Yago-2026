import { signInWithPassword } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_20%,#22d3ee_0%,#f0f9ff_35%,#fff7ed_60%,#ffffff_100%)] px-4 py-8">
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Financeiro do Yago</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900">Entrar</h1>
        <p className="mb-6 text-sm text-slate-600">Acesso seguro para o painel financeiro pessoal.</p>
        <form action={signInWithPassword} className="grid gap-3">
          <Input name="email" type="email" placeholder="E-mail" required />
          <Input name="password" type="password" placeholder="Senha" required />
          <Button type="submit">Entrar no painel</Button>
        </form>
      </section>
    </main>
  );
}
