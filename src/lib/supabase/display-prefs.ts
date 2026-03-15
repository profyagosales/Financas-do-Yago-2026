export interface DisplayPrefs {
  currency: string;
  locale: string;
}

const DEFAULT_PREFS: DisplayPrefs = {
  currency: "BRL",
  locale: "pt-BR",
};

interface SupabaseLike {
  from: (table: string) => unknown;
}

export async function getDisplayPrefsForUser(supabase: SupabaseLike, userId?: string): Promise<DisplayPrefs> {
  if (!userId) return DEFAULT_PREFS;

  const profiles = supabase.from("profiles") as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{
          data: { currency?: string | null; locale?: string | null } | null;
        }>;
      };
    };
  };

  const { data } = await profiles.select("currency, locale").eq("id", userId).maybeSingle();

  return {
    currency: data?.currency ?? DEFAULT_PREFS.currency,
    locale: data?.locale ?? DEFAULT_PREFS.locale,
  };
}
