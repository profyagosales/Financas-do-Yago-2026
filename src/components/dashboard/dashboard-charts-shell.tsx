"use client";

import dynamic from "next/dynamic";

const OverviewCharts = dynamic(
  () => import("@/components/dashboard/overview-charts").then((mod) => mod.OverviewCharts),
  { ssr: false },
);

interface Props {
  currency?: string;
  locale?: string;
}

export function DashboardChartsShell({ currency, locale }: Props) {
  return <OverviewCharts currency={currency} locale={locale} />;
}
