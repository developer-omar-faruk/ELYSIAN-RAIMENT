import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStore } from "./store.jsx";
import { optimizeImage } from "./image.js";

const SITE_NAME = "Elysian Raiment";
const SITE_URL = import.meta.env.VITE_SITE_URL?.replace(/\/+$/, "");
const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID?.trim();
const GOOGLE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
const absoluteUrl = (path) => new URL(path, SITE_URL || window.location.origin).href;
const excerpt = (text, max = 160) => {
  const clean = text?.replace(/\s+/g, " ").trim() || "";
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
};

function Seo({ title, description, path = "/", image = "/favicon.png", noIndex = false, schemas = [] }) {
  const schemaMarkup = JSON.stringify(schemas).replace(/</g, "\\u003c");
  const hasSchemas = schemas.length > 0;
  const isProduct = schemas.some((schema) => schema["@type"] === "Product");

  useEffect(() => {
    const canonical = absoluteUrl(path);
    const imageUrl = absoluteUrl(optimizeImage(image, 1200));
    document.title = title;
    document.querySelectorAll("[data-seo-managed]").forEach((node) => node.remove());

    const addMeta = (attributes) => {
      const meta = document.createElement("meta");
      Object.entries(attributes).forEach(([key, value]) => {
        if (value) meta.setAttribute(key, value);
      });
      meta.dataset.seoManaged = "true";
      document.head.appendChild(meta);
    };
    const addLink = (rel, href) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      link.dataset.seoManaged = "true";
      document.head.appendChild(link);
    };

    addMeta({ name: "description", content: description });
    addMeta({ name: "robots", content: noIndex ? "noindex,follow" : "index,follow" });
    addMeta({ name: "google-site-verification", content: GOOGLE_VERIFICATION });
    addMeta({ property: "og:site_name", content: SITE_NAME });
    addMeta({ property: "og:type", content: isProduct ? "product" : "website" });
    addMeta({ property: "og:title", content: title });
    addMeta({ property: "og:description", content: description });
    addMeta({ property: "og:url", content: canonical });
    addMeta({ property: "og:image", content: imageUrl });
    addMeta({ name: "twitter:card", content: "summary_large_image" });
    addMeta({ name: "twitter:title", content: title });
    addMeta({ name: "twitter:description", content: description });
    addMeta({ name: "twitter:image", content: imageUrl });
    addLink("canonical", canonical);

    if (hasSchemas) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = schemaMarkup;
      script.dataset.seoManaged = "true";
      document.head.appendChild(script);
    }
  }, [description, hasSchemas, image, isProduct, noIndex, path, schemaMarkup, title]);

  return null;
}

function GoogleAnalytics({ path }) {
  useEffect(() => {
    if (!GA_ID) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

    if (!document.getElementById("elysian-ga4")) {
      const script = document.createElement("script");
      script.id = "elysian-ga4";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
      document.head.appendChild(script);
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { send_page_view: false });
    }

    if (window.__elysianLastPageView !== path) {
      window.__elysianLastPageView = path;
      window.gtag("event", "page_view", { page_path: path, page_location: absoluteUrl(path) });
    }
  }, [path]);

  return null;
}

function organizationSchema(contact, brand) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl(brand.logo || "/favicon.png"),
    areaServed: { "@type": "Country", name: "Bangladesh" },
  };
  if (brand.description) schema.description = brand.description;
  const sameAs = [contact.facebook, contact.instagram].filter(Boolean);
  if (sameAs.length) schema.sameAs = sameAs;
  if (contact.email) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: contact.email,
    };
  }
  return schema;
}

function StorefrontSeo() {
  const { pathname, search } = useLocation();
  const { products, categories, banners, contact, brand } = useStore();
  const params = new URLSearchParams(search);
  const category = pathname.startsWith("/category/")
    ? categories.find((item) => item.slug === pathname.split("/")[2])
    : null;
  const product = pathname.startsWith("/product/")
    ? products.find((item) => item.slug === pathname.split("/")[2])
    : null;
  const cleanPath = pathname || "/";
  const crumbs = [];
  let title = `${SITE_NAME} | Women's Clothing & Modest Fashion`;
  let description = "Shop women's clothing and modest fashion in Bangladesh. Discover burqa, abaya, kurti, tops and festive sets from Elysian Raiment.";
  let image = banners[0]?.image || "/favicon.png";
  let noIndex = false;
  const schemas = [];

  if (cleanPath === "/") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/shop")}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }, organizationSchema(contact, brand));
  } else if (cleanPath === "/shop") {
    title = "Women's Clothing & Fashion Online in Bangladesh | Elysian Raiment";
    description = "Shop women's clothing online in Bangladesh, including modest wear, burqa, abaya, kurti, tops and coordinated sets.";
    crumbs.push(["Shop", "/shop"]);
    noIndex = params.has("q");
  } else if (category) {
    title = `${category.name} for Women in Bangladesh | Elysian Raiment`;
    description = excerpt(`Shop ${category.name.toLowerCase()} at Elysian Raiment. ${category.desc || "Explore women's fashion"} with delivery across Bangladesh.`);
    crumbs.push(["Shop", "/shop"], [category.name]);
    schemas.push({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: absoluteUrl(cleanPath),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: products.filter((item) => item.category === category.slug).map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: absoluteUrl(`/product/${item.slug}`),
        })),
      },
    });
  } else if (product) {
    title = `${product.name} | ${SITE_NAME}`;
    description = excerpt([product.description, product.fabric && `Fabric: ${product.fabric}.`, `Shop ${product.name} in Bangladesh.`].filter(Boolean).join(" "));
    image = product.images?.[0] || image;
    const categoryName = categories.find((item) => item.slug === product.category)?.name;
    crumbs.push(["Shop", "/shop"], ...(categoryName ? [[categoryName, `/category/${product.category}`]] : []), [product.name]);
    const productImages = (product.images || []).map((src) => absoluteUrl(optimizeImage(src, 1200)));
    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description || product.name,
      sku: product.id,
      category: categoryName || product.category,
      brand: { "@type": "Brand", name: SITE_NAME },
      offers: {
        "@type": "Offer",
        url: absoluteUrl(cleanPath),
        priceCurrency: "BDT",
        price: String(product.price),
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    };
    if (productImages.length) productSchema.image = productImages;
    schemas.push(productSchema);
  } else if (cleanPath === "/about") {
    title = `About ${SITE_NAME} | Modest Women's Fashion in Bangladesh`;
    description = "Learn about Elysian Raiment, a Bangladesh women's fashion store for modest wear, everyday clothing and festive styles.";
    crumbs.push(["About", "/about"]);
  } else {
    title = `Page not found | ${SITE_NAME}`;
    noIndex = true;
  }

  if (cleanPath === "/cart" || cleanPath === "/checkout" || cleanPath === "/my-orders" || cleanPath.startsWith("/order-success/") || cleanPath.startsWith("/admin")) {
    noIndex = true;
  }

  if (!noIndex && crumbs.length) {
    const items = [["Home", "/"], ...crumbs].map(([name, crumbPath], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: absoluteUrl(crumbPath || cleanPath),
    }));
    schemas.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items });
  }

  return <>
    <Seo title={title} description={description} path={cleanPath} image={image} noIndex={noIndex} schemas={schemas} />
    <GoogleAnalytics path={`${cleanPath}${search}`} />
  </>;
}

export { Seo, StorefrontSeo };
