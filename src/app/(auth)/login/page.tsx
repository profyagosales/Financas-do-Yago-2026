import { signInWithPassword } from "@/actions/auth";
import { SiteBrand } from "@/components/common/site-brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
      <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-emerald-200/45 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)]/90 p-6 shadow-xl backdrop-blur">
        <SiteBrand className="mb-4" />
        <h1 className="mt-2 text-2xl font-black text-[color:var(--foreground)]">Entrar</h1>
        <p className="mb-6 text-sm text-[color:var(--muted)]">Acesso seguro para o painel financeiro pessoal.</p>
        <form action={signInWithPassword} className="grid gap-3">
          <Input name="email" type="email" placeholder="E-mail" required />
          <Input name="password" type="password" placeholder="Senha" required />
          <Button type="submit">Entrar no painel</Button>
        </form>
      </section>
    </main>
  );
}
