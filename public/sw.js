// Lazo Eterno Service Worker - Web Push & Background Notifications
const CACHE_NAME = "lazo-eterno-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification event (triggered from Web Push server or test)
self.addEventListener("push", (event) => {
  let data = {
    title: "Lazo Eterno",
    body: "Tienes una nueva actualización en tu pedido.",
    icon: "/favicon.ico",
    url: "/",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
    },
    actions: [
      { action: "open", title: "Ver Pedido" },
      { action: "close", title: "Cerrar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event - Focus or open tab
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window client is already open, focus it
      for (let client of windowClients) {
        if ("focus" in client) {
          if ("navigate" in client && targetUrl !== "/") {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
