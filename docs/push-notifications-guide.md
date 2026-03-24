# Push Notifications with Firebase Cloud Messaging (FCM) — Implementation Guide

> A complete reference for implementing web push notifications in a static site deployed on Vercel, using Firebase Cloud Messaging and Supabase as the database. Based on the implementation in **Calles de Alberdi** (2D browser game with online multiplayer).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Firebase Project Setup](#firebase-project-setup)
4. [Service Worker](#service-worker)
5. [Client-Side Integration](#client-side-integration)
6. [Server-Side Sender (Vercel Serverless)](#server-side-sender-vercel-serverless)
7. [Database Schema](#database-schema)
8. [Environment Variables](#environment-variables)
9. [PWA Manifest](#pwa-manifest)
10. [Vercel Configuration](#vercel-configuration)
11. [Testing & Debugging](#testing--debugging)
12. [Gotchas & Lessons Learned](#gotchas--lessons-learned)
13. [Platform Support Matrix](#platform-support-matrix)
14. [Cost](#cost)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Host (P1)  │     │  Guest (P2)  │     │  Vercel API     │
│  Browser    │     │  Browser     │     │  /api/notify.js  │
└──────┬──────┘     └──────┬───────┘     └────────┬────────┘
       │                   │                      │
  1. Create room           │                      │
  2. Request notification   │                      │
     permission            │                      │
  3. Get FCM token         │                      │
  4. Store token in DB     │                      │
  5. Show QR / room code   │                      │
  6. Switch tab/app ───►   │                      │
       │              7. Join room                │
       │              8. GET /api/notify?room=CODE │
       │                   │──────────────────────►│
       │                   │                  9. Read FCM token from DB
       │                   │                 10. Send FCM push via
       │                   │                     Firebase Admin SDK
       │◄──── 11. Push notification arrives ──────│
       │          (via service worker)            │
  12. Tap notification                            │
      → focus game tab                            │
```

### Key Principle

The **client-side Firebase SDK** handles token generation (registering the browser with FCM). The **server-side Firebase Admin SDK** handles sending messages. The **service worker** handles displaying notifications when the page is backgrounded. These are three separate concerns.

---

## Prerequisites

- **Vercel account** (free Hobby tier works)
- **Firebase project** (free Spark plan works — FCM is free)
- **Supabase project** (free tier works) or any database accessible from Vercel serverless functions
- **HTTPS** (required for service workers — Vercel provides this automatically)
- No build step required — works with vanilla JS and CDN scripts

---

## Firebase Project Setup

### 1. Create the Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it (e.g., "my-app")
4. Disable Google Analytics (not needed for FCM)
5. Click "Create project"

### 2. Register a Web Application

1. In the Firebase Console, click the **Web** icon (`</>`) to add a web app
2. Give it a nickname (e.g., "my-app-web")
3. You do NOT need Firebase Hosting — uncheck it
4. Click "Register app"
5. Copy the `firebaseConfig` object — you'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",           // → FIREBASE_API_KEY
  authDomain: "my-app.firebaseapp.com",
  projectId: "my-app",        // → FIREBASE_PROJECT_ID
  storageBucket: "my-app.appspot.com",
  messagingSenderId: "12345", // → FIREBASE_MESSAGING_SENDER_ID
  appId: "1:12345:web:abc"    // → FIREBASE_APP_ID
};
```

### 3. Generate VAPID Key (Web Push Certificate)

1. Go to **Project Settings** > **Cloud Messaging** tab
2. Scroll to "Web Push certificates"
3. Click **"Generate key pair"**
4. Copy the key — this is your `FIREBASE_VAPID_KEY`

### 4. Generate Service Account Key (Server Credentials)

1. Go to **Project Settings** > **Service accounts** tab
2. Click **"Generate new private key"**
3. Download the JSON file
4. From this file, you need:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (the entire PEM string including `\n`)

> **Security:** The `apiKey`, `projectId`, `messagingSenderId`, `appId`, and VAPID key are **public** values (like Supabase anon keys). The `client_email` and `private_key` are **secrets** that must never be exposed to the client.

---

## Service Worker

The service worker handles incoming push events when the page is backgrounded. This is the most critical piece and the source of most bugs.

### File: `firebase-messaging-sw.js` (must be at project root)

```javascript
// Uses raw "push" event — NOT Firebase SDK's onBackgroundMessage.
// The browser restarts service workers frequently, killing any
// runtime state. A raw listener is stateless and always works.

self.addEventListener("push", (event) => {
  let title = "My App";
  let body  = "You have a new notification";
  let data  = {};

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.notification) {
        title = payload.notification.title || title;
        body  = payload.notification.body  || body;
      }
      data = payload.data || {};
    } catch (_) {
      // JSON parse failed — use defaults
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:  "/assets/icon-192.png",
      badge: "/assets/icon-192.png",
      tag:   "app-notification",   // same tag = replaces previous
      requireInteraction: true,     // stays until tapped
      data,
    })
  );
});

// Click handler — focus existing tab or open new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      })
  );
});
```

### Why raw `push` instead of Firebase SDK?

We originally tried:
1. Loading Firebase SDK in the SW via `importScripts()`
2. Initializing Firebase app with config sent via `postMessage` from the main page
3. Using `firebase.messaging().onBackgroundMessage()`

**This failed** because:
- Browsers restart service workers to save memory (every few minutes)
- When restarted, the SW loses all runtime state (including the Firebase app instance)
- The `postMessage` config is gone, `onBackgroundMessage` was never registered
- Push arrives → nothing happens

The raw `push` event listener is **stateless** — it works every time regardless of SW restarts.

---

## Client-Side Integration

### Loading Firebase SDK (in `index.html`)

```html
<!-- Firebase compat SDK (works without build step) -->
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js"></script>
```

### Requesting Permission & Getting FCM Token

```javascript
// Firebase config (public values — fetched from /api/config or hardcoded)
let _fbConfig = { apiKey: "", projectId: "", messagingSenderId: "", appId: "" };
let _fbVapidKey = "";
let _fbMessaging = null;

async function requestFcmToken() {
  try {
    // Check browser support
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      console.log("[FCM] Push not supported");
      return null;
    }

    // Check config is loaded
    if (!_fbConfig.apiKey || !_fbVapidKey) {
      console.warn("[FCM] Firebase not configured");
      return null;
    }

    // Request permission (shows browser prompt)
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[FCM] Permission denied");
      return null;
    }

    // Initialize Firebase app (once)
    if (!_fbMessaging) {
      firebase.initializeApp(_fbConfig);
      _fbMessaging = firebase.messaging();
    }

    // Register service worker
    const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    await navigator.serviceWorker.ready;

    // Get FCM token
    const token = await _fbMessaging.getToken({
      vapidKey: _fbVapidKey,
      serviceWorkerRegistration: reg,
    });

    console.log("[FCM] Token obtained:", token.slice(0, 12) + "...");
    return token;
  } catch (e) {
    console.error("[FCM] Token request failed:", e.message);
    return null;
  }
}
```

### Storing the Token

After getting the token, store it somewhere the server can read it. In our case, a Supabase table column:

```javascript
async function storeFcmToken(roomId, token) {
  if (!token) return;
  await supabase
    .from("game_rooms")
    .update({ host_fcm_token: token })
    .eq("room_id", roomId);
}
```

### Critical: Await the Token Before It's Needed

```javascript
// WRONG — fire-and-forget, token may not be stored when guest joins
requestFcmToken().then(token => storeFcmToken(roomId, token));
showQRCode(roomId); // Guest could join NOW, before token is stored

// RIGHT — await ensures token is in DB before anyone can trigger a notification
const token = await requestFcmToken();
await storeFcmToken(roomId, token);
showQRCode(roomId); // Now it's safe
```

---

## Server-Side Sender (Vercel Serverless)

### File: `api/notify.js`

```javascript
let _admin = null;

function getFirebaseAdmin() {
  if (_admin) return _admin;
  const admin = require("firebase-admin");

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) return null;

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  _admin = admin;
  return _admin;
}

module.exports = async function handler(req, res) {
  const targetId = req.query.target; // room ID, user ID, etc.
  if (!targetId) {
    return res.status(200).json({ ok: false, reason: "missing_target" });
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    return res.status(200).json({ ok: false, reason: "firebase_not_configured" });
  }

  // Look up the FCM token from your database
  // (adapt this to your schema)
  const token = await getTokenFromDatabase(targetId);
  if (!token) {
    return res.status(200).json({ ok: false, reason: "no_token" });
  }

  try {
    await admin.messaging().send({
      token,
      notification: {
        title: "My App",
        body:  "Something happened!",
      },
      webpush: {
        notification: {
          icon:  "https://my-app.vercel.app/assets/icon-192.png",
          badge: "https://my-app.vercel.app/assets/icon-192.png",
          tag:   "app-notification",
          requireInteraction: true,
        },
        fcmOptions: {
          link: "https://my-app.vercel.app",
        },
      },
      data: {
        url: "https://my-app.vercel.app",
      },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[notify] FCM send failed:", err.message);
    res.status(200).json({ ok: false, reason: "send_failed" });
  }
};
```

### Dependencies (`package.json`)

```json
{
  "dependencies": {
    "firebase-admin": "^13.4.0"
  }
}
```

Vercel auto-installs `node_modules` for serverless functions even with `buildCommand: null`.

### Triggering the Notification

The sender (e.g., Player 2 joining a room) calls the endpoint:

```javascript
// Fire-and-forget — notification is supplementary
fetch(`/api/notify?target=${encodeURIComponent(targetId)}`).catch(() => {});
```

---

## Database Schema

Add a column to store the FCM token wherever it makes sense for your app:

```sql
-- Example: adding to a rooms table
ALTER TABLE game_rooms ADD COLUMN host_fcm_token text;
```

The token is a ~150-character string like `c49x1hAwkdE0...`. It's tied to a specific browser + service worker registration.

### Token Lifecycle

| Event | What Happens |
|-------|-------------|
| First permission grant | New token generated |
| User clears browser data | Token invalidated, new one on next visit |
| Service worker updated | Token may rotate |
| User revokes permission | Token becomes invalid (send will fail) |
| 270 days of inactivity | Token expires (FCM garbage collects it) |

For short-lived use cases (game rooms expire in 30 min), token staleness is not a concern.

---

## Environment Variables

Set these in the **Vercel Dashboard** (Settings > Environment Variables):

| Variable | Type | Where Used | Source |
|----------|------|------------|--------|
| `FIREBASE_API_KEY` | Public | Client (via `/api/config`) | Firebase Console > Project Settings > General |
| `FIREBASE_PROJECT_ID` | Public | Client + Server | Firebase Console > Project Settings > General |
| `FIREBASE_MESSAGING_SENDER_ID` | Public | Client | Firebase Console > Project Settings > General |
| `FIREBASE_APP_ID` | Public | Client | Firebase Console > Project Settings > General |
| `FIREBASE_VAPID_KEY` | Public | Client | Firebase Console > Cloud Messaging > Web Push certificates |
| `FIREBASE_CLIENT_EMAIL` | **Secret** | Server only (`api/notify.js`) | Service account JSON > `client_email` |
| `FIREBASE_PRIVATE_KEY` | **Secret** | Server only (`api/notify.js`) | Service account JSON > `private_key` |

### Serving Public Config to the Client

Use a config endpoint so you don't hardcode values:

```javascript
// api/config.js
module.exports = function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    firebaseApiKey:            process.env.FIREBASE_API_KEY              || "",
    firebaseProjectId:         process.env.FIREBASE_PROJECT_ID           || "",
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID  || "",
    firebaseAppId:             process.env.FIREBASE_APP_ID               || "",
    firebaseVapidKey:          process.env.FIREBASE_VAPID_KEY            || "",
  });
};
```

---

## PWA Manifest

Required for service worker registration and Android push notification support.

### File: `manifest.webmanifest`

```json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/assets/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/assets/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Icon Specs

| File | Size | Used For |
|------|------|----------|
| `icon-192.png` | 192x192 px | Push notification icon, Android home screen |
| `icon-512.png` | 512x512 px | PWA splash screen, install prompt |

- PNG format, square (1:1)
- Should be recognizable at small sizes
- Transparent background is fine

### Link in HTML

```html
<link rel="manifest" href="/manifest.webmanifest" />
```

---

## Vercel Configuration

Add no-cache headers for the service worker (browsers are strict about SW freshness):

```json
{
  "headers": [
    {
      "source": "/firebase-messaging-sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

---

## Testing & Debugging

### Step-by-step verification

1. **Check config is served:**
   Visit `/api/config` — confirm Firebase values are non-empty

2. **Check FCM token generation (browser console):**
   Look for `[FCM] Token obtained: xxxx...`
   If missing, check: permission prompt appeared? Config loaded?

3. **Check token is stored in database:**
   Look at your DB table — the token column should be populated

4. **Test the notify endpoint directly:**
   Visit `/api/notify?target=YOUR_ID` in a different browser
   Should return `{ "ok": true }`

5. **Check notification appears:**
   **The host's tab must be minimized/backgrounded.** Notifications only show via the service worker when the page is not in focus.

6. **Check the service worker:**
   DevTools > Application > Service Workers
   - Is `firebase-messaging-sw.js` registered?
   - Status: "activated and is running"?
   - Click "Update" to force-install the latest version

### Common failure points

| Symptom | Cause | Fix |
|---------|-------|-----|
| No permission prompt | Already denied previously | Browser settings > Site settings > Notifications > Reset |
| Token obtained but notify returns `no_token` | Token not stored in DB (race condition) | `await` the token request before showing UI |
| Notify returns `ok: true` but no notification | Tab is in foreground | Minimize/switch tab first |
| Notify returns `firebase_not_configured` | Missing Vercel env vars | Check all 7 vars in Vercel dashboard |
| Notify returns `send_failed` | Invalid/expired token | Re-create the room to get a fresh token |
| Works on desktop, not Android | PWA not installed | "Add to Home Screen" on Android Chrome |
| SW not registering | HTTP (not HTTPS) | Must be on HTTPS (Vercel provides this) |

---

## Gotchas & Lessons Learned

### 1. Never use Firebase SDK in the service worker for state-dependent initialization

The browser kills and restarts service workers frequently. Any state set via `postMessage` or `importScripts` initialization is lost. Use raw `push` event listeners that are stateless.

### 2. `onBackgroundMessage` requires the Firebase app to be initialized in the SW

If you must use `onBackgroundMessage`, hardcode the Firebase config in the SW file (it's all public values). Do NOT rely on `postMessage` from the main page.

### 3. The FCM token must be stored before anyone can trigger a notification

If you fire-and-forget the token request, there's a race condition where the notification sender reads `null` from the database. Always `await`.

### 4. FCM `notification` vs `data` payloads

- **`notification` field:** The browser/OS displays this automatically when the page is backgrounded. Title, body, icon.
- **`data` field:** Custom key-value pairs. Not displayed. Available to the `push` event handler and the `notificationclick` handler.
- **Both together:** `notification` is displayed, `data` is available for click handling.

### 5. `FIREBASE_PRIVATE_KEY` in Vercel

The private key from the JSON file contains literal `\n` characters. Vercel stores them as-is, but Node.js needs real newlines. Always do:

```javascript
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
```

### 6. Firebase Admin SDK singleton

Initialize `firebase-admin` only once per serverless function lifecycle. Use a module-level variable:

```javascript
let _admin = null;
function getAdmin() {
  if (_admin) return _admin;
  // ... initialize
  _admin = admin;
  return _admin;
}
```

### 7. Notification `tag` deduplicates

If you use the same `tag` value, new notifications replace the previous one instead of stacking. Good for "player joined" (only need the latest), bad for chat messages (need all of them).

### 8. `requireInteraction: true` prevents auto-dismiss

Without this, notifications disappear after a few seconds on desktop. With it, they stay until the user interacts. Use for important notifications.

---

## Platform Support Matrix

| Platform | Push Works? | Notes |
|----------|-------------|-------|
| Chrome Desktop (Win/Mac/Linux) | Yes | Works out of the box |
| Firefox Desktop | Yes | Works out of the box |
| Edge Desktop | Yes | Works out of the box |
| Chrome Android | Yes | **Requires PWA install** ("Add to Home Screen") |
| Firefox Android | Yes | Requires PWA install |
| Safari macOS (16.4+) | Yes | Requires PWA install |
| Safari iOS (16.4+) | Yes | **Requires PWA install** (Add to Home Screen) |
| Samsung Internet | Yes | Requires PWA install |
| Chrome iOS | **No** | iOS restricts push to Safari PWAs only |

### Key takeaway

On **desktop browsers**, push notifications work without any PWA installation. On **mobile** (both Android and iOS), the user must "Add to Home Screen" first. Consider showing a hint in your UI when the user is on mobile.

---

## Cost

**Firebase Cloud Messaging is completely free** with no usage limits on the Spark (free) plan. There are no per-message charges. The only costs are:

- **Vercel serverless function invocations** — free tier includes 100K/month
- **Supabase database reads** — free tier includes 500MB + unlimited API requests
- **Firebase project** — free (Spark plan), no credit card required

This entire implementation runs at **$0/month** on free tiers.

---

## Files Summary

| File | Purpose |
|------|---------|
| `firebase-messaging-sw.js` | Service worker — raw push handler + notification click |
| `manifest.webmanifest` | PWA manifest — required for SW registration + mobile push |
| `api/notify.js` | Vercel serverless — sends FCM push via Firebase Admin SDK |
| `api/config.js` | Vercel serverless — serves Firebase public config to client |
| `assets/icon-192.png` | Notification icon + PWA icon (192x192) |
| `assets/icon-512.png` | PWA splash icon (512x512) |
| `package.json` | Dependencies (`firebase-admin`) |
| `vercel.json` | Cache headers for SW + manifest |

---

## Quick Start Checklist

- [ ] Create Firebase project + register web app
- [ ] Generate VAPID key (Cloud Messaging > Web Push certificates)
- [ ] Generate service account private key JSON
- [ ] Set all 7 env vars in Vercel dashboard
- [ ] Add `host_fcm_token` column (or equivalent) to your database
- [ ] Create `firebase-messaging-sw.js` at project root (raw `push` handler)
- [ ] Create `manifest.webmanifest` + icons
- [ ] Add `<link rel="manifest">` and Firebase SDK scripts to HTML
- [ ] Client: request permission → get token → store in DB (await all of it)
- [ ] Server: `api/notify.js` reads token from DB → sends FCM push
- [ ] Trigger: other user calls `/api/notify` after their action
- [ ] Test: minimize host tab → trigger notify → notification appears
- [ ] Android: "Add to Home Screen" → test again
