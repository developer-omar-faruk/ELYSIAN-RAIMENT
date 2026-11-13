import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { HashRouter, Routes, Route, Link, NavLink, useNavigate, useParams, useLocation, useSearchParams, Navigate } from "react-router-dom";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { FaBars, FaTimes, FaSearch, FaShoppingBag, FaBoxOpen, FaChevronRight, FaChevronDown, FaChevronLeft, FaStar, FaRegStar, FaLock, FaCheckCircle, FaPhoneAlt, FaFacebookF, FaInstagram, FaWhatsapp, FaPlus, FaMinus, FaTrashAlt, FaRegUser } from "react-icons/fa";
import { BRAND, NAV, CATEGORIES, HERO_SLIDES, PRODUCTS, HOME_CONFIG, REVIEWS, DELIVERY_ZONES, COUPONS, CONTACT, NEWSLETTER, SIZE_CHART, INFO_SECTIONS, FOOTER_SUPPORT, ORDER_STATUSES } from "./data.js";

// ============================================================
// Helpers
// ============================================================
const money = (n) => `${BRAND.currency}${Math.round(n).toLocaleString("en-US")}`;
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);
const catName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name || "";
const discountPct = (p) => (p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const phoneOk = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ""));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const INK = "text-[#222222]", MUTED = "text-[#77736C]";
const btnDark = "bg-[#242424] text-white hover:bg-black transition-colors";
const btnLine = "border border-[#222222] text-[#222222] hover:bg-[#222222] hover:text-white transition-colors";
const field = "w-full bg-[#FAF7F1] border border-[#E8DDCA] px-4 py-3 text-sm outline-none focus:border-[#C5A16A] rounded-sm";

// ============================================================
// Store context: cart, orders, toast, search
// ============================================================
const Store = createContext(null);
const useStore = () => useContext(Store);

function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => load("rg_cart", []));
  const [orders, setOrders] = useState(() => load("rg_orders", []));
  const [toast, setToast] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => localStorage.setItem("rg_cart", JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem("rg_orders", JSON.stringify(orders)), [orders]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);
  const notify = useCallback((msg, type = "ok") => setToast({ msg, type, k: Date.now() }), []);

  // Add item; merge when same product and size exist
  const addToCart = useCallback((id, size, qty = 1, silent = false) => {
    const p = findProduct(id);
    setCart((c) => {
      const ex = c.find((i) => i.id === id && i.size === size);
      if (ex) return c.map((i) => (i === ex ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i));
      return [...c, { id, size, qty: Math.min(p.stock, qty) }];
    });
    if (!silent) notify(`${p.name} added to cart`);
  }, [notify]);
  const setQty = (id, size, qty) => setCart((c) => c.map((i) => (i.id === id && i.size === size ? { ...i, qty: Math.max(1, Math.min(findProduct(id).stock, qty)) } : i)));
  const removeItem = (id, size) => setCart((c) => c.filter((i) => !(i.id === id && i.size === size)));
  const lines = useMemo(() => cart.map((i) => ({ ...i, product: findProduct(i.id) })).filter((l) => l.product), [cart]);
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <Store.Provider value={{ cart, lines, subtotal, count, addToCart, setQty, removeItem, clearCart: () => setCart([]), orders, setOrders, toast, notify, searchOpen, setSearchOpen }}>
      {children}
    </Store.Provider>
  );
}

// ============================================================
// Small reusable UI
// ============================================================
// Image with graceful fallback
function Img({ src, alt, className = "" }) {
  const [bad, setBad] = useState(false);
  if (bad) return <div className={`bg-[#E8DDCA] flex items-center justify-center text-[#77736C] text-xs ${className}`}>{alt}</div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}
