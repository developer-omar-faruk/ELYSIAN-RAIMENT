// ============================================================
// R-Garments — all configurable website data
// ============================================================

// ---------- Brand ----------
export const BRAND = {
  name: "Elysan-Raiment",
  tagline: "Modern classic women's fashion",
  description:
    "Thoughtfully designed women's fashion from Bangladesh — modest wear, everyday essentials and festive sets crafted with care.",
  currency: "৳",
  copyrightYear: 2026,
};

// ---------- Navigation (do not add links) ----------
export const NAV = [
  { label: "Home", to: "/" },
  { label: "All Products", to: "/shop" },
  { label: "About", to: "/about" },
];

// ---------- Image helper (centralised so URLs are easy to replace) ----------
const U = (id, w = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${Math.round(w * 1.25)}&q=75`;
export const IMAGE_POOL = [
  "photo-1515886657613-9f3515b0c78f", "photo-1529139574466-a303027c1d8b", "photo-1539109136881-3be0616acf4b",
  "photo-1483985988355-763728e1935b", "photo-1490481651871-ab68de25d43d", "photo-1496747611176-843222e1e57c",
  "photo-1509631179647-0177331693ae", "photo-1524504388940-b1c1722653e1", "photo-1485968579580-b6d095142e6e",
  "photo-1558769132-cb1aea458c5e", "photo-1581044777550-4cfa60707c03", "photo-1469334031218-e382a71b716b",
  "photo-1534528741775-53994a69daeb", "photo-1487222477894-8943e31ef7b2", "photo-1495385794356-15371f348c31",
  "photo-1445205170230-053b83016050",
].map((id) => U(id));
export const wide = (i) => U(IMAGE_POOL_IDS(i), 1600);
function IMAGE_POOL_IDS(i) {
  return ["photo-1469334031218-e382a71b716b", "photo-1490481651871-ab68de25d43d", "photo-1515886657613-9f3515b0c78f"][i % 3];
}

// ---------- Categories ----------
export const CATEGORIES = [
  { slug: "burqa", name: "Burqa / Borka", desc: "Graceful everyday modest wear", image: IMAGE_POOL[6] },
  { slug: "abaya", name: "Abaya", desc: "Flowing silhouettes, refined finish", image: IMAGE_POOL[2] },
  { slug: "tops", name: "Tops", desc: "Easy pieces for every day", image: IMAGE_POOL[4] },
  { slug: "kurti", name: "Kurti", desc: "Printed and embroidered favourites", image: IMAGE_POOL[0] },
  { slug: "palazzo", name: "Palazzo / Pajama", desc: "Comfort with elegant drape", image: IMAGE_POOL[8] },
  { slug: "hoodie", name: "Hoodie", desc: "Soft layers for cooler days", image: IMAGE_POOL[10] },
  { slug: "sets", name: "Two-piece & Three-piece", desc: "Coordinated, ready-to-wear sets", image: IMAGE_POOL[11] },
  { slug: "other", name: "Other Collections", desc: "Scarves, shawls and more", image: IMAGE_POOL[14] },
];

// ---------- Hero slides ----------
export const HERO_SLIDES = [
  { image: U("photo-1469334031218-e382a71b716b", 1800), title: "Style That Speaks Your Elegance", text: "Discover timeless fashion, beautiful everyday essentials, and carefully selected styles made for you.", pos: "center top" },
  { image: U("photo-1490481651871-ab68de25d43d", 1800), title: "Modest Wear, Beautifully Made", text: "Soft fabrics and graceful cuts in our new Abaya and Borka edit.", pos: "center 30%" },
  { image: U("photo-1515886657613-9f3515b0c78f", 1800), title: "Festive Sets for Every Celebration", text: "Coordinated two-piece and three-piece sets, tailored for the season.", pos: "center 20%" },
];

// ---------- Products ----------
// Helper: build gallery from the shared pool so every product has multiple images
const gal = (i) => [IMAGE_POOL[i % 16], IMAGE_POOL[(i + 3) % 16], IMAGE_POOL[(i + 7) % 16], IMAGE_POOL[(i + 11) % 16]];
const mk = (i, slug, name, category, price, old, sizes, colors, rating, reviews, stock, flags, description, fabric) => ({
  id: `p${i}`, slug, name, category, price, oldPrice: old, sizes, colors, rating, reviews, stock,
  images: gal(i), isNew: !!flags.n, trending: !!flags.t, featured: !!flags.f, popularity: reviews, createdAt: 100 - i,
  description, fabric,
});
const S = ["S", "M", "L", "XL"];
const SZ = ["52", "54", "56", "58"];
export const PRODUCTS = [
  mk(1, "classic-black-borka", "Classic Black Borka", "burqa", 2450, 2900, SZ, ["Black"], 4.7, 128, 14, { f: 1, t: 1 }, "A everyday borka with a clean front zip, wide sleeves and breathable nida fabric.", "Premium Nida, soft matte finish"),
  mk(2, "embroidered-sleeve-burqa", "Embroidered Sleeve Burqa", "burqa", 3250, null, SZ, ["Black", "Navy"], 4.5, 64, 9, { n: 1 }, "Subtle gold thread embroidery on the cuffs with a flattering A-line fall.", "Crepe blend with embroidery"),
  mk(3, "dubai-open-abaya", "Dubai Open Abaya", "abaya", 3890, 4500, SZ, ["Sand", "Black"], 4.8, 212, 11, { f: 1, t: 1 }, "An open-front abaya with a fluid drape, ideal over casual or formal outfits.", "Korean georgette, light and airy"),
  mk(4, "butterfly-abaya", "Butterfly Cut Abaya", "abaya", 4150, null, SZ, ["Mocha", "Olive"], 4.6, 87, 7, { n: 1, t: 1 }, "Wide butterfly sleeves and a tie waist for an elegant, relaxed silhouette.", "Imported crinkle chiffon"),
  mk(5, "linen-boxy-top", "Linen Boxy Top", "tops", 1190, 1450, S, ["Ivory", "Sage"], 4.4, 51, 22, { f: 1 }, "Relaxed boxy top with a round neck, made for warm Dhaka days.", "Linen-cotton blend"),
  mk(6, "ruffle-hem-top", "Ruffle Hem Top", "tops", 1350, null, S, ["Rose", "White"], 4.3, 39, 17, { n: 1 }, "Feminine top with delicate ruffle hem and puffed sleeves.", "Soft viscose"),
  mk(7, "block-print-kurti", "Block Print Kurti", "kurti", 1690, 1990, S, ["Indigo", "Rust"], 4.6, 143, 19, { f: 1, t: 1 }, "Hand-block inspired print with side slits and a comfortable straight cut.", "100% cotton"),
  mk(8, "chikankari-kurti", "Chikankari Kurti", "kurti", 2290, null, S, ["White", "Peach"], 4.7, 98, 8, { t: 1 }, "Elegant chikankari-style embroidery across the yoke and hem.", "Cotton mul"),
  mk(9, "wide-leg-palazzo", "Wide Leg Palazzo", "palazzo", 1290, 1550, ["M", "L", "XL"], ["Black", "Beige"], 4.5, 77, 25, { f: 1 }, "High-waisted palazzo with elastic back and pleated front.", "Crepe, flowy drape"),
  mk(10, "cotton-pajama-pants", "Cotton Pajama Pants", "palazzo", 890, null, S, ["Grey", "Cream"], 4.2, 45, 30, {}, "Soft lounge pants for home and travel with drawstring waist.", "Combed cotton"),
  mk(11, "oversized-fleece-hoodie", "Oversized Fleece Hoodie", "hoodie", 2150, 2600, S, ["Oat", "Charcoal"], 4.8, 176, 13, { f: 1, t: 1 }, "Cosy oversized hoodie with kangaroo pocket and a brushed fleece interior.", "Cotton fleece, 320 GSM"),
  mk(12, "zip-up-hoodie", "Cropped Zip-up Hoodie", "hoodie", 1990, null, S, ["Dusty Pink", "Black"], 4.4, 58, 10, { n: 1 }, "Cropped zip-front hoodie for easy layering over tops.", "Cotton terry"),
  mk(13, "three-piece-festive-set", "Festive Three-piece Set", "sets", 4890, 5800, S, ["Emerald", "Maroon"], 4.9, 231, 6, { f: 1, t: 1 }, "Kameez, salwar and dupatta with fine border work for celebrations.", "Georgette with embroidery"),
  mk(14, "co-ord-two-piece", "Linen Co-ord Two-piece", "sets", 2990, 3400, S, ["Stone", "Olive"], 4.5, 84, 12, { n: 1 }, "Matching shirt and trouser set, polished for work and weekends.", "Linen blend"),
  mk(15, "silk-touch-scarf", "Silk-touch Hijab Scarf", "other", 590, 750, ["Free"], ["Mauve", "Ivory", "Black"], 4.6, 302, 60, { t: 1 }, "Lightweight, pin-friendly scarf with a smooth silk-like finish.", "Satin-silk blend"),
  mk(16, "woolen-winter-shawl", "Woolen Winter Shawl", "other", 1690, null, ["Free"], ["Camel", "Grey"], 4.7, 69, 15, { n: 1 }, "Warm, generously sized shawl with a tonal fringe edge.", "Soft acrylic wool"),
  mk(17, "pleated-midi-abaya", "Pleated Midi Abaya", "abaya", 3590, 3990, SZ, ["Black", "Taupe"], 4.5, 41, 5, {}, "Pleated skirt panel adds graceful movement.", "Satin crepe"),
];

// ---------- Home page configuration ----------
export const HOME_CONFIG = { featuredIds: PRODUCTS.filter((p) => p.featured).map((p) => p.id), trendingIds: PRODUCTS.filter((p) => p.trending).map((p) => p.id), relatedCount: 4 };

// ---------- Reviews ----------
export const REVIEWS = [
  { name: "Nusrat Jahan", city: "Dhaka", rating: 5, text: "The fabric quality is wonderful and the fit was exactly as described. Delivered in two days.", image: U("photo-1494790108377-be9c29b29330", 200) },
  { name: "Farhana Akter", city: "Chattogram", rating: 5, text: "My abaya looks even better in person. The stitching is neat and the drape is beautiful.", image: U("photo-1438761681033-6461ffad8d80", 200) },
  { name: "Samira Rahman", city: "Sylhet", rating: 4, text: "Easy exchange process and polite support. The kurti colour matches the photos.", image: U("photo-1544005313-94ddf0286df2", 200) },
  { name: "Tasnim Haque", city: "Rajshahi", rating: 5, text: "Loved the hoodie — soft, warm and true to size. Will order again.", image: U("photo-1534528741775-53994a69daeb", 200) },
];

// ---------- Delivery / coupons ----------
export const DELIVERY_ZONES = [
  { id: "dhaka", label: "Dhaka City", fee: 40, note: "Delivery in 1–2 working days" },
  { id: "outside", label: "Outside Dhaka City", fee: 50, note: "Delivery in 3–5 working days" },
];
export const COUPONS = {
  WELCOME10: { type: "percent", value: 10, label: "10% off your order" },
  SAVE100: { type: "flat", value: 100, label: "৳100 off your order" },
};

// ---------- Contact / social ----------
export const CONTACT = {
  phone: "+8801700000000",
  phoneDisplay: "+880 1700-000000",
  email: "hello@r-garments.example",
  address: "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh",
  facebook: "https://facebook.com/",
  instagram: "https://instagram.com/",
  whatsapp: "https://wa.me/8801700000000",
  hours: "Sat–Thu, 10:00 AM – 8:00 PM",
};

// ---------- Newsletter ----------
export const NEWSLETTER = { title: "Join the R-Garments Letter", text: "New arrivals, styling notes and members-only offers — delivered occasionally, never noisy." };

// ---------- Size chart ----------
export const SIZE_CHART = {
  headers: ["Size", "Bust (in)", "Waist (in)", "Length (in)"],
  rows: [["S", "34", "28", "40"], ["M", "36", "30", "41"], ["L", "38", "32", "42"], ["XL", "40", "34", "43"]],
  note: "Borka & Abaya sizes (52–58) indicate garment length in inches.",
};

// ---------- Product page accordions ----------
export const INFO_SECTIONS = [
  { title: "Delivery Information", text: "Dhaka City ৳40 (1–2 days) and outside Dhaka ৳50 (3–5 days). Cash on Delivery available nationwide." },
  { title: "Exchange Information", text: "Exchange within 3 days of delivery if the item is unused with tags attached. Contact us to arrange a pickup." },
  { title: "Care Instructions", text: "Gentle machine wash cold or hand wash. Do not bleach. Dry in shade and iron on low heat." },
  { title: "Frequently Asked Questions", text: "Colours may vary slightly by screen. For size help, message us on WhatsApp and we will gladly assist." },
];
export const FOOTER_SUPPORT = ["Delivery Information", "Exchange Policy", "Privacy Policy", "Terms & Conditions"];
export const ORDER_STATUSES = ["Order Placed", "Processing", "Shipped", "Delivered"];