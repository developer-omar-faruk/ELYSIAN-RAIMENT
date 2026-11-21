const DEFAULT_API_URL = "https://elysian-raiment-backend.onrender.com/api/public/bootstrap";

function siteOrigin(req) {
  const configured = process.env.VITE_SITE_URL || process.env.SITE_URL;
  if (configured) return new URL(configured).origin;
  const host = String(req.headers.host || "").split(",")[0].trim();
  if (!host || /[\r\n/\\]/.test(host)) throw new Error("Missing or invalid request host.");
  const protocol = process.env.VERCEL ? "https" : (req.headers["x-forwarded-proto"] || "http").split(",")[0].trim();
  return new URL(`${protocol}://${host}`).origin;
}

const xmlEscape = (value) => String(value).replace(/[<>&'"]/g, (char) => ({
  "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;",
}[char]));
const validSlug = (slug) => typeof slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(slug);

export default async function sitemap(req, res) {
  let origin;
  try {
    origin = siteOrigin(req);
    const response = await fetch(process.env.STOREFRONT_BOOTSTRAP_URL || DEFAULT_API_URL, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Catalogue request failed (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.products) || !Array.isArray(data.categories)) {
      throw new Error("Catalogue response is missing products or categories.");
    }

    const paths = ["/", "/shop", "/about"];
    for (const category of data.categories) {
      if (validSlug(category.slug)) paths.push(`/category/${encodeURIComponent(category.slug)}`);
    }
    for (const product of data.products) {
      if (validSlug(product.slug)) paths.push(`/product/${encodeURIComponent(product.slug)}`);
    }
    const urls = [...new Set(paths)].map((path) => `  <url><loc>${xmlEscape(new URL(path, origin).href)}</loc></url>`);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`);
  } catch (error) {
    console.error("Could not generate the storefront sitemap.", error);
    return res.status(503).send("Sitemap is temporarily unavailable.");
  }
}
