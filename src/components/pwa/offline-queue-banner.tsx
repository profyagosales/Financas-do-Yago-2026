"use client";

import { useOfflineQueue } from "@/hooks/useOfflineQueue";
import { Button } from "@/components/ui/button";

export function OfflineQueueBanner() {
  const { isOnline, queueCount, isSyncing, syncNow } = useOfflineQueue();

  // Nada a mostrar quando online e sem itens na fila
  if (isOnline && queueCount === 0) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-800 px-5 py-2.5 text-sm text-white shadow-lg">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <span>
          Modo offline
          {queueCount > 0
            ? ` · ${queueCount} lancamento${queueCount > 1 ? "s" : ""} na fila`
            : ""}
        </span>
      </div>
    );
  }

  // Online com fila pendente
  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm text-white shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
      <span>
        {queueCount} lancamento{queueCount > 1 ? "s" : ""} aguardando sincronizacao
      </span>
      <Button
        variant="secondary"
        className="px-3 py-1 text-xs"
        onClick={syncNow}
        disabled={isSyncing}
      >
        {isSyncing ? "Sincronizando…" : "Sincronizar agora"}
      </Button>
    </div>
  );
}
