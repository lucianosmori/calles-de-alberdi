// Vercel Serverless Function — sends FCM push notification to the room host.
// Called by the guest client after joining a room: GET /api/notify?room=ABCD
//
// Reads the host's FCM token from game_rooms, sends a push via Firebase Admin.
// Fire-and-forget from the client side — always returns 200.

let _admin = null;
let _sbAdmin = null;

function getFirebaseAdmin() {
  if (_admin) return _admin;
  const admin = require("firebase-admin");

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey  = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("[notify] Firebase Admin not configured — missing env vars");
    return null;
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
  _admin = admin;
  return _admin;
}

function getSupabaseAdmin() {
  if (_sbAdmin) return _sbAdmin;
  const { createClient } = require("@supabase/supabase-js");
  const url  = process.env.SUPABASE_URL  || "";
  const anon = process.env.SUPABASE_ANON || "";
  if (!url || !anon) return null;
  _sbAdmin = createClient(url, anon);
  return _sbAdmin;
}

module.exports = async function handler(req, res) {
  const room = (req.query.room || "").toUpperCase().trim();
  if (!room) {
    res.status(200).json({ ok: false, reason: "no_room" });
    return;
  }

  const admin = getFirebaseAdmin();
  if (!admin) {
    res.status(200).json({ ok: false, reason: "firebase_not_configured" });
    return;
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    res.status(200).json({ ok: false, reason: "supabase_not_configured" });
    return;
  }

  // Look up the host's FCM token
  const { data, error } = await sb
    .from("game_rooms")
    .select("host_fcm_token")
    .eq("room_id", room)
    .single();

  if (error || !data || !data.host_fcm_token) {
    res.status(200).json({ ok: false, reason: "no_token" });
    return;
  }

  // Send the push notification
  try {
    await admin.messaging().send({
      token: data.host_fcm_token,
      notification: {
        title: "Calles de Alberdi",
        body:  "Jugador 2 se unio a tu sala!",
      },
      webpush: {
        notification: {
          icon:  "https://calles-de-alberdi.vercel.app/assets/icon-192.png",
          badge: "https://calles-de-alberdi.vercel.app/assets/icon-192.png",
          tag:   "room-joined",
          requireInteraction: true,
        },
        fcmOptions: {
          link: "https://calles-de-alberdi.vercel.app",
        },
      },
      data: {
        room: room,
        url:  "https://calles-de-alberdi.vercel.app",
      },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[notify] FCM send failed:", err.message);
    res.status(200).json({ ok: false, reason: "send_failed" });
  }
};
