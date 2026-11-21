export default function robots(req, res) {
  try {
    const configured = process.env.VITE_SITE_URL || process.env.SITE_URL;
    let origin;
    if (configured) {
      origin = new URL(configured).origin;
    } else {
      const host = String(req.headers.host || "").split(",")[0].trim();
      if (!host || /[\r\n/\\]/.test(host)) throw new Error("Missing or invalid request host.");
      const protocol = process.env.VERCEL ? "https" : (req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
      origin = new URL(`${protocol}://${host}`).origin;
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    return res.status(200).send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${origin}/sitemap.xml\n`);
  } catch (error) {
    console.error("Could not generate robots.txt.", error);
    return res.status(500).send("robots.txt is temporarily unavailable.");
  }
}
