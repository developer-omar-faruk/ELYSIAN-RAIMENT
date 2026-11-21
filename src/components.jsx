import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaBars, FaTimes, FaSearch, FaShoppingBag, FaBoxOpen, FaChevronRight, FaChevronDown, FaPhoneAlt, FaFacebookF, FaInstagram, FaWhatsapp, FaRegUser } from "react-icons/fa";
import { NAV, FOOTER_SUPPORT } from "./data.js";
import { useStore } from "./store.jsx";
import { money, discountPct, Img, Stars, Container, NewsletterForm, MUTED, btnDark, btnLine } from "./ui.jsx";

// ---------- Product card ----------
export function ProductCard({ p, priority = false }) {
  const { addToCart, catName } = useStore();
  const navigate = useNavigate();
  const d = discountPct(p);
  const out = p.stock < 1;
  const quick = p.sizes.length === 1 && p.colors.length === 1 ? { size: p.sizes[0], color: p.colors[0] } : null;
  const open = () => navigate(`/product/${p.slug}`);
  return (
    <motion.article whileHover={{ y: -4 }} className="group rounded-md bg-white border border-[#C5A653] flex flex-col h-full">
      <Link to={`/product/${p.slug}`} className="relative rounded-t-md block overflow-hidden aspect-[4/5] bg-[#FAF7F1]">
        <Img src={p.images[0]} alt={p.name} priority={priority} className="w-full h-full transition-transform duration-700 group-hover:scale-105" />
        {p.images[1] && <Img src={p.images[1]} alt="" className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block" />}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {out && <span className="bg-red-700 text-white text-[10px] tracking-wider uppercase px-2 py-1">Sold out</span>}
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
          {p.oldPrice > p.price && <span className={`text-xs line-through ${MUTED}`}>{money(p.oldPrice)}</span>}
        </div>
        <div className="mt-auto pt-3 grid grid-cols-2 gap-2">
          <motion.button disabled={out} whileTap={{ scale: 0.96 }} onClick={() => (quick ? addToCart(p.id, quick.size, quick.color) : open())} className={`py-2.5 text-xs disabled:opacity-40 ${btnLine}`}>{out ? "Sold out" : "Add to Cart"}</motion.button>
          <motion.button disabled={out} whileTap={{ scale: 0.96 }} onClick={() => (quick ? (addToCart(p.id, quick.size, quick.color, 1, true), navigate("/checkout")) : open())} className={`py-2.5 text-xs disabled:opacity-40 ${btnDark}`}>Buy Now</motion.button>
        </div>
      </div>
    </motion.article>
  );
}
export const ProductGrid = ({ items }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
);

// ---------- Search ----------
function SearchModal() {
  const { searchOpen, setSearchOpen, products, catName } = useStore();
  const [q, setQ] = useState(""); const navigate = useNavigate(); const ref = useRef();
  useEffect(() => {
    if (!searchOpen) { setQ(""); return; }
    const timer = setTimeout(() => ref.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [searchOpen]);
  useEffect(() => { const f = (e) => e.key === "Escape" && setSearchOpen(false); window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [setSearchOpen]);
  const searchIndex = useMemo(() => products.map((p) => ({
    product: p,
    text: (p.name + catName(p.category)).toLowerCase(),
  })), [products, catName]);
  const results = useMemo(() => {
    if (!q.trim()) return [];
    const query = q.toLowerCase();
    const matches = [];
    for (const item of searchIndex) {
      if (item.text.includes(query)) {
        matches.push(item.product);
        if (matches.length === 6) break;
      }
    }
    return matches;
  }, [q, searchIndex]);
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
              {!q.trim() && <p className={`p-6 text-sm ${MUTED}`}>Search by product name or category.</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Mobile drawer ----------
function MobileDrawer({ open, onClose }) {
  const [catOpen, setCatOpen] = useState(false);
  const { setSearchOpen, categories, contact } = useStore(); const navigate = useNavigate();
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
                  {categories.map((c) => (
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
                <FaRegUser size={18} /><span className="flex-1"><b className="block font-medium">My Orders</b><span className={`text-xs ${MUTED}`}>Track your orders</span></span><FaChevronRight size={11} />
              </button>
            </div>
            {contact.phone && <div className="mt-8 pt-6 border-t border-[#E8DDCA]">
              <p className={`text-xs ${MUTED}`}>Need styling help?</p>
              <a href={`tel:${contact.phone}`} className="mt-1 inline-flex items-center gap-2 font-medium"><FaPhoneAlt size={12} />{contact.phoneDisplay || contact.phone}</a>
            </div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------- Navbar ----------
function Navbar() {
  const { count, setSearchOpen, categories, brand } = useStore();
  const [scrolled, setScrolled] = useState(false); const [drawer, setDrawer] = useState(false); const [dd, setDd] = useState(false);
  const loc = useLocation();
  useEffect(() => { const f = () => setScrolled(window.scrollY > 10); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  useEffect(() => setDd(false), [loc.pathname]);
  const closeDrawer = useCallback(() => setDrawer(false), []);
  const link = ({ isActive }) => `text-sm tracking-wide transition-colors ${isActive ? "text-[#C5A16A]" : "hover:text-[#C5A16A]"}`;
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-[60] h-16 bg-[#FFFCF7]/95 backdrop-blur border-b transition-all duration-300 ${scrolled ? "border-[#E8DDCA] shadow-sm" : "border-transparent"}`}>
        <Container className="h-full flex items-center justify-between">
          <button className="lg:hidden w-10 h-10 flex items-center justify-center -ml-2" onClick={() => setDrawer(true)} aria-label="Open menu"><FaBars size={19} /></button>
          <Link to="/" className="font-serif text-xl tracking-tight absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0">
            {brand.logo ? <img src={brand.logo} alt={brand.name} className="h-9 object-contain" /> : brand.name}
          </Link>
          <nav className="hidden lg:flex items-center gap-9">
            <div className="relative" onMouseEnter={() => setDd(true)} onMouseLeave={() => setDd(false)}>
              <button onClick={() => setDd(!dd)} className="text-sm tracking-wide hover:text-[#C5A16A] flex items-center gap-1.5 h-16">Categories<FaChevronDown size={9} className={`transition-transform ${dd ? "rotate-180" : ""}`} /></button>
              <AnimatePresence>
                {dd && (
                  <motion.ul initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute left-0 top-full w-60 bg-white border border-[#E8DDCA] shadow-xl py-2">
                    {categories.map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`} className="block px-5 py-2.5 text-sm hover:bg-[#F5F0E7] hover:text-[#C5A16A]">{c.name}</Link></li>)}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
            {NAV.map((n) => <NavLink key={n.to} to={n.to} end className={link}>{n.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-0.5">
            <button onClick={() => setSearchOpen(true)} aria-label="Search" className="w-10 h-10 flex items-center justify-center"><FaSearch size={16} /></button>
            <Link to="/cart" aria-label="Cart" className="relative w-10 h-10 flex items-center justify-center">
              <FaShoppingBag size={17} />
              {count > 0 && <span className="absolute top-0.5 right-0 min-w-[18px] h-[18px] px-1 rounded-full bg-[#C5A16A] text-[10px] text-[#222222] flex items-center justify-center font-semibold">{count}</span>}
            </Link>
            <Link to="/my-orders" aria-label="My Orders" className="hidden lg:flex w-10 h-10 items-center justify-center"><FaBoxOpen size={18} /></Link>
          </div>
        </Container>
      </header>
      <MobileDrawer open={drawer} onClose={closeDrawer} />
    </>
  );
}

// ---------- Footer ----------
function Footer() {
  const navigate = useNavigate();
  const { brand, contact, categories } = useStore();
  const h = "text-[11px] tracking-[0.25em] uppercase text-[#C5A16A] mb-4";
  const li = "text-sm text-white/70 hover:text-white transition-colors text-left";
  const socials = [[FaFacebookF, contact.facebook, "Facebook"], [FaInstagram, contact.instagram, "Instagram"], [FaWhatsapp, contact.whatsapp, "WhatsApp"]].filter((s) => s[1]);
  return (
    <footer className="bg-[#242424] text-white mt-24">
      <Container className="py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="font-serif text-3xl">{brand.name}</p>
          <p className="text-sm text-white/60 mt-3 leading-relaxed">{brand.description}</p>
          <div className="flex gap-3 mt-5">
            {socials.map(([I, href, l]) => <a key={l} href={href} target="_blank" rel="noreferrer" aria-label={l} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:bg-[#C5A16A] hover:text-[#222222] transition-colors"><I size={14} /></a>)}
          </div>
        </div>
        <div><h4 className={h}>Quick Links</h4><ul className="space-y-2.5">
          {[["Home", "/"], ["All Products", "/shop"], ["About", "/about"], ["My Orders", "/my-orders"]].map(([l, t]) => <li key={l}><Link to={t} className={li}>{l}</Link></li>)}</ul></div>
        <div><h4 className={h}>Categories</h4><ul className="space-y-2.5">
          {categories.map((c) => <li key={c.slug}><Link to={`/category/${c.slug}`} className={li}>{c.name.split(" /")[0].replace("Two-piece & Three-piece", "Sets")}</Link></li>)}</ul></div>
        <div><h4 className={h}>Customer Support</h4><ul className="space-y-2.5">
          <li><button className={li} onClick={() => navigate("/about", { state: { scrollTo: "contact" } })}>Contact Us</button></li>
          {FOOTER_SUPPORT.map((s) => <li key={s}><button className={li} onClick={() => navigate("/about")}>{s}</button></li>)}</ul></div>
        <div><h4 className={h}>Newsletter</h4><p className="text-sm text-white/60 mb-4">Be first to hear about new arrivals.</p><NewsletterForm dark /></div>
      </Container>
      <div className="border-t border-white/10"><Container className="py-5 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/50">
        <p>© {new Date().getFullYear()} {brand.name}. All rights reserved.</p><p>Cash on Delivery available across Bangladesh</p></Container></div>
    </footer>
  );
}

// ---------- Layout ----------
export function ScrollManager() {
  const { pathname, state } = useLocation();
  useEffect(() => {
    if (state?.scrollTo) setTimeout(() => document.getElementById(state.scrollTo)?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
    else window.scrollTo(0, 0);
  }, [pathname, state]);
  return null;
}
export function MainLayout({ children }) {
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#222222] font-sans overflow-x-hidden">
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main key={loc.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="pt-16 min-h-[70vh]">{children}</motion.main>
      </AnimatePresence>
      <Footer />
      <SearchModal />
    </div>
  );
}
export { btnDark, btnLine };