import { getIconsByDomain } from "@/lib/icon-registry";

export type InstitutionKind = "bank" | "wallet" | "broker" | "utility" | "card";

export interface InstitutionOption {
  id: string;
  name: string;
  kind: InstitutionKind;
  iconUrl?: string;
  fallbackUrls?: string[];
}

export const INSTITUTIONS: InstitutionOption[] = [
  ...getIconsByDomain("bank").map((item) => ({ id: item.id, name: item.name, kind: "bank" as const, iconUrl: item.iconUrl, fallbackUrls: item.fallbackUrls })),
  ...getIconsByDomain("wallet").map((item) => ({ id: item.id, name: item.name, kind: "wallet" as const, iconUrl: item.iconUrl, fallbackUrls: item.fallbackUrls })),
  ...getIconsByDomain("broker").map((item) => ({ id: item.id, name: item.name, kind: "broker" as const, iconUrl: item.iconUrl, fallbackUrls: item.fallbackUrls })),
  ...getIconsByDomain("card").map((item) => ({ id: item.id, name: item.name, kind: "card" as const, iconUrl: item.iconUrl, fallbackUrls: item.fallbackUrls })),
  ...getIconsByDomain("utility").map((item) => ({ id: item.id, name: item.name, kind: "utility" as const, iconUrl: item.iconUrl, fallbackUrls: item.fallbackUrls })),
  ...getIconsByDomain("telecom").map((item) => ({ id: item.id, name: item.name, kind: "utility" as const, iconUrl: item.iconUrl, fallbackUrls: item.fallbackUrls })),
];

export const ACCOUNT_TYPES = [
  "conta corrente",
  "poupanca",
  "carteira",
  "conta investimento",
  "dinheiro fisico",
  "conta digital",
] as const;

export function getInstitutionById(id?: string | null) {
  if (!id) return null;
  return INSTITUTIONS.find((item) => item.id === id) ?? null;
}
