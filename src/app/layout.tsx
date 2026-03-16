import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Financeiro do Yago",
  description: "Sistema pessoal de financas, investimentos, milhas e metas.",
  applicationName: "Financeiro do Yago",
  icons: {
    icon: "/icon-financeiro-yago.svg",
    shortcut: "/icon-financeiro-yago.svg",
    apple: "/icon-financeiro-yago.svg",
  },
};

async function getTheme() {
  if (!hasSupabaseEnv()) return "system" as const;

  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return "system" as const;

  const { data } = await supabase
    .from("settings")
    .select("theme")
    .eq("user_id", userId)
    .maybeSingle();

  const theme = data?.theme;
  return theme === "dark" || theme === "light" || theme === "system" ? theme : ("system" as const);
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();

  return (
    <html lang="pt-BR" data-theme={theme}>
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
