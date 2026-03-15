import { deleteGroceryNote, setGroceryNoteReviewed, uploadGroceryNoteFile } from "@/actions/grocery";
import { ModulePage } from "@/components/common/module-page";
import { GroceryNoteForm } from "@/components/forms/grocery-note-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDisplayPrefsForUser } from "@/lib/supabase/display-prefs";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

type NoteRow = {
  id: string;
  establishment: string | null;
  note_date: string | null;
  total_amount: number | null;
  raw_extracted_text: string | null;
  review_status: "pending_review" | "reviewed";
};

async function getNotesPageData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      prefs: { currency: "BRL", locale: "pt-BR" },
      notes: [] as NoteRow[],
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) {
    return {
      hasEnv: true,
      prefs: { currency: "BRL", locale: "pt-BR" },
      notes: [] as NoteRow[],
    };
  }

  const prefs = await getDisplayPrefsForUser(supabase, userId);

  const { data } = await supabase
    .from("grocery_notes")
    .select("id, establishment, note_date, total_amount, raw_extracted_text, review_status")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return {
    hasEnv: true,
    prefs,
    notes: (data ?? []).map((n) => ({
      ...n,
      total_amount: n.total_amount === null ? null : Number(n.total_amount),
    })) as NoteRow[],
  };
}

export default async function MercadoNotasPage() {
  const { hasEnv, prefs, notes } = await getNotesPageData();
  const formatMoney = (value: number) => toMoney(value, prefs.locale, prefs.currency);

  const pending = notes.filter((n) => n.review_status === "pending_review").length;
  const reviewed = notes.filter((n) => n.review_status === "reviewed").length;

  return (
    <div className="space-y-4">
      <ModulePage
        title="Mercado > Notas fiscais"
        subtitle="Registro e revisao de notas fiscais de mercado. OCR assistido futuro — por ora entrada manual com revisao obrigatoria."
        bullets={[
          "Registro manual de texto/itens",
          "Upload de imagem ou PDF por nota",
          "Status de revisao obrigatorio",
          "Historico de precos alimentado apos revisao",
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
          <p className="text-xs uppercase tracking-wide text-slate-500">Total de notas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{notes.length}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pendentes de revisao</p>
          <p className="mt-1 text-2xl font-black text-slate-900 text-amber-700">{pending}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Revisadas</p>
          <p className="mt-1 text-2xl font-black text-slate-900 text-emerald-700">{reviewed}</p>
        </Card>
      </div>

      <GroceryNoteForm />

      <Card>
        <h3 className="mb-3 text-sm font-bold text-slate-700">Notas registradas</h3>
        {notes.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma nota registrada ainda.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {note.establishment ?? "Estabelecimento nao informado"}
                      </span>
                      <Badge
                        className={
                          note.review_status === "reviewed"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }
                      >
                        {note.review_status === "reviewed" ? "Revisada" : "Pendente de revisao"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <span>Data: {note.note_date ?? "—"}</span>
                      {note.total_amount !== null ? <span>Total: {formatMoney(note.total_amount)}</span> : null}
                    </div>
                    {note.raw_extracted_text ? (
                      <p className="mt-2 max-w-xl text-sm text-slate-500 line-clamp-3 whitespace-pre-wrap">
                        {note.raw_extracted_text}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {note.review_status === "pending_review" ? (
                      <form action={setGroceryNoteReviewed.bind(null, note.id)}>
                        <Button type="submit">Marcar revisada</Button>
                      </form>
                    ) : null}
                    <form action={deleteGroceryNote.bind(null, note.id)}>
                      <Button type="submit" variant="ghost">Excluir</Button>
                    </form>
                  </div>
                </div>

                <form action={uploadGroceryNoteFile} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="note_id" value={note.id} />
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
                    required
                    className="block max-w-xs text-xs"
                  />
                  <Button type="submit" variant="secondary">Anexar imagem/PDF</Button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