const Stars = ({ value, size = 12 }) => (
  <span className="inline-flex gap-0.5 text-[#C5A16A]">{[1, 2, 3, 4, 5].map((n) => (n <= Math.round(value) ? <FaStar key={n} size={size} /> : <FaRegStar key={n} size={size} />))}</span>
);
const Reveal = ({ children, className = "", delay = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay }}>{children}</motion.div>
);
const Container = ({ children, className = "" }) => <div className={`mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
const SectionHead = ({ eyebrow, title, text, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-12">
    <div className="max-w-xl">
      <p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A16A] mb-3">{eyebrow}</p>
      <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[#222222]">{title}</h2>
      {text && <p className={`mt-3 text-sm md:text-base ${MUTED}`}>{text}</p>}
    </div>
    {action}
  </div>
);
const Breadcrumb = ({ items }) => (
  <nav className={`text-xs ${MUTED} flex flex-wrap gap-2 items-center mb-6`}>
    {items.map((it, i) => (
      <span key={i} className="flex items-center gap-2">
        {it.to ? <Link to={it.to} className="hover:text-[#222222]">{it.label}</Link> : <span className={INK}>{it.label}</span>}
        {i < items.length - 1 && <FaChevronRight size={8} />}
      </span>
    ))}
  </nav>
);
const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E8DDCA]">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-4 text-left text-sm font-medium">
        {title}<FaChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className={`pb-4 text-sm leading-relaxed ${MUTED}`}>{children}</div></motion.div>}
      </AnimatePresence>
    </div>
  );
};
function Toast() {
  const { toast } = useStore();
  return (
    <div className="fixed bottom-5 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.k} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`px-5 py-3 text-sm text-white shadow-xl rounded-sm flex items-center gap-2 ${toast.type === "err" ? "bg-red-700" : "bg-[#242424]"}`}>
            <FaCheckCircle className="text-[#C5A16A]" /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function NewsletterForm({ dark }) {
  const { notify } = useStore();
  const [email, setEmail] = useState(""); const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!emailOk(email)) return setErr("Please enter a valid email address.");
    setErr(""); setEmail(""); notify("Thanks for subscribing! (demo)");
  };
  return (
    <form onSubmit={submit} noValidate>
      <div className="flex">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email address" className={`flex-1 min-w-0 px-4 py-3 text-sm outline-none ${dark ? "bg-white/10 text-white placeholder-white/50 border border-white/20" : "bg-white border border-[#E8DDCA]"}`} />
        <button className="px-5 text-sm bg-[#C5A16A] text-[#222222] hover:bg-[#d4b27d] transition-colors">Subscribe</button>
      </div>
      {err && <p className="text-xs text-red-500 mt-2">{err}</p>}
    </form>
  );
}

// ============================================================
// Product card
// ============================================================
function ProductCard({ p, compact }) {
  const { addToCart } = useStore();
  const navigate = useNavigate();
  const d = discountPct(p);
  const quickSize = p.sizes.length === 1 ? p.sizes[0] : null;
  const needSize = () => navigate(`/product/${p.slug}`);
  return (
    <motion.article whileHover={{ y: -4 }} className="group bg-white border border-[#E8DDCA] flex flex-col h-full">
      <Link to={`/product/${p.slug}`} className="relative block overflow-hidden aspect-[4/5] bg-[#FAF7F1]">
        <Img src={p.images[0]} alt={p.name} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
        <Img src={p.images[1]} alt="" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {p.trending && <span className="bg-[#242424] text-white text-[10px] tracking-wider uppercase px-2 py-1">Trending</span>}
          {p.isNew && <span className="bg-[#C5A16A] text-[#222222] text-[10px] tracking-wider uppercase px-2 py-1">New</span>}
        </div>
        {d > 0 && <span className="absolute top-2 right-2 bg-white text-[#222222] text-[11px] font-medium px-2 py-1">-{d}%</span>}
      </Link>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className={`text-[10px] uppercase tracking-[0.2em] ${MUTED}`}>{catName(p.category)}</p>
        <Link to={`/product/${p.slug}`} className="mt-1 font-serif text-base sm:text-lg leading-snug line-clamp-2 hover:text-[#C5A16A]">{p.name}</Link>
        <div className="flex items-center gap-2 mt-1.5"><Stars value={p.rating} /><span className={`text-xs ${MUTED}`}>({p.reviews})</span></div>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="font-semibold">{money(p.price)}</span>
          {p.oldPrice && <span className={`text-xs line-through ${MUTED}`}>{money(p.oldPrice)}</span>}
        </div>
        <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => (quickSize ? addToCart(p.id, quickSize) : needSize())} className={`py-2.5 text-xs ${btnLine}`}>Add to Cart</motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => (quickSize ? (addToCart(p.id, quickSize, 1, true), navigate("/checkout")) : needSize())} className={`py-2.5 text-xs ${btnDark}`}>Buy Now</motion.button>
        </div>
      </div>
    </motion.article>
  );
}
const ProductGrid = ({ items }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
);

// ============================================================
// Search overlay
// ============================================================
function SearchModal() {
  const { searchOpen, setSearchOpen } = useStore();
  const [q, setQ] = useState(""); const navigate = useNavigate(); const ref = useRef();
  useEffect(() => { if (searchOpen) setTimeout(() => ref.current?.focus(), 100); else setQ(""); }, [searchOpen]);
  useEffect(() => { const f = (e) => e.key === "Escape" && setSearchOpen(false); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [setSearchOpen]);
  const results = useMemo(() => (q.trim() ? PRODUCTS.filter((p) => (p.name + catName(p.category)).toLowerCase().includes(q.toLowerCase())).slice(0, 6) : []), [q]);
  const go = (path) => { setSearchOpen(false); navigate(path); };
  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="fixed inset-0 z-[90] bg-black/50 flex items-start justify-center p-4 pt-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSearchOpen(false)}>
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-[#FFFCF7] w-full max-w-xl shadow-2xl">
            <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(`/shop?q=${encodeURIComponent(q.trim())}`); }} className="flex items-center gap-3 p-4 border-b border-[#E8DDCA]">
              <FaSearch className={MUTED} />
              <input ref={ref} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products and collections" className="flex-1 bg-transparent outline-none text-base" />
              <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><FaTimes /></button>
            </form>
            <div className="max-h-[60vh] overflow-y-auto">
              {q.trim() && !results.length && <p className={`p-6 text-sm ${MUTED}`}>No products found for "{q}".</p>}
              {results.map((p) => (
                <button key={p.id} onClick={() => go(`/product/${p.slug}`)} className="w-full flex gap-3 items-center p-3 hover:bg-[#F5F0E7] text-left">
                  <Img src={p.images[0]} alt={p.name} className="w-12 h-14" />
                  <div className="flex-1"><p className="text-sm">{p.name}</p><p className={`text-xs ${MUTED}`}>{catName(p.category)}</p></div>
                  <span className="text-sm">{money(p.price)}</span>
                </button>
              ))}
              {q.trim() && <button onClick={() => go(`/shop?q=${encodeURIComponent(q.trim())}`)} className="w-full p-3 text-sm text-center text-[#C5A16A] border-t border-[#E8DDCA]">See all results for "{q}"</button>}
              {!q.trim() && <p className={`p-6 text-sm ${MUTED}`}>Try "abaya", "hoodie" or "kurti".</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// Navbar (fixed) + mobile drawer
// ============================================================
function MobileDrawer({ open, onClose }) {
  const [catOpen, setCatOpen] = useState(false);
  const { setSearchOpen } = useStore(); const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", esc); };
  }, [open, onClose]);
  const go = (to) => { onClose(); navigate(to); };
  const row = "w-full flex items-center justify-between py-5 border-b border-[#E8DDCA] text-left text-xl font-serif active:bg-[#F5F0E7] transition-colors";
  const card = "w-full flex items-center gap-4 p-4 bg-[#F1E9DA] rounded-md text-left active:bg-[#E8DDCA] transition-colors";
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-[70] bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside onClick={(e) => e.stopPropagation()} initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3 }}
            className="fixed left-0 top-0 z-[80] h-[100dvh] w-[90%] max-w-[360px] bg-[#FFFCF7] shadow-2xl overflow-y-auto overscroll-contain px-6 pb-8">
            <div className="flex items-center justify-between py-6 border-b border-[#E8DDCA]">
              <h2 className="font-serif text-4xl">Menu</h2>
              <button onClick={onClose} aria-label="Close menu" className="w-11 h-11 flex items-center justify-center"><FaTimes size={20} /></button>
            </div>
            <button className={row} onClick={() => go("/")}>Home<FaChevronRight size={12} /></button>
            <button className={row} onClick={() => setCatOpen(!catOpen)}>Categories<FaChevronDown size={12} className={`transition-transform ${catOpen ? "rotate-180" : ""}`} /></button>
            <AnimatePresence initial={false}>
              {catOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  {CATEGORIES.map((c) => (
                    <button key={c.slug} onClick={() => go(`/category/${c.slug}`)} className="w-full flex items-center justify-between py-3.5 pl-4 text-[15px] border-b border-[#E8DDCA]/60 text-left active:bg-[#F5F0E7]">{c.name}<FaChevronRight size={10} className={MUTED} /></button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <button className={row} onClick={() => go("/shop")}>All Products<FaChevronRight size={12} /></button>
            <button className={row} onClick={() => go("/about")}>About<FaChevronRight size={12} /></button>
            <div className="mt-6 space-y-3">
              <button className={card} onClick={() => { onClose(); setSearchOpen(true); }}>
                <FaSearch size={18} /><span className="flex-1"><b className="block font-medium">Search</b><span className={`text-xs ${MUTED}`}>Find products and collections</span></span><FaChevronRight size={11} />
              </button>
              <button className={card} onClick={() => go("/my-orders")}>
                <FaRegUser size={18} /><span className="flex-1"><b className="block font-medium">My Orders</b><span className={`text-xs ${MUTED}`}>View your orders and order history</span></span><FaChevronRight size={11} />
              </button>
            </div>
            <div className="mt-8 pt-6 border-t border-[#E8DDCA]">
              <p className={`text-xs ${MUTED}`}>Need styling help?</p>
              <a href={`tel:${CONTACT.phone}`} className="mt-1 inline-flex items-center gap-2 font-medium"><FaPhoneAlt size={12} />{CONTACT.phoneDisplay}</a>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Navbar() {
  const { count, setSearchOpen } = useStore();
  const [scrolled, setScrolled] = useState(false); const [drawer, setDrawer] = useState(false); const [dd, setDd] = useState(false);
  const loc = useLocation();
  useEffect(() => { const f = () => setScrolled(window.scrollY > 10); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  useEffect(() => setDd(false), [loc.pathname]);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const link = ({ isActive }) => `text-sm tracking-wide transition-colors ${isActive ? "text-[#C5A16A]" : "hover:text-[#C5A16A]"}`;
  const CartBtn = (
    <Link to="/cart" aria-label="Cart" className="relative w-10 h-10 flex items-center justify-center">
      <FaShoppingBag size={17} />
      {count > 0 && <span className="absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C5A16A] text-[10px] text-[#222222] flex items-center justify-center font-semibold">{count}</span>}
    </Link>
  );
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[60] h-16 bg-[#FFFCF7]/95 backdrop-blur border-b transition-all duration-300 ${scrolled ? "border-[#E8DDCA] shadow-sm" : "border-transparent"}`}>
        <Container className="h-full flex items-center justify-between">
          {/* Mobile hamburger */}
          <button className="lg:hidden w-10 h-10 flex items-center justify-center -ml-2" onClick={() => setDrawer(true)} aria-label="Open menu"><FaBars size={19} /></button>
          <Link to="/" className="font-serif text-2xl tracking-tight lg:order-none absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">{BRAND.name}</Link>
          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-9">
            <div className="relative" onMouseEnter={() => setDd(true)} onMouseLeave={() => setDd(false)}>
              <button onClick={() => setDd(!dd)} className="text-sm tracking-wide hover:text-[#C5A16A] flex items-center gap-1.5 h-16">Categories<FaChevronDown size={9} className={`transition-transform ${dd ? "rotate-180" : ""}`} /></button>
              <AnimatePresence>
                {dd && (
                  <motion.ul initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute left-0 top-full w-60 bg-white border border-[#E8DDCA] shadow-xl py-2">
                    {CATEGORIES.map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`} className="block px-5 py-2.5 text-sm hover:bg-[#F5F0E7] hover:text-[#C5A16A]">{c.name}</Link></li>)}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end className={link}>{n.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="w-10 h-10 flex items-center justify-center"><FaSearch size={16} /></button>
            {CartBtn}
            <Link to="/my-orders" aria-label="My Orders" className="hidden lg:flex w-10 h-10 items-center justify-center"><FaBoxOpen size={18} /></Link>
          </div>
        </Container>
      </header>
      <MobileDrawer open={drawer} onClose={closeDrawer} />
    </>
  );
}

// ============================================================
// Footer
// ============================================================
function Footer() {
  const navigate = useNavigate();
  const h = "text-[11px] tracking-[0.25em] uppercase text-[#C5A16A] mb-4";
  const li = "text-sm text-white/70 hover:text-white transition-colors text-left";
  return (
    <footer className="bg-[#242424] text-white mt-24">
      <Container className="py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <p className="font-serif text-3xl">{BRAND.name}</p>
          <p className="text-sm text-white/60 mt-3 leading-relaxed">{BRAND.description}</p>
          <div className="flex gap-3 mt-5">
            {[[FaFacebookF, CONTACT.facebook, "Facebook"], [FaInstagram, CONTACT.instagram, "Instagram"], [FaWhatsapp, CONTACT.whatsapp, "WhatsApp"]].map(([I, href, l]) => (
              <a key={l} href={href} target="_blank" rel="noreferrer" aria-label={l} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[#C5A16A] hover:text-[#222222] transition-colors"><I size={14} /></a>
            ))}
          </div>
        </div>
        <div><h4 className={h}>Quick Links</h4><ul className="space-y-2.5">
          {[["Home", "/"], ["All Products", "/shop"], ["About", "/about"], ["My Orders", "/my-orders"]].map(([l, t]) => <li key={l}><Link to={t} className={li}>{l}</Link></li>)}</ul></div>
        <div><h4 className={h}>Categories</h4><ul className="space-y-2.5">
          {CATEGORIES.map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`} className={li}>{c.name.split(" /")[0].replace("Two-piece & Three-piece", "Sets")}</Link></li>)}</ul></div>
        <div><h4 className={h}>Customer Support</h4><ul className="space-y-2.5">
          <li><button className={li} onClick={() => navigate("/about", { state: { scrollTo: "contact" } })}>Contact Us</button></li>
          {FOOTER_SUPPORT.map((s) => <li key={s}><button className={li} onClick={() => navigate("/about")}>{s}</button></li>)}</ul></div>
        <div><h4 className={h}>Newsletter</h4><p className="text-sm text-white/60 mb-4">Be first to hear about new arrivals.</p><NewsletterForm dark /></div>
      </Container>
      <div className="border-t border-white/10"><Container className="py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/50">
        <p>© {BRAND.copyrightYear} {BRAND.name}. All rights reserved.</p><p>Cash on Delivery available across Bangladesh</p></Container></div>
    </footer>
  );
}

