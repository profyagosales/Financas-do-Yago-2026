import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
