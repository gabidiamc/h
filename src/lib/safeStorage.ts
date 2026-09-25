/**
 * Multi-tier resilient browser storage that:
 * 1. Operates safely during SSR and on client.
 * 2. Caches all data synchronously in an in-memory Map so reads/writes never fail.
 * 3. Backs up all items into IndexedDB for high-capacity, durable persistence (bypassing the 5MB localStorage quota).
 * 4. Catches and recovers from DOMException QuotaExceededError without crashing or throwing.
 */

const DB_NAME = "lazo_eterno_offline_store";
const STORE_NAME = "keyval";
const DB_VERSION = 1;

const memory = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn(
            "[safeStorage] IndexedDB unavailable, falling back to memory/localStorage:",
            req.error,
          );
          resolve(null);
        };
      } catch (e) {
        console.warn("[safeStorage] IndexedDB initialization exception:", e);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

async function idbSet(key: string, value: string): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore IndexedDB async errors safely
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore IndexedDB async errors safely
  }
}

async function idbClear(): Promise<void> {
  try {
    const db = await getIDB();
    if (!db) return;
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore IndexedDB async errors safely
  }
}

// Initial client-side scan of localStorage into memory cache
if (typeof window !== "undefined") {
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) {
        const v = window.localStorage.getItem(k);
        if (v !== null) memory.set(k, v);
      }
    }
  } catch (e) {
    console.warn("[safeStorage] Unable to pre-populate from localStorage:", e);
  }

  // Hydrate additional or larger items from IndexedDB into memory
  void getIDB().then((db) => {
    if (!db) return;
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const k = String(cursor.key);
          const v = String(cursor.value);
          // If memory does not have this key, or memory has an empty array while IDB has actual data
          if (!memory.has(k) || (memory.get(k) === "[]" && v !== "[]")) {
            memory.set(k, v);
          }
          cursor.continue();
        }
      };
    } catch {
      // Ignore background hydration error
    }
  });
}

export const safeStorage: Pick<Storage, "getItem" | "setItem" | "removeItem" | "clear"> = {
  getItem: (key: string): string | null => {
    if (memory.has(key)) {
      return memory.get(key) ?? null;
    }
    if (typeof window !== "undefined") {
      try {
        const val = window.localStorage.getItem(key);
        if (val !== null) {
          memory.set(key, val);
          return val;
        }
      } catch {
        // Fall back to null if localStorage is inaccessible
      }
    }
    return null;
  },

  setItem: (key: string, value: string): void => {
    // 1. In-memory cache is updated immediately so sync callers always see the latest value
    memory.set(key, value);

    // 2. Persist to durable IndexedDB asynchronously (no 5MB quota limit)
    void idbSet(key, value);

    // 3. Attempt to persist to localStorage for fast initial reload
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, value);
      } catch (err: any) {
        const isQuota =
          err?.name === "QuotaExceededError" ||
          err?.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
          err?.code === 22 ||
          err?.code === 1014 ||
          String(err?.message || "")
            .toLowerCase()
            .includes("quota");

        if (isQuota) {
          console.warn(
            `[safeStorage] localStorage quota reached while saving "${key}". Data is safely retained in memory and IndexedDB.`,
          );

          // Try to free up space by evicting oversized non-essential items from localStorage (already in IDB)
          try {
            for (let i = 0; i < window.localStorage.length; i++) {
              const k = window.localStorage.key(i);
              if (k && k !== key) {
                const v = window.localStorage.getItem(k);
                if (v && v.length > 150_000) {
                  window.localStorage.removeItem(k);
                }
              }
            }
            // Retry save once
            window.localStorage.setItem(key, value);
          } catch {
            // Succeeded in memory and IndexedDB; silently handle localStorage quota
          }
        } else {
          console.warn(`[safeStorage] Storage notice for "${key}":`, err);
        }
      }
    }
  },

  removeItem: (key: string): void => {
    memory.delete(key);
    void idbDelete(key);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore removal error
      }
    }
  },

  clear: (): void => {
    memory.clear();
    void idbClear();
    if (typeof window !== "undefined") {
      try {
        window.localStorage.clear();
      } catch {
        // Ignore clear error
      }
    }
  },
};
