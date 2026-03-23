// Vercel Serverless Function — generates a QR code PNG for a given URL.
// Usage: /api/qr?url=https://example.com
//
// Returns a 200×200 PNG image. Used by the multiplayer room QR overlay.

const QRCode = require("qrcode");

module.exports = async function handler(req, res) {
  const url = req.query.url;
  if (!url) {
    res.status(400).send("Missing ?url= parameter");
    return;
  }

  try {
    const buffer = await QRCode.toBuffer(url, { width: 200, margin: 1 });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(buffer);
  } catch (err) {
    console.error("[api/qr] Generation failed:", err.message);
    res.status(500).send("QR generation failed");
  }
};
