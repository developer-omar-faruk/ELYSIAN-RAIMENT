# Search visibility setup

The storefront uses clean browser routes. Vercel rewrites those routes to the React app and serves `/robots.txt` and `/sitemap.xml` from serverless functions. The sitemap reads the current public catalogue, so published products and categories are included automatically.

Optional Vercel environment variables:

- `VITE_SITE_URL`: canonical production origin (for example, `https://shop.example.com`). Leave unset to use the current request origin.
- `VITE_GA4_MEASUREMENT_ID`: GA4 measurement ID (`G-...`). Tracking is not loaded unless this is configured.
- `VITE_GOOGLE_SITE_VERIFICATION`: Search Console HTML-tag verification token. DNS verification does not need this setting.
- `STOREFRONT_BOOTSTRAP_URL`: override the public catalogue API used to generate the sitemap; normally leave unset.

Set frontend `VITE_*` variables for both the Vercel build and deployment environment, then redeploy. Configure GA4 disclosures and privacy requirements before enabling analytics.

After deployment, verify `/robots.txt`, `/sitemap.xml`, and a direct product URL. Add the production property to Google Search Console, submit `/sitemap.xml`, inspect key URLs, and request indexing for the homepage, categories, and priority products.

Product ratings and testimonials are intentionally not published from the seeded demo data. Add only genuine, moderated customer reviews before enabling review display or review structured data.
