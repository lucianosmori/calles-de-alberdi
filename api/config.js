// Vercel Serverless Function — serves Supabase config to the client.
// Environment variables SUPABASE_URL and SUPABASE_ANON must be set
// in Vercel project settings (Settings > Environment Variables).
//
// The anon key is a PUBLIC key (designed for browser use), so exposing
// it via this endpoint is safe. All access is controlled by RLS policies.

export default function handler(req, res) {
  // Cache for 5 minutes — config doesn't change often
  res.setHeader("Cache-Control", "public, max-age=300");
  res.json({
    supabaseUrl:  process.env.SUPABASE_URL  || "",
    supabaseAnon: process.env.SUPABASE_ANON || "",
  });
}
