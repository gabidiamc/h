/**
 * Web Push & Browser Notifications Manager for Lazo Eterno
 * Permite a los clientes y dueña recibir notificaciones del estado del pedido
 * incluso si se salen de la pestaña o minimizan el navegador.
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
}

const PUSH_PERM_KEY = "lazo_eterno_push_enabled";

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export function getPushPermissionStatus(): NotificationPermission {
  if (!isPushSupported()) return "denied";
  return Notification.permission;
}

export const getPushPermission = getPushPermissionStatus;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return registration;
  } catch (err) {
    console.warn("[Push] Error registrando ServiceWorker:", err);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      localStorage.setItem(PUSH_PERM_KEY, "true");
      await registerServiceWorker();
      return true;
    } else {
      localStorage.setItem(PUSH_PERM_KEY, "false");
      return false;
    }
  } catch (err) {
    console.warn("[Push] Error pidiendo permiso:", err);
    return false;
  }
}

export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!isPushSupported() || Notification.permission !== "granted") {
    return false;
  }

  try {
    // Check for active service worker registration first
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && "showNotification" in reg) {
        await reg.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: payload.tag || "lazo-eterno-update",
          data: {
            url: payload.url || window.location.origin,
          },
        });
        return true;
      }
    }

    // Fallback to desktop Notification API
    new Notification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/favicon.ico",
      tag: payload.tag || "lazo-eterno-update",
    });
    return true;
  } catch (err) {
    console.warn("[Push] Error enviando notificación push:", err);
    return false;
  }
}
