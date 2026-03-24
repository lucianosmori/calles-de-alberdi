// =============================================================================
// Calles de Alberdi — Firebase Cloud Messaging Service Worker
// Handles background push notifications (e.g., "Player 2 joined your room").
// Must live at root (/) for full scope.
//
// Uses a raw "push" event listener so notifications work even when the SW
// has been restarted by the browser (which kills any postMessage-based state).
// =============================================================================

// Track whether the push was already handled (avoid duplicates)
let _pushHandled = false;

// Raw push handler — works without Firebase SDK initialization.
// FCM delivers messages as standard Web Push; we parse the payload directly.
self.addEventListener("push", (event) => {
  _pushHandled = false;

  let title = "Calles de Alberdi";
  let body  = "Jugador 2 se unio a tu sala!";
  let data  = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      // FCM wraps notification in a "notification" key
      if (payload.notification) {
        title = payload.notification.title || title;
        body  = payload.notification.body  || body;
      }
      data = payload.data || payload.fcmOptions || {};
    } catch (_) {
      // If JSON parsing fails, use defaults
    }
  }

  _pushHandled = true;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  "/assets/icon-192.png",
      badge: "/assets/icon-192.png",
      tag:   "room-joined",
      requireInteraction: true,
      data,
    })
  );
});

// Notification click — focus existing game tab or open the URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