// ============================================================
// Layouts
// ============================================================
function ScrollManager() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    if (state?.scrollTo) { setTimeout(() => document.getElementById(state.scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" }), 350); }
    else window.scrollTo(0, 0);
  }, [pathname, state]);
  return null;
}
function MainLayout({ children }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#222222] font-sans overflow-x-hidden">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="pt-16 min-h-[70vh]">{children}</motion.main>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

// ============================================================
// Home
// ============================================================
function Hero() {
  const [i, setI] = useState(0); const navigate = useNavigate();
  const next = useCallback(() => setI((x) => (x + 1) % HERO_SLIDES.length), []);
  const prev = () => setI((x) => (x - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  useEffect(() => { const t = setInterval(next, 5500); return () => clearInterval(t); }, [next, i]);
  const s = HERO_SLIDES[i];
  return (
    <section className="relative h-[calc(80dvh-4rem)] min-h-[520px] max-h-[820px] bg-[#242424] overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }}>
          <img src={s.image} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.pos }} onError={(e) => (e.currentTarget.style.display = "none")} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>
      <Container className="relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="max-w-xl text-white">
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#C5A16A] mb-4">New Season 2026</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.08]">{s.title}</h1>
            <p className="mt-5 text-white/80 text-sm sm:text-base max-w-md">{s.text}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => navigate("/shop")} className="px-7 py-3.5 text-sm bg-[#C5A16A] text-[#222222] hover:bg-[#d4b27d] transition-colors">Start Shopping</button>
              <button onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })} className="px-7 py-3.5 text-sm border border-white/70 hover:bg-white hover:text-[#222222] transition-colors">Browse Categories</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
      <div className="absolute bottom-6 left-0 right-0">
        <Container className="flex items-center justify-between">
          <div className="flex gap-2">{HERO_SLIDES.map((_, n) => <button key={n} aria-label={`Slide ${n + 1}`} onClick={() => setI(n)} className={`h-1 transition-all ${n === i ? "w-10 bg-[#C5A16A]" : "w-5 bg-white/50"}`} />)}</div>
          <div className="flex gap-2">
            <button onClick={prev} aria-label="Previous" className="w-11 h-11 border border-white/50 text-white flex items-center justify-center hover:bg-white hover:text-black"><FaChevronLeft size={12} /></button>
            <button onClick={next} aria-label="Next" className="w-11 h-11 border border-white/50 text-white flex items-center justify-center hover:bg-white hover:text-black"><FaChevronRight size={12} /></button>
          </div>
        </Container>
      </div>
    </section>
  );
}
function Trending() {
  const ref = useRef(); const items = HOME_CONFIG.trendingIds.map(findProduct);
  const scroll = (d) => ref.current?.scrollBy({ left: d * (ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <section className="py-16 md:py-24 bg-[#FAF7F1]">
      <Container>
        <SectionHead eyebrow="Most loved" title="Trending Now" text="Pieces our customers are adding to their wardrobes this season." action={
          <div className="flex gap-2">
            <button onClick={() => scroll(-1)} aria-label="Previous" className="w-11 h-11 border border-[#222222] flex items-center justify-center hover:bg-[#222222] hover:text-white"><FaChevronLeft size={12} /></button>
            <button onClick={() => scroll(1)} aria-label="Next" className="w-11 h-11 border border-[#222222] flex items-center justify-center hover:bg-[#222222] hover:text-white"><FaChevronRight size={12} /></button>
          </div>} />
        <div ref={ref} className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((p) => <div key={p.id} className="snap-start shrink-0 w-[70%] sm:w-[40%] md:w-[30%] lg:w-[23.5%]"><ProductCard p={p} /></div>)}
        </div>
      </Container>
    </section>
  );
}
function Home() {
  const featured = HOME_CONFIG.featuredIds.map(findProduct).slice(0, 8);
  const avg = (REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length).toFixed(1);
  return (
    <>
      <Hero />
      <section id="categories" className="py-16 md:py-24"><Container>
        <SectionHead eyebrow="Shop by category" title="Find Your Style" text="From everyday modest wear to festive sets — explore every collection." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {CATEGORIES.map((c, n) => (
            <Reveal key={c.slug} delay={(n % 4) * 0.06}>
              <Link to={`/category/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-[#E8DDCA]">
                <Img src={c.image} alt={c.name} className="w-full h-full transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <h3 className="font-serif text-lg sm:text-2xl leading-tight">{c.name}</h3>
                  <p className="text-xs text-white/75 mt-1 hidden sm:block">{c.desc}</p>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-[#C5A16A] group-hover:gap-3 transition-all">View <FaChevronRight size={8} /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container></section>
      <section className="pb-16 md:pb-24"><Container>
        <SectionHead eyebrow="Handpicked" title="Featured Products" text="Our editors' favourites, chosen for quality and fit." action={<Link to="/shop" className={`px-6 py-3 text-sm ${btnLine}`}>View All Products</Link>} />
        <ProductGrid items={featured} />
      </Container></section>
      <Trending />
      <section className="py-16 md:py-24"><Container>
        <SectionHead eyebrow="Kind words" title="Loved by Our Customers" action={<div className="flex items-center gap-3"><span className="font-serif text-5xl">{avg}</span><div><Stars value={Number(avg)} size={14} /><p className={`text-xs ${MUTED}`}>Average rating</p></div></div>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REVIEWS.map((r, n) => (
            <Reveal key={r.name} delay={n * 0.07} className="bg-white border border-[#E8DDCA] p-6 flex flex-col">
              <Stars value={r.rating} /><p className="mt-4 text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="mt-5 flex items-center gap-3"><Img src={r.image} alt={r.name} className="w-10 h-10 rounded-full" /><div><p className="text-sm font-medium">{r.name}</p><p className={`text-xs ${MUTED}`}>{r.city}</p></div></div>
            </Reveal>
          ))}
        </div>
      </Container></section>
      <section className="pb-4"><Container><div className="bg-[#242424] text-white px-6 py-14 md:py-20 text-center">
        <h2 className="font-serif text-3xl md:text-5xl">{NEWSLETTER.title}</h2>
        <p className="text-white/60 mt-3 max-w-md mx-auto text-sm">{NEWSLETTER.text}</p>
        <div className="max-w-md mx-auto mt-8 text-left"><NewsletterForm dark /></div>
      </div></Container></section>
    </>
  );
}

// ============================================================
// Shop / category listing
// ============================================================
function Shop() {
  const { categorySlug } = useParams(); const [params, setParams] = useSearchParams(); const navigate = useNavigate();
  const [sort, setSort] = useState("newest"); const [filtersOpen, setFiltersOpen] = useState(false);
  const q = params.get("q") || "";
  const cat = CATEGORIES.find((c) => c.slug === categorySlug);
  const items = useMemo(() => {
    let l = PRODUCTS.filter((p) => (!categorySlug || p.category === categorySlug) && (!q || (p.name + catName(p.category) + p.description).toLowerCase().includes(q.toLowerCase())));
    const s = { newest: (a, b) => b.createdAt - a.createdAt, popular: (a, b) => b.popularity - a.popularity, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }[sort];
    return [...l].sort(s);
  }, [categorySlug, q, sort]);
  if (categorySlug && !cat) return <Navigate to="/shop" replace />;
  const clear = () => { setSort("newest"); setParams({}); navigate("/shop"); };
  const chip = (active) => `px-4 py-2 text-xs border whitespace-nowrap transition-colors ${active ? "bg-[#242424] text-white border-[#242424]" : "border-[#E8DDCA] bg-white hover:border-[#C5A16A]"}`;
  const Filters = (
    <div className="space-y-6">
      <div><p className="text-[11px] tracking-[0.25em] uppercase mb-3 text-[#C5A16A]">Categories</p>
        <div className="flex flex-wrap gap-2"><Link to="/shop" className={chip(!categorySlug)}>All</Link>{CATEGORIES.map((c) => <Link key={c.slug} to={`/category/${c.slug}`} className={chip(categorySlug === c.slug)}>{c.name}</Link>)}</div></div>
      <div><p className="text-[11px] tracking-[0.25em] uppercase mb-3 text-[#C5A16A]">Keyword</p>
        <input value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} placeholder="Filter by keyword" className={field} /></div>
      <div><p className="text-[11px] tracking-[0.25em] uppercase mb-3 text-[#C5A16A]">Sort by</p>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={field}>
          <option value="newest">Newest</option><option value="popular">Popularity</option><option value="low">Price: Low to High</option><option value="high">Price: High to Low</option></select></div>
      <button onClick={clear} className={`w-full py-3 text-sm ${btnLine}`}>Clear Filters</button>
    </div>
  );
  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Shop", to: cat ? "/shop" : undefined }, ...(cat ? [{ label: cat.name }] : [])]} />
      <h1 className="font-serif text-4xl md:text-6xl">{cat ? cat.name : "All Products"}</h1>
      <p className={`mt-3 max-w-xl ${MUTED}`}>{cat ? cat.desc : "Browse the full R-Garments collection."}</p>
      <p className="mt-2 text-sm">{items.length} product{items.length !== 1 && "s"}{q && <> matching "<b>{q}</b>"</>}</p>
      <div className="mt-8 grid lg:grid-cols-[260px_1fr] gap-8">
        <div className="lg:hidden">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="w-full flex justify-between items-center bg-white border border-[#E8DDCA] px-4 py-3 text-sm">Filters &amp; Sorting<FaChevronDown size={11} className={filtersOpen ? "rotate-180" : ""} /></button>
          <AnimatePresence>{filtersOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="bg-white border border-t-0 border-[#E8DDCA] p-4">{Filters}</div></motion.div>}</AnimatePresence>
        </div>
        <aside className="hidden lg:block sticky top-24 self-start bg-white border border-[#E8DDCA] p-5">{Filters}</aside>
        <div>
          {items.length ? <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div> : (
            <div className="text-center py-20 bg-white border border-[#E8DDCA]"><p className="font-serif text-2xl">No products found</p><p className={`text-sm mt-2 ${MUTED}`}>Try adjusting your filters.</p><button onClick={clear} className={`mt-6 px-6 py-3 text-sm ${btnDark}`}>Clear Filters</button></div>
          )}
        </div>
      </div>
    </Container>
  );
}

// ============================================================
// Product details
// ============================================================
function ProductPage() {
  const { slug } = useParams(); const p = PRODUCTS.find((x) => x.slug === slug);
  const { addToCart, notify } = useStore(); const navigate = useNavigate();
  const [img, setImg] = useState(0); const [size, setSize] = useState(""); const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState(false); const [guide, setGuide] = useState(false); const [color, setColor] = useState(0);
  useEffect(() => { setImg(0); setSize(p?.sizes.length === 1 ? p.sizes[0] : ""); setQty(1); setColor(0); }, [slug]); // eslint-disable-line
  if (!p) return <Container className="py-24 text-center"><h1 className="font-serif text-4xl">Product not found</h1><Link to="/shop" className={`inline-block mt-6 px-6 py-3 text-sm ${btnDark}`}>Back to Shop</Link></Container>;
  const d = discountPct(p);
  const related = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id).concat(PRODUCTS.filter((x) => x.category !== p.category)).slice(0, HOME_CONFIG.relatedCount);
  const step = (n) => setImg((i) => (i + n + p.images.length) % p.images.length);
  const needSize = () => { if (!size) { notify("Please select a size first", "err"); return false; } return true; };
  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: catName(p.category), to: `/category/${p.category}` }, { label: p.name }]} />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        {/* Gallery */}
        <div className="grid sm:grid-cols-[80px_1fr] gap-3 min-w-0">
          <div className="order-2 sm:order-1 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
            {p.images.map((s, n) => <button key={n} onClick={() => setImg(n)} className={`shrink-0 w-16 sm:w-full aspect-[4/5] border-2 ${n === img ? "border-[#C5A16A]" : "border-transparent"}`}><Img src={s} alt={`View ${n + 1}`} className="w-full h-full" /></button>)}
          </div>
          <div className="order-1 sm:order-2 relative aspect-[4/5] bg-white overflow-hidden group">
            <AnimatePresence mode="wait"><motion.div key={img} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full cursor-zoom-in" onClick={() => setLightbox(true)}><Img src={p.images[img]} alt={p.name} className="w-full h-full" /></motion.div></AnimatePresence>
            <button onClick={() => step(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 flex items-center justify-center"><FaChevronLeft size={12} /></button>
            <button onClick={() => step(1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 flex items-center justify-center"><FaChevronRight size={12} /></button>
            {d > 0 && <span className="absolute top-3 left-3 bg-[#C5A16A] text-xs font-medium px-3 py-1">-{d}%</span>}
          </div>
        </div>
        {/* Info panel */}
        <div className="bg-[#242424] text-white p-6 sm:p-9 self-start min-w-0">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A16A]">{catName(p.category)}</p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-2 leading-tight">{p.name}</h1>
          <div className="flex items-center gap-2 mt-3"><Stars value={p.rating} size={13} /><span className="text-sm text-white/60">{p.rating} · {p.reviews} reviews</span></div>
          <div className="flex items-baseline gap-3 mt-5 flex-wrap"><span className="text-3xl font-semibold">{money(p.price)}</span>{p.oldPrice && <span className="text-white/50 line-through">{money(p.oldPrice)}</span>}{d > 0 && <span className="bg-[#C5A16A] text-[#222222] text-xs px-2 py-1">Save {d}%</span>}</div>
          <p className="mt-5 text-sm text-white/70 leading-relaxed">{p.description}</p>
          <p className={`mt-4 text-sm ${p.stock <= 8 ? "text-[#C5A16A]" : "text-emerald-400"}`}>{p.stock <= 8 ? `Only ${p.stock} left in stock` : `In stock (${p.stock} available)`}</p>
          <div className="mt-6"><p className="text-xs uppercase tracking-widest text-white/60 mb-2">Colour: <span className="text-white">{p.colors[color]}</span></p>
            <div className="flex gap-2 flex-wrap">{p.colors.map((c, n) => <button key={c} onClick={() => setColor(n)} className={`px-4 py-2 text-xs border ${n === color ? "border-[#C5A16A] text-[#C5A16A]" : "border-white/25"}`}>{c}</button>)}</div></div>
          <div className="mt-6">
            <div className="flex justify-between mb-2"><p className="text-xs uppercase tracking-widest text-white/60">Size</p><button onClick={() => setGuide(true)} className="text-xs underline text-[#C5A16A]">Size guide</button></div>
            <div className="flex gap-2 flex-wrap">{p.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={`min-w-[48px] h-11 px-3 text-sm border transition-colors ${size === s ? "bg-white text-[#222222] border-white" : "border-white/25 hover:border-white"}`}>{s}</button>)}</div>
          </div>
          <div className="mt-6 flex items-center gap-4"><p className="text-xs uppercase tracking-widest text-white/60">Quantity</p>
            <div className="flex items-center border border-white/25">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease" className="w-11 h-11 flex items-center justify-center"><FaMinus size={10} /></button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(p.stock, qty + 1))} aria-label="Increase" className="w-11 h-11 flex items-center justify-center"><FaPlus size={10} /></button></div></div>
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => needSize() && addToCart(p.id, size, qty)} className="py-4 text-sm border border-white hover:bg-white hover:text-[#222222] transition-colors">Add to Cart</motion.button>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (needSize()) { addToCart(p.id, size, qty, true); navigate("/checkout"); } }} className="py-4 text-sm bg-[#C5A16A] text-[#222222] hover:bg-[#d4b27d] transition-colors">Buy Now</motion.button>
          </div>
        </div>
      </div>
      {/* Accordions */}
      <div className="mt-12 max-w-3xl border-t border-[#E8DDCA]">
        <Accordion title="Product Description" defaultOpen>{p.description}</Accordion>
        <Accordion title="Fabric & Fit">{p.fabric}. Colours available: {p.colors.join(", ")}. Sizes: {p.sizes.join(", ")}.</Accordion>
        <Accordion title="Size Guide"><SizeTable /></Accordion>
        {INFO_SECTIONS.map((s) => <Accordion key={s.title} title={s.title}>{s.text}</Accordion>)}
      </div>
      <section className="mt-20"><SectionHead eyebrow="You may also like" title="Similar Products" /><ProductGrid items={related} /></section>
      {/* Lightbox */}
      <AnimatePresence>{lightbox && (
        <motion.div className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white w-11 h-11" aria-label="Close"><FaTimes size={22} /></button>
          <button onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 text-white w-11 h-11" aria-label="Previous"><FaChevronLeft /></button>
          <img src={p.images[img]} alt={p.name} className="max-h-[90vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); step(1); }} className="absolute right-3 text-white w-11 h-11" aria-label="Next"><FaChevronRight /></button>
        </motion.div>)}</AnimatePresence>
      <AnimatePresence>{guide && (
        <motion.div className="fixed inset-0 z-[95] bg-black/60 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setGuide(false)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-[#FFFCF7] p-6 max-w-md w-full">
            <div className="flex justify-between mb-4"><h3 className="font-serif text-2xl">Size Guide</h3><button onClick={() => setGuide(false)} aria-label="Close"><FaTimes /></button></div><SizeTable />
          </motion.div></motion.div>)}</AnimatePresence>
    </Container>
  );
}
const SizeTable = () => (
  <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{SIZE_CHART.headers.map((h) => <th key={h} className="py-2 pr-4 font-medium text-[#222222]">{h}</th>)}</tr></thead>
    <tbody>{SIZE_CHART.rows.map((r) => <tr key={r[0]} className="border-t border-[#E8DDCA]">{r.map((c, i) => <td key={i} className="py-2 pr-4">{c}</td>)}</tr>)}</tbody></table>
    <p className="text-xs mt-3">{SIZE_CHART.note}</p></div>
);

// ============================================================
// Cart
// ============================================================
const QtyControl = ({ qty, onChange }) => (
  <div className="inline-flex items-center border border-[#E8DDCA] bg-white">
    <button onClick={() => onChange(qty - 1)} aria-label="Decrease" className="w-9 h-9 flex items-center justify-center"><FaMinus size={9} /></button>
    <span className="w-8 text-center text-sm">{qty}</span>
    <button onClick={() => onChange(qty + 1)} aria-label="Increase" className="w-9 h-9 flex items-center justify-center"><FaPlus size={9} /></button>
  </div>
);
function CartPage() {
  const { lines, subtotal, setQty, removeItem } = useStore();
  if (!lines.length) return (
    <Container className="py-24 text-center"><FaShoppingBag size={42} className="mx-auto text-[#C5A16A]" /><h1 className="font-serif text-4xl mt-6">Your cart is empty</h1><p className={`mt-2 ${MUTED}`}>Discover something you will love.</p><Link to="/shop" className={`inline-block mt-8 px-8 py-3.5 text-sm ${btnDark}`}>Start Shopping</Link></Container>
  );
  return (
    <Container className="py-8 md:py-12">
      <h1 className="font-serif text-4xl md:text-5xl mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-3">
          <AnimatePresence>{lines.map((l) => (
            <motion.div layout key={l.id + l.size} exit={{ opacity: 0, x: -30 }} className="bg-white border border-[#E8DDCA] p-3 sm:p-4 flex gap-4">
              <Link to={`/product/${l.product.slug}`}><Img src={l.product.images[0]} alt={l.product.name} className="w-20 sm:w-28 aspect-[4/5]" /></Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2"><Link to={`/product/${l.product.slug}`} className="font-serif text-lg leading-tight">{l.product.name}</Link>
                  <button onClick={() => removeItem(l.id, l.size)} aria-label="Remove" className="text-[#77736C] hover:text-red-600 p-1"><FaTrashAlt size={14} /></button></div>
                <p className={`text-xs mt-1 ${MUTED}`}>Size: {l.size} · {money(l.product.price)} each</p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2"><QtyControl qty={l.qty} onChange={(n) => setQty(l.id, l.size, n)} /><p className="font-semibold">{money(l.product.price * l.qty)}</p></div>
              </div>
            </motion.div>))}</AnimatePresence>
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm mt-2 hover:text-[#C5A16A]"><FaChevronLeft size={10} />Continue Shopping</Link>
        </div>
        <div className="bg-white border border-[#E8DDCA] p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm py-2"><span className={MUTED}>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-sm py-2"><span className={MUTED}>Delivery</span><span className={MUTED}>Selected at checkout (৳{DELIVERY_ZONES[0].fee}–৳{DELIVERY_ZONES[1].fee})</span></div>
          <div className="flex justify-between font-semibold text-lg py-3 border-t border-[#E8DDCA] mt-2"><span>Total</span><span>{money(subtotal)}+</span></div>
          <Link to="/checkout" className={`block text-center py-4 text-sm mt-2 ${btnDark}`}>Proceed to Checkout</Link>
        </div>
      </div>
    </Container>
  );
}

// ============================================================
// Checkout
// ============================================================
function Field({ label, error, children }) {
  return <label className="block"><span className="text-xs uppercase tracking-widest text-[#77736C]">{label}</span><div className="mt-2">{children}</div>{error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}</label>;
}
function Step({ n, title, children }) {
  return <section className="bg-white border border-[#E8DDCA] p-5 sm:p-7"><div className="flex items-center gap-3 mb-5"><span className="w-9 h-9 rounded-full bg-[#242424] text-[#C5A16A] text-xs flex items-center justify-center">{n}</span><h2 className="font-serif text-2xl">{title}</h2></div>{children}</section>;
}
function Checkout() {
  const { lines, subtotal, count, removeItem, clearCart, orders, setOrders, notify } = useStore(); const navigate = useNavigate();
  const [f, setF] = useState({ name: "", phone: "", email: "", news: false, address: "", area: "", note: "" });
  const [zone, setZone] = useState(""); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false); const [code, setCode] = useState(""); const [coupon, setCoupon] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const fee = DELIVERY_ZONES.find((z) => z.id === zone)?.fee ?? 0;
  const discount = coupon ? Math.min(subtotal, coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value) : 0;
  const total = subtotal - discount + fee;
  const applyCoupon = () => { const c = COUPONS[code.trim().toUpperCase()]; if (c) { setCoupon({ ...c, code: code.trim().toUpperCase() }); notify(`Coupon applied: ${c.label}`); } else notify("Invalid coupon code", "err"); };

  const place = (e) => {
    e.preventDefault(); if (busy) return;
    const er = {};
    if (!f.name.trim()) er.name = "Please enter your full name.";
    if (!phoneOk(f.phone)) er.phone = "Enter a valid Bangladesh mobile number (e.g. 017XXXXXXXX).";
    if (f.email && !emailOk(f.email)) er.email = "Please enter a valid email address.";
    if (!f.address.trim()) er.address = "Please enter your delivery address.";
    if (!zone) er.zone = "Please select a delivery zone.";
    if (!lines.length) er.cart = "Your cart is empty.";
    setErrors(er);
    if (Object.keys(er).length) { notify(er.cart || "Please fix the highlighted fields", "err"); return; }
    setBusy(true);
    const id = `RG${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
    const order = {
      id, date: new Date().toISOString(), status: 0, cancelled: false, payment: "Cash on Delivery",
      customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() }, address: f.address.trim(), area: f.area.trim(), note: f.note.trim(),
      zone: DELIVERY_ZONES.find((z) => z.id === zone).label, subtotal, discount, coupon: coupon?.code || null, deliveryFee: fee, total,
      items: lines.map((l) => ({ id: l.id, name: l.product.name, image: l.product.images[0], size: l.size, qty: l.qty, price: l.product.price })),
    };
    setOrders([order, ...orders]); clearCart();
    setTimeout(() => navigate(`/order-success/${id}`, { replace: true }), 250);
  };
  const inp = (k) => `${field} ${errors[k] ? "!border-red-500" : ""}`;
  if (!lines.length && !busy) return <Container className="py-24 text-center"><h1 className="font-serif text-4xl">Nothing to check out</h1><Link to="/shop" className={`inline-block mt-6 px-8 py-3.5 text-sm ${btnDark}`}>Start Shopping</Link></Container>;
  return (
    <Container className="py-6 md:py-10">
      <div className="bg-[#242424] text-white p-6 sm:p-10 mb-8">
        <div className="flex justify-between items-center text-xs"><Link to="/cart" className="flex items-center gap-2 text-white/70 hover:text-white"><FaChevronLeft size={9} />Back to Cart</Link><span className="flex items-center gap-2 text-[#C5A16A] tracking-widest uppercase"><FaLock size={10} />Secure Checkout</span></div>
        <h1 className="font-serif text-3xl sm:text-5xl mt-6">Complete Your Order</h1>
      </div>
      <form onSubmit={place} noValidate className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="space-y-5 min-w-0">
          <Step n="01" title="Contact Details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name *" error={errors.name}><input value={f.name} onChange={set("name")} className={inp("name")} placeholder="Your full name" /></Field>
              <Field label="Phone Number *" error={errors.phone}><input value={f.phone} onChange={set("phone")} inputMode="tel" className={inp("phone")} placeholder="01XXXXXXXXX" /></Field>
              <div className="sm:col-span-2"><Field label="Email (optional)" error={errors.email}><input value={f.email} onChange={set("email")} className={inp("email")} placeholder="you@example.com" /></Field></div>
            </div>
            <label className="flex items-center gap-2 mt-4 text-sm"><input type="checkbox" checked={f.news} onChange={set("news")} className="accent-[#C5A16A] w-4 h-4" />Send me news and offers</label>
          </Step>
          <Step n="02" title="Delivery Address">
            <div className="space-y-4">
              <Field label="Full Address *" error={errors.address}><textarea rows={3} value={f.address} onChange={set("address")} className={inp("address")} placeholder="House, road, area, city" /></Field>
              <Field label="Area / Landmark"><input value={f.area} onChange={set("area")} className={field} placeholder="Neighbourhood or nearby landmark" /></Field>
              <Field label="Order Note (optional)"><input value={f.note} onChange={set("note")} className={field} placeholder="Any special instructions" /></Field>
            </div>
            <p className="text-xs uppercase tracking-widest text-[#77736C] mt-6 mb-3">Delivery Zone *</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {DELIVERY_ZONES.map((z) => (
                <button type="button" key={z.id} onClick={() => setZone(z.id)} className={`text-left p-4 border-2 transition-colors ${zone === z.id ? "border-[#C5A16A] bg-[#FAF7F1]" : "border-[#E8DDCA]"}`}>
                  <div className="flex justify-between"><b className="font-medium">{z.label}</b><span className="font-semibold">{money(z.fee)}</span></div><p className={`text-xs mt-1 ${MUTED}`}>{z.note}</p>
                </button>))}
            </div>
            {errors.zone && <p className="text-xs text-red-600 mt-2">{errors.zone}</p>}
          </Step>
          <Step n="03" title="Payment">
            <div className="border-2 border-[#C5A16A] bg-[#FAF7F1] p-4 flex items-start gap-3"><FaCheckCircle className="text-[#C5A16A] mt-0.5" /><div><b className="font-medium">Cash on Delivery</b><p className={`text-sm ${MUTED}`}>Pay in cash when your order arrives.</p></div></div>
          </Step>
        </div>
        {/* Summary */}
        <aside className="bg-[#242424] text-white p-6 lg:sticky lg:top-6">
          <h2 className="font-serif text-2xl mb-5">Order Summary <span className="text-sm text-white/50">({count})</span></h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {lines.map((l) => (
              <div key={l.id + l.size} className="flex gap-3"><Img src={l.product.images[0]} alt={l.product.name} className="w-14 aspect-[4/5]" />
                <div className="flex-1 min-w-0 text-sm"><p className="leading-tight">{l.product.name}</p><p className="text-xs text-white/50 mt-1">Size {l.size} · Qty {l.qty} · {money(l.product.price)}</p>
                  <button type="button" onClick={() => removeItem(l.id, l.size)} className="text-xs text-[#C5A16A] mt-1 underline">Remove</button></div>
                <p className="text-sm">{money(l.product.price * l.qty)}</p></div>))}
          </div>
          <div className="mt-5 border-t border-white/15 pt-4">
            <button type="button" onClick={() => setCouponOpen(!couponOpen)} className="text-sm text-[#C5A16A] flex items-center gap-2">Have a coupon?<FaChevronDown size={9} className={couponOpen ? "rotate-180" : ""} /></button>
            <AnimatePresence>{couponOpen && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden"><div className="flex gap-2 pt-3">
              <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Try WELCOME10" className="flex-1 min-w-0 bg-white/10 border border-white/20 px-3 py-2.5 text-sm outline-none" />
              <button type="button" onClick={applyCoupon} className="px-4 text-sm bg-[#C5A16A] text-[#222222]">Apply</button></div></motion.div>}</AnimatePresence>
          </div>
          <dl className="mt-5 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-white/60">Subtotal</dt><dd>{money(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald-400"><dt>Coupon ({coupon.code})</dt><dd>-{money(discount)}</dd></div>}
            <div className="flex justify-between"><dt className="text-white/60">Delivery</dt><dd>{zone ? money(fee) : "Select zone"}</dd></div>
            <div className="flex justify-between text-xl font-semibold pt-3 border-t border-white/15"><dt>Total</dt><dd>{money(total)}</dd></div>
          </dl>
          <motion.button whileTap={{ scale: 0.98 }} disabled={busy} className="w-full mt-6 py-4 text-sm bg-[#C5A16A] text-[#222222] hover:bg-[#d4b27d] disabled:opacity-60 flex items-center justify-center gap-2"><FaLock size={12} />{busy ? "Placing order..." : "Place Order"}</motion.button>
        </aside>
      </form>
    </Container>
  );
}

// ============================================================
// Order success + My Orders
// ============================================================
function OrderSuccess() {
  const { orderId } = useParams(); const { orders } = useStore(); const o = orders.find((x) => x.id === orderId);
  if (!o) return <Container className="py-24 text-center"><h1 className="font-serif text-4xl">Order not found</h1><Link to="/my-orders" className={`inline-block mt-6 px-8 py-3.5 text-sm ${btnDark}`}>My Orders</Link></Container>;
  const row = (l, v) => <div className="flex justify-between gap-6 py-3 border-b border-[#E8DDCA] text-sm"><span className={MUTED}>{l}</span><span className="text-right">{v}</span></div>;
  return (
    <Container className="py-12 md:py-20 max-w-2xl text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}><FaCheckCircle size={64} className="mx-auto text-[#C5A16A]" /></motion.div>
      <h1 className="font-serif text-3xl sm:text-5xl mt-6">Your Order Has Been Placed!</h1>
      <p className={`mt-3 ${MUTED}`}>Thank you, {o.customer.name}. We'll call to confirm your order shortly.</p>
      <div className="bg-white border border-[#E8DDCA] p-6 mt-8 text-left">
        {row("Order ID", <b>{o.id}</b>)}{row("Customer", o.customer.name)}{row("Total", <b>{money(o.total)}</b>)}{row("Payment", o.payment)}{row("Delivery address", o.address + (o.area ? `, ${o.area}` : ""))}
        {row("Estimated delivery", o.zone === "Dhaka City" ? "1–2 working days" : "3–5 working days")}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/my-orders" className={`px-7 py-3.5 text-sm ${btnDark}`}>View My Orders</Link><Link to="/shop" className={`px-7 py-3.5 text-sm ${btnLine}`}>Continue Shopping</Link></div>
    </Container>
  );
}
function MyOrders() {
  const { orders, setOrders, notify } = useStore();
  const update = (id, patch) => setOrders(orders.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  if (!orders.length) return <Container className="py-24 text-center"><FaBoxOpen size={44} className="mx-auto text-[#C5A16A]" /><h1 className="font-serif text-4xl mt-6">No orders yet</h1><p className={`mt-2 ${MUTED}`}>Your placed orders will appear here.</p><Link to="/shop" className={`inline-block mt-8 px-8 py-3.5 text-sm ${btnDark}`}>Start Shopping</Link></Container>;
  return (
    <Container className="py-8 md:py-12 max-w-4xl">
      <h1 className="font-serif text-4xl md:text-5xl">My Orders</h1>
      <p className={`text-xs mt-2 ${MUTED}`}>Demo only: this store has no backend, so statuses are simulated on this device.</p>
      <div className="mt-8 space-y-5">
        {orders.map((o) => (
          <div key={o.id} className="bg-white border border-[#E8DDCA] p-5 sm:p-6">
            <div className="flex flex-wrap justify-between gap-3 pb-4 border-b border-[#E8DDCA]">
              <div><p className="font-medium">{o.id}</p><p className={`text-xs ${MUTED}`}>{new Date(o.date).toLocaleString()}</p></div>
              <div className="text-right"><p className="font-semibold">{money(o.total)}</p><p className={`text-xs ${MUTED}`}>{o.payment}</p></div>
            </div>
            <div className="py-4 space-y-3">{o.items.map((it, n) => <div key={n} className="flex gap-3 items-center"><Img src={it.image} alt={it.name} className="w-14 aspect-[4/5]" /><div className="text-sm"><p>{it.name}</p><p className={`text-xs ${MUTED}`}>Size {it.size} · Qty {it.qty}</p></div></div>)}</div>
            {o.cancelled ? <p className="text-sm text-red-600 font-medium">Status: Cancelled</p> : (
              <div className="flex items-start">{ORDER_STATUSES.map((s, n) => (
                <div key={s} className="flex-1 flex flex-col items-center text-center relative">
                  {n > 0 && <span className={`absolute top-3 right-1/2 w-full h-0.5 ${n <= o.status ? "bg-[#C5A16A]" : "bg-[#E8DDCA]"}`} />}
                  <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${n <= o.status ? "bg-[#C5A16A] text-[#222222]" : "bg-[#E8DDCA]"}`}>{n <= o.status ? "✓" : n + 1}</span>
                  <span className={`text-[10px] sm:text-xs mt-2 ${n <= o.status ? INK : MUTED}`}>{s}</span></div>))}</div>)}
            {!o.cancelled && o.status < 3 && (
              <div className="flex gap-3 mt-5 text-xs">
                <button onClick={() => { update(o.id, { status: o.status + 1 }); notify("Demo status updated"); }} className={`px-4 py-2 ${btnLine}`}>Advance status (demo)</button>
                {o.status === 0 && <button onClick={() => { update(o.id, { cancelled: true }); notify("Order cancelled"); }} className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50">Cancel order</button>}
              </div>)}
          </div>
        ))}
      </div>
    </Container>
  );
}

// ============================================================
// About + Contact
// ============================================================
function About() {
  const { notify } = useStore();
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" }); const [er, setEr] = useState({});
  const submit = (e) => {
    e.preventDefault(); const x = {};
    if (!f.name.trim()) x.name = "Name is required."; if (!emailOk(f.email)) x.email = "Enter a valid email."; if (!f.subject.trim()) x.subject = "Subject is required."; if (f.message.trim().length < 10) x.message = "Message should be at least 10 characters.";
    setEr(x); if (Object.keys(x).length) return;
    setF({ name: "", email: "", subject: "", message: "" }); notify("Message sent! We'll reply soon. (demo)");
  };
  const pillars = [["Our Mission", "To make beautiful, modest and modern clothing accessible to every woman in Bangladesh."], ["Our Vision", "To become the most trusted name in women's fashion — known for quality and care."], ["Product Quality", "Every garment is checked for fabric, stitching and finish before it leaves us."], ["Customer Satisfaction", "Easy exchanges, honest sizing and responsive support, always."]];
  return (
    <>
      <Container className="py-12 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
        <Reveal><p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A16A] mb-3">About {BRAND.name}</p><h1 className="font-serif text-4xl md:text-6xl leading-tight">Dressed with intention, made with care.</h1>
          <p className={`mt-6 leading-relaxed ${MUTED}`}>{BRAND.name} began with a simple idea: everyday clothing can be both modest and beautiful. We work with trusted makers to design pieces — from borka and abaya to kurti and festive sets — that fit real lives.</p>
          <p className={`mt-4 leading-relaxed ${MUTED}`}>We pick fabrics for comfort in Bangladesh's climate and finish every piece with details you'll notice and love.</p></Reveal>
        <Reveal><div className="grid grid-cols-2 gap-3"><Img src={CATEGORIES[1].image} alt="Abaya collection" className="w-full aspect-[4/5]" /><Img src={CATEGORIES[3].image} alt="Kurti collection" className="w-full aspect-[4/5] mt-8" /></div></Reveal>
      </Container>
      <section className="bg-[#FAF7F1] py-16"><Container><SectionHead eyebrow="Why shop with us" title="What We Stand For" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{pillars.map(([t, d]) => <Reveal key={t} className="bg-white border border-[#E8DDCA] p-6"><h3 className="font-serif text-xl">{t}</h3><p className={`text-sm mt-3 leading-relaxed ${MUTED}`}>{d}</p></Reveal>)}</div></Container></section>
      <section id="contact" className="py-16 md:py-24 scroll-mt-20"><Container className="grid lg:grid-cols-2 gap-10">
        <div><SectionHead eyebrow="Get in touch" title="Contact Us" text="Questions about sizing, orders or exchanges? We're happy to help." />
          <ul className="space-y-4 text-sm">
            <li><span className={`block text-xs uppercase tracking-widest ${MUTED}`}>Phone</span><a href={`tel:${CONTACT.phone}`} className="hover:text-[#C5A16A]">{CONTACT.phoneDisplay}</a></li>
            <li><span className={`block text-xs uppercase tracking-widest ${MUTED}`}>Email</span><a href={`mailto:${CONTACT.email}`} className="hover:text-[#C5A16A]">{CONTACT.email}</a></li>
            <li><span className={`block text-xs uppercase tracking-widest ${MUTED}`}>Address</span>{CONTACT.address}</li>
            <li><span className={`block text-xs uppercase tracking-widest ${MUTED}`}>Hours</span>{CONTACT.hours}</li>
          </ul>
          <div className="flex gap-3 mt-6"><a href={CONTACT.facebook} target="_blank" rel="noreferrer" className={`px-5 py-3 text-sm flex items-center gap-2 ${btnLine}`}><FaFacebookF size={12} />Facebook</a><a href={CONTACT.whatsapp} target="_blank" rel="noreferrer" className={`px-5 py-3 text-sm flex items-center gap-2 ${btnDark}`}><FaWhatsapp />WhatsApp</a></div></div>
        <form onSubmit={submit} noValidate className="bg-white border border-[#E8DDCA] p-6 space-y-4">
          <Field label="Name" error={er.name}><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={field} /></Field>
          <Field label="Email" error={er.email}><input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={field} /></Field>
          <Field label="Subject" error={er.subject}><input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={field} /></Field>
          <Field label="Message" error={er.message}><textarea rows={5} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} className={field} /></Field>
          <button className={`w-full py-3.5 text-sm ${btnDark}`}>Send Message</button>
        </form>
      </Container></section>
    </>
  );
}

// ============================================================
// App + routing
// ============================================================
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <StoreProvider>
          <ScrollManager />
          <Routes>
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/shop" element={<MainLayout><Shop /></MainLayout>} />
            <Route path="/category/:categorySlug" element={<MainLayout><Shop /></MainLayout>} />
            <Route path="/product/:slug" element={<MainLayout><ProductPage /></MainLayout>} />
            <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
            <Route path="/checkout" element={<div className="min-h-screen bg-[#F5F0E7] text-[#222222]"><div className="py-4 text-center border-b border-[#E8DDCA] bg-[#FFFCF7]"><Link to="/" className="font-serif text-2xl">{BRAND.name}</Link></div><Checkout /></div>} />
            <Route path="/order-success/:orderId" element={<MainLayout><OrderSuccess /></MainLayout>} />
            <Route path="/my-orders" element={<MainLayout><MyOrders /></MainLayout>} />
            <Route path="/about" element={<MainLayout><About /></MainLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <SearchModal />
          <Toast />
        </StoreProvider>
      </HashRouter>
    </MotionConfig>
  );
}