import { ModulePage } from "@/components/common/module-page";
import { ExportHistoryPanel, type ExportHistoryRow } from "@/components/finance/export-history-panel";
import { AppSettingsForm } from "@/components/forms/app-settings-form";
import { ProfileSettingsForm } from "@/components/forms/profile-settings-form";
import { Card } from "@/components/ui/card";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExportStats = {
  total: number;
  last7d: number;
  last30d: number;
  csvCount: number;
  jsonCount: number;
  totalRows: number;
  avgRows: number;
};

function computeExportStats(rows: ExportHistoryRow[]): ExportStats {
  const now = Date.now();
  const d7 = now - 7 * 24 * 60 * 60 * 1000;
  const d30 = now - 30 * 24 * 60 * 60 * 1000;

  let last7d = 0;
  let last30d = 0;
  let csvCount = 0;
  let jsonCount = 0;
  let totalRows = 0;

  for (const row of rows) {
    const created = new Date(row.created_at).getTime();
    if (created >= d7) last7d += 1;
    if (created >= d30) last30d += 1;
    if (row.format === "csv") csvCount += 1;
    if (row.format === "json") jsonCount += 1;
    totalRows += row.row_count;
  }

  return {
    total: rows.length,
    last7d,
    last30d,
    csvCount,
    jsonCount,
    totalRows,
    avgRows: rows.length > 0 ? Math.round(totalRows / rows.length) : 0,
  };
}

async function getSettingsData() {
  if (!hasSupabaseEnv()) {
    return {
      hasEnv: false,
      profile: { full_name: "", currency: "BRL" as const, locale: "pt-BR" as const },
      settings: { theme: "system" as const, show_charts: true, email_alerts: true, weekly_digest: false },
      stats: { accounts: 0, cards: 0, categories: 0, tags: 0 },
      exports: [] as ExportHistoryRow[],
      exportStats: {
        total: 0,
        last7d: 0,
        last30d: 0,
        csvCount: 0,
        jsonCount: 0,
        totalRows: 0,
        avgRows: 0,
      } as ExportStats,
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return {
      hasEnv: true,
      profile: { full_name: "", currency: "BRL" as const, locale: "pt-BR" as const },
      settings: { theme: "system" as const, show_charts: true, email_alerts: true, weekly_digest: false },
      stats: { accounts: 0, cards: 0, categories: 0, tags: 0 },
      exports: [] as ExportHistoryRow[],
      exportStats: {
        total: 0,
        last7d: 0,
        last30d: 0,
        csvCount: 0,
        jsonCount: 0,
        totalRows: 0,
        avgRows: 0,
      } as ExportStats,
    };
  }

  const [
    { data: profileData },
    { data: settingsData },
    { count: accountsCount },
    { count: cardsCount },
    { count: categoriesCount },
    { count: tagsCount },
    { data: exportsData, error: exportsError },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, currency, locale").eq("id", userId).maybeSingle(),
    supabase
      .from("settings")
      .select("theme, dashboard_config, notification_prefs")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("bank_accounts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("credit_cards").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("categories").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("tags").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("export_history")
      .select("id, module, export_name, format, mode, row_count, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const exportsRows = exportsError ? [] : ((exportsData ?? []) as ExportHistoryRow[]);

  const dashboardConfig = (settingsData?.dashboard_config ?? {}) as Record<string, unknown>;
  const notificationPrefs = (settingsData?.notification_prefs ?? {}) as Record<string, unknown>;

  return {
    hasEnv: true,
    profile: {
      full_name: profileData?.full_name ?? "",
      currency: (profileData?.currency as "BRL" | "USD" | "EUR") ?? "BRL",
      locale: (profileData?.locale as "pt-BR" | "en-US" | "es-ES") ?? "pt-BR",
    },
    settings: {
      theme: (settingsData?.theme as "system" | "light" | "dark") ?? "system",
      show_charts: Boolean(dashboardConfig.show_charts ?? true),
      email_alerts: Boolean(notificationPrefs.email_alerts ?? true),
      weekly_digest: Boolean(notificationPrefs.weekly_digest ?? false),
    },
    stats: {
      accounts: accountsCount ?? 0,
      cards: cardsCount ?? 0,
      categories: categoriesCount ?? 0,
      tags: tagsCount ?? 0,
    },
    exports: exportsRows,
    exportStats: computeExportStats(exportsRows),
  };
}

export default async function ConfiguracoesPage() {
  const { hasEnv, profile, settings, stats, exports, exportStats } = await getSettingsData();

  return (
    <div className="space-y-4">
      <ModulePage
        title="Configuracoes"
        subtitle="Preferencias visuais, perfil, categorias e exportacoes."
        bullets={[
          "Tema claro/escuro/sistema",
          "Perfil de exibicao (nome, moeda e localidade)",
          "Preferencias de dashboard e notificacoes",
          "Diagnostico rapido de cadastros",
        ]}
      />

      {!hasEnv ? (
        <Card>
          <p className="text-sm text-slate-600">
            Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para carregar os dados reais.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Contas cadastradas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.accounts}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Cartoes cadastrados</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.cards}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Categorias</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.categories}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Tags</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{stats.tags}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Perfil</h2>
          <ProfileSettingsForm
            fullName={profile.full_name}
            currency={profile.currency}
            locale={profile.locale}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Preferencias</h2>
          <AppSettingsForm
            theme={settings.theme}
            showCharts={settings.show_charts}
            emailAlerts={settings.email_alerts}
            weeklyDigest={settings.weekly_digest}
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Exports (30 dias)</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{exportStats.last30d}</p>
          <p className="text-xs text-slate-500">Ultimos 7 dias: {exportStats.last7d}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Formato CSV</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{exportStats.csvCount}</p>
          <p className="text-xs text-slate-500">JSON: {exportStats.jsonCount}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Linhas exportadas</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{exportStats.totalRows}</p>
          <p className="text-xs text-slate-500">Media por export: {exportStats.avgRows}</p>
        </Card>
        <Card className="bg-gradient-to-br from-white to-slate-50">
          <p className="text-xs uppercase tracking-wide text-slate-500">Total historico</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{exportStats.total}</p>
          <p className="text-xs text-slate-500">Todos os formatos e modos</p>
        </Card>
      </div>

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Historico de exportacoes</h2>
        {exports.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">Nenhuma exportacao registrada ainda.</p>
        ) : (
          <div className="mt-3">
            <ExportHistoryPanel rows={exports} nowIso={new Date().toISOString()} />
          </div>
        )}
      </Card>
    </div>
  );
}
