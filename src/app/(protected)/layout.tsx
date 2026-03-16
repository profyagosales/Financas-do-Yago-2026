import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OfflineQueueBanner } from "@/components/pwa/offline-queue-banner";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <div className="mx-auto flex w-full max-w-[1680px] gap-0 px-0 lg:px-4">
        <Sidebar />
        <div className="min-h-screen min-w-0 flex-1">
          <Topbar />
          <main className="mx-auto w-full max-w-[1320px] p-4 md:p-6">{children}</main>
        </div>
      </div>
      <OfflineQueueBanner />
    </div>
  );
}
