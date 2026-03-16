"use client";

import { useCallback, useEffect, useState } from "react";

export function useOfflineQueue() {
  // Inicializa com o estado real no cliente; true no servidor (SSR)
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return navigator.onLine;
  });
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Eventos de rede
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Solicita contagem actual ao SW
  const refreshQueueCount = useCallback(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.active?.postMessage({ type: "GET_QUEUE_COUNT" }))
      .catch(() => undefined);
  }, []);

  // Escuta mensagens do SW
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === "QUEUE_COUNT") {
        setQueueCount(event.data.count as number);
      }
      if (event.data?.type === "SYNC_COMPLETE") {
        setQueueCount((prev) => Math.max(0, prev - (event.data.synced as number)));
        setIsSyncing(false);
        refreshQueueCount(); // reconcilia contagem real
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [refreshQueueCount]);

  // Atualiza contagem ao montar e ao voltar online
  useEffect(() => {
    refreshQueueCount();
  }, [refreshQueueCount, isOnline]);

  const syncNow = useCallback(async () => {
    if (!("serviceWorker" in navigator) || isSyncing) return;
    setIsSyncing(true);
    const reg = await navigator.serviceWorker.ready;
    reg.active?.postMessage({ type: "SYNC_OFFLINE_QUEUE" });
  }, [isSyncing]);

  return { isOnline, queueCount, isSyncing, syncNow, refreshQueueCount };
}
