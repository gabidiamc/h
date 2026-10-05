import { useEffect } from "react";

/**
 * Temporary cleanup: removes any service worker registration and Cache Storage
 * left over from the previous PWA build. It never registers a new worker,
 * never clears localStorage/sessions, and never blocks the app on failure.
 */
export function LegacyServiceWorkerCleanup() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let cancelled = false;

    const cleanup = async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.allSettled(cacheNames.map((cacheName) => caches.delete(cacheName)));
        }
      } catch (error) {
        if (!cancelled) {
          console.warn("No fue posible limpiar el service worker anterior.", error);
        }
      }
    };

    void cleanup();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
