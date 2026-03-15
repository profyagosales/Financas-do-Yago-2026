import { ModulePage } from "@/components/common/module-page";
import { deleteCategory, setCategoryActive } from "@/actions/categories";
import { CategoryForm } from "@/components/forms/category-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer" | "investment" | "mileage" | "grocery" | "goal";
  icon: string | null;
  color: string | null;
  is_default: boolean;
  is_active: boolean;
};

async function getCategoriesData() {
  if (!hasSupabaseEnv()) {
    return { hasEnv: false, rows: [] as CategoryRow[] };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return { hasEnv: true, rows: [] as CategoryRow[] };
  }

  const { data } = await supabase
    .from("categories")
    .select("id, name, type, icon, color, is_default, is_active")
    .eq("user_id", userId)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  return { hasEnv: true, rows: (data ?? []) as CategoryRow[] };
}

function typeLabel(type: CategoryRow["type"]) {
  if (type === "income") return "Receita";
  if (type === "expense") return "Despesa";
  if (type === "transfer") return "Transferencia";
  if (type === "investment") return "Investimento";
  if (type === "mileage") return "Milhas";
  if (type === "grocery") return "Mercado";
  return "Meta";
}

export default async function CategoriasPage() {
  const { hasEnv, rows } = await getCategoriesData();
  const active = rows.filter((item) => item.is_active).length;
  const defaults = rows.filter((item) => item.is_default).length;

  return (
    <div className="space-y-4">
      <ModulePage
        title="Financas > Categorias"
        subtitle="Categorias base para receitas, despesas e modulos extras."
        bullets={[
          "Tipos obrigatorios de categoria",
          "Ativar/desativar categoria",
          "Cores e icones",
          "Base para filtros globais",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total de categorias</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{rows.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Ativas</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{active}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Padrao (seed)</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{defaults}</p>
        </Card>
      </div>

      <CategoryForm />

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Categorias cadastradas</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma categoria cadastrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 py-2 pr-3">Nome</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Tipo</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Cor</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Icone</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Status</th>
                  <th className="border-b border-slate-200 py-2 pr-3">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-slate-100 py-2 pr-3 font-medium">{item.name}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">{typeLabel(item.type)}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      {item.color ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          {item.color}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">{item.icon ?? "-"}</td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      {item.is_active ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800">Ativa</Badge>
                      ) : (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-800">Inativa</Badge>
                      )}
                      {item.is_default ? (
                        <Badge className="ml-2 border-slate-200 bg-slate-50 text-slate-700">Padrao</Badge>
                      ) : null}
                    </td>
                    <td className="border-b border-slate-100 py-2 pr-3">
                      <div className="flex flex-wrap gap-2">
                        {item.is_active ? (
                          <form action={setCategoryActive.bind(null, item.id, false)}>
                            <Button type="submit" variant="secondary">Desativar</Button>
                          </form>
                        ) : (
                          <form action={setCategoryActive.bind(null, item.id, true)}>
                            <Button type="submit">Ativar</Button>
                          </form>
                        )}
                        {!item.is_default ? (
                          <form action={deleteCategory.bind(null, item.id)}>
                            <Button type="submit" variant="ghost">Excluir</Button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
