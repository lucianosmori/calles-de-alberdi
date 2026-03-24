// Vercel Serverless Function — serves client config (Supabase + Firebase).
// All values here are PUBLIC keys (designed for browser use), so exposing
// them via this endpoint is safe. Secrets stay server-side in api/notify.js.

module.exports = function handler(req, res) {
  // Cache for 5 minutes — config doesn't change often
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    supabaseUrl:              process.env.SUPABASE_URL                  || "",
    supabaseAnon:             process.env.SUPABASE_ANON                 || "",
    firebaseApiKey:           process.env.FIREBASE_API_KEY              || "",
    firebaseProjectId:        process.env.FIREBASE_PROJECT_ID           || "",
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    firebaseAppId:            process.env.FIREBASE_APP_ID               || "",
    firebaseVapidKey:         process.env.FIREBASE_VAPID_KEY            || "",
  });
}
