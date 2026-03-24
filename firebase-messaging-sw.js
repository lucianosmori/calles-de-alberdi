// =============================================================================
// Calles de Alberdi — Firebase Cloud Messaging Service Worker
// Handles background push notifications (e.g., "Player 2 joined your room").
// Must live at root (/) for full scope.
// =============================================================================

/* global importScripts, firebase */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

// Firebase public config — these are NOT secrets (same as Supabase anon key).
// Populated at deploy time via /api/config, but SW can't fetch async during init,
// so we read from a global set by the registering page via postMessage.
let _firebaseApp = null;

// Listen for config from the main page
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "FIREBASE_CONFIG") {
    const cfg = event.data.config;
    if (!_firebaseApp && cfg.apiKey) {
      _firebaseApp = firebase.initializeApp({
        apiKey:            cfg.apiKey,
        projectId:         cfg.projectId,
        messagingSenderId: cfg.messagingSenderId,
        appId:             cfg.appId,
      });
      firebase.messaging();
    }
  }
});

// Background message handler — shown when page is not in focus
firebase.messaging.isSupported().then((supported) => {
  if (!supported) return;

  // Initialize a placeholder app so onBackgroundMessage can register.
  // The real config arrives via postMessage; if it arrives before a push,
  // the app gets re-initialized above. If a push arrives before config,
  // the default notification from FCM payload is shown instead.
  if (!_firebaseApp) {
    _firebaseApp = firebase.initializeApp({ apiKey: "pending", projectId: "pending", messagingSenderId: "0", appId: "pending" });
  }

  const messaging = firebase.messaging();
  messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || "Calles de Alberdi";
    const body  = (payload.notification && payload.notification.body)  || "Jugador 2 se unio a tu sala!";
    const icon  = "/assets/icon-192.png";

    return self.registration.showNotification(title, {
      body,
      icon,
      badge: icon,
      tag: "room-joined",           // replace previous notification
      requireInteraction: true,      // stay visible until tapped
      data: payload.data || {},
    });
  });
});

// Notification click — focus existing game tab or open the URL
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing game tab
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      // No existing tab — open a new one
      return self.clients.openWindow(url);
    })
  );
});
