const CACHE_NAME = "financeiro-do-yago-v1";
const APP_SHELL = ["/", "/dashboard", "/login", "/manifest.webmanifest"];

// ── IndexedDB — offline transaction queue ──────────────────────────────────────
const QUEUE_DB_NAME = "financeiro-offline-queue";
const QUEUE_DB_VERSION = 1;
const QUEUE_STORE = "transactions";
const SIMPLE_TX_PATH = "/api/transactions/simple";

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(QUEUE_DB_NAME, QUEUE_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueTransaction(data) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).add({ ...data, queuedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllQueued() {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const req = tx.objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueued(id) {
  const db = await openQueueDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readwrite");
    tx.objectStore(QUEUE_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function syncOfflineQueue() {
  const items = await getAllQueued();
  let synced = 0;
  for (const item of items) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, queuedAt: _queuedAt, ...payload } = item;
    try {
      const res = await fetch(SIMPLE_TX_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      // 400 = dados invalidos — remover da fila para nao travar
      if (res.ok || res.status === 400) {
        await deleteQueued(id);
        synced += 1;
      }
    } catch {
      break; // ainda offline
    }
  }
  const clients = await self.clients.matchAll({ type: "window" });
  const remaining = Math.max(0, items.length - synced);
  clients.forEach((client) =>
    client.postMessage({ type: "SYNC_COMPLETE", synced, remaining }),
  );
}

// ── Install ────────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

// ── Activate ───────────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Intercepta POST de lancamento simples — enfileira offline se sem rede
  if (event.request.method === "POST" && url.pathname === SIMPLE_TX_PATH) {
    event.respondWith(
      fetch(event.request.clone()).catch(async () => {
        try {
          const data = await event.request.json();
          await enqueueTransaction(data);
          if ("sync" in self.registration) {
            await self.registration.sync.register("offline-transactions");
          }
        } catch {
          // falha ao enfileirar — ignora
        }
        return new Response(
          JSON.stringify({
            ok: false,
            queued: true,
            message: "Sem conexao. Lancamento salvo na fila offline.",
          }),
          { status: 202, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    return;
  }

  // Apenas GET usa cache
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("/dashboard"));
    }),
  );
});

// ── Background Sync ────────────────────────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "offline-transactions") {
    event.waitUntil(syncOfflineQueue());
  }
});

// ── Mensagens do cliente ───────────────────────────────────────────────────────
self.addEventListener("message", async (event) => {
  if (event.data?.type === "GET_QUEUE_COUNT") {
    const items = await getAllQueued();
    event.source?.postMessage({ type: "QUEUE_COUNT", count: items.length });
  }
  if (event.data?.type === "SYNC_OFFLINE_QUEUE") {
    await syncOfflineQueue();
  }
});
