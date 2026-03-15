"use client";

import dynamic from "next/dynamic";

const OverviewCharts = dynamic(
  () => import("@/components/dashboard/overview-charts").then((mod) => mod.OverviewCharts),
  { ssr: false },
);

export function DashboardChartsShell() {
  return <OverviewCharts />;
}
