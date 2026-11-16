import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { useStore } from "../store.jsx";
import { Img, Stars, Reveal, Container, SectionHead, NewsletterForm, MUTED, btnLine } from "../ui.jsx";
import { ProductCard, ProductGrid } from "../components.jsx";

function Hero() {
  const { banners, brand } = useStore();
  const [i, setI] = useState(0); const navigate = useNavigate();
  const slides = banners.length ? banners : [{ image: "", title: brand.name, text: brand.tagline || "", pos: "center", button: "Start Shopping", link: "/shop" }];
  const n = slides.length;
  const next = useCallback(() => setI((x) => (x + 1) % n), [n]);
  const prev = () => setI((x) => (x - 1 + n) % n);
  useEffect(() => { if (n < 2) return; const t = setInterval(next, 5500); return () => clearInterval(t); }, [next, i, n]);
  const idx = i % n, s = slides[idx];
  const go = () => { const l = s.link || "/shop"; if (/^https?:\/\//i.test(l)) window.open(l, "_blank", "noopener"); else navigate(l.startsWith("/") ? l : "/shop"); };
  return (
    <section className="relative h-[calc(80dvh-4rem)] min-h-[520px] max-h-[820px] bg-[#242424] overflow-hidden">
      <AnimatePresence mode="sync">
        <motion.div key={idx} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1 }}>
          {s.image && <img src={s.image} alt="" className="w-full h-full object-cover" style={{ objectPosition: s.pos }} onError={(e) => (e.currentTarget.style.display = "none")} />}
          <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>
      <Container className="relative h-full flex items-center">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="max-w-xl text-white">
            <p className="text-[11px] tracking-[0.35em] uppercase text-[#C5A16A] mb-4">New Season 2026</p>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl leading-[1.08]">{s.title}</h1>
            {s.text && <p className="mt-5 text-white/80 text-sm sm:text-base max-w-md">{s.text}</p>}
            <div className="mt-8 flex flex-wrap gap-3">
              {s.button && <button onClick={go} className="px-7 py-3.5 text-sm bg-[#C5A16A] text-[#222222] hover:bg-[#d4b27d] transition-colors">{s.button}</button>}
              <button onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })} className="px-7 py-3.5 text-sm border border-white/70 hover:bg-white hover:text-[#222222] transition-colors">Browse Categories</button>
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
      {n > 1 && <div className="absolute bottom-6 left-0 right-0">
        <Container className="flex items-center justify-between">
          <div className="flex gap-2">{slides.map((_, k) => <button key={k} aria-label={`Slide ${k + 1}`} onClick={() => setI(k)} className={`h-1 transition-all ${k === idx ? "w-10 bg-[#C5A16A]" : "w-5 bg-white/50"}`} />)}</div>
          <div className="flex gap-2">
            <button onClick={prev} aria-label="Previous" className="w-11 h-11 border border-white/50 text-white flex items-center justify-center hover:bg-white hover:text-black"><FaChevronLeft size={12} /></button>
            <button onClick={next} aria-label="Next" className="w-11 h-11 border border-white/50 text-white flex items-center justify-center hover:bg-white hover:text-black"><FaChevronRight size={12} /></button>
          </div>
        </Container>
      </div>}
    </section>
  );
}

function Trending({ items }) {
  const ref = useRef();
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

export default function Home() {
  const { categories, findProduct, home, reviews, newsletter } = useStore();
  const featured = home.featuredIds.map(findProduct).filter(Boolean).slice(0, 8);
  const trending = home.trendingIds.map(findProduct).filter(Boolean);
  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";
  return (
    <>
      <Hero />
      {categories.length > 0 && <section id="categories" className="py-16 md:py-24"><Container>
        <SectionHead eyebrow="Shop by category" title="Find Your Style" text="From everyday modest wear to festive sets, explore every collection." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {categories.map((c, n) => (
            <Reveal key={c.slug} delay={(n % 4) * 0.06}>
              <Link to={`/category/${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden bg-[#E8DDCA]">
                <Img src={c.image} alt={c.name} className="w-full h-full transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 p-4 text-white">
                  <h3 className="font-serif text-lg sm:text-2xl leading-tight">{c.name}</h3>
                  {c.desc && <p className="text-xs text-white/75 mt-1 hidden sm:block">{c.desc}</p>}
                  <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] tracking-widest uppercase text-[#C5A16A] group-hover:gap-3 transition-all">View <FaChevronRight size={8} /></span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container></section>}
      {featured.length > 0 && <section className="pb-16 md:pb-24"><Container>
        <SectionHead eyebrow="Handpicked" title="Featured Products" text="Our editors' favourites, chosen for quality and fit." action={<Link to="/shop" className={`px-6 py-3 text-sm ${btnLine}`}>View All Products</Link>} />
        <ProductGrid items={featured} />
      </Container></section>}
      {trending.length > 0 && <Trending items={trending} />}
      {reviews.length > 0 && <section className="py-16 md:py-24"><Container>
        <SectionHead eyebrow="Kind words" title="Loved by Our Customers" action={<div className="flex items-center gap-3"><span className="font-serif text-5xl">{avg}</span><div><Stars value={Number(avg)} size={14} /><p className={`text-xs ${MUTED}`}>Average rating</p></div></div>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reviews.map((r, n) => (
            <Reveal key={n} delay={(n % 4) * 0.07} className="bg-white border border-[#E8DDCA] p-6 flex flex-col">
              <Stars value={r.rating} /><p className="mt-4 text-sm leading-relaxed flex-1">"{r.text}"</p>
              <div className="mt-5 flex items-center gap-3"><Img src={r.image} alt={r.name} className="w-10 h-10 rounded-full" /><div><p className="text-sm font-medium">{r.name}</p><p className={`text-xs ${MUTED}`}>{r.city}</p></div></div>
            </Reveal>
          ))}
        </div>
      </Container></section>}
      <section className="pb-4"><Container><div className="bg-[#242424] text-white px-6 py-14 md:py-20 text-center">
        <h2 className="font-serif text-3xl md:text-5xl">{newsletter.title}</h2>
        <p className="text-white/60 mt-3 max-w-md mx-auto text-sm">{newsletter.text}</p>
        <div className="max-w-md mx-auto mt-8 text-left"><NewsletterForm dark /></div>
      </div></Container></section>
    </>
  );
}