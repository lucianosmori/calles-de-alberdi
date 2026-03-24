// =============================================================================
// Calles de Alberdi — Firebase Cloud Messaging Service Worker
// Handles background push notifications (e.g., "Player 2 joined your room").
// Must live at root (/) for full scope.
// =============================================================================

/* global importScripts, firebase */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

let _initialized = false;

// Listen for config from the main page — only then initialize Firebase
self.addEventListener("message", (event) => {
  if (_initialized) return;
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    const cfg = event.data.config;
    if (!cfg.apiKey || cfg.apiKey === "pending") return;

    firebase.initializeApp({
      apiKey:            cfg.apiKey,
      projectId:         cfg.projectId,
      messagingSenderId: cfg.messagingSenderId,
      appId:             cfg.appId,
    });

    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const title = (payload.notification && payload.notification.title) || "Calles de Alberdi";
      const body  = (payload.notification && payload.notification.body)  || "Jugador 2 se unio a tu sala!";

      return self.registration.showNotification(title, {
        body,
        icon:  "/assets/icon-192.png",
        badge: "/assets/icon-192.png",
        tag:   "room-joined",
        requireInteraction: true,
        data: payload.data || {},
      });
    });

    _initialized = true;
    console.log("[SW] Firebase Messaging initialized");
  }
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
