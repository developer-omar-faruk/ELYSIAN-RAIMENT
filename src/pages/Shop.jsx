import React, { useState, useMemo } from "react";
import { Link, useParams, useSearchParams, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";
import { useStore } from "../store.jsx";
import { Container, Breadcrumb, MUTED, field, btnLine, btnDark } from "../ui.jsx";
import { ProductCard } from "../components.jsx";

export default function Shop() {
  const { categorySlug } = useParams(); const [params, setParams] = useSearchParams(); const navigate = useNavigate();
  const { products, categories, catName } = useStore();
  const [sort, setSort] = useState("newest"); const [filtersOpen, setFiltersOpen] = useState(false);
  const q = params.get("q") || "";
  const cat = categories.find((c) => c.slug === categorySlug);
  const items = useMemo(() => {
    const l = products.filter((p) => (!categorySlug || p.category === categorySlug) && (!q || (p.name + catName(p.category) + p.description).toLowerCase().includes(q.toLowerCase())));
    const s = { newest: (a, b) => b.createdAt - a.createdAt, popular: (a, b) => b.popularity - a.popularity, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price }[sort];
    return [...l].sort(s);
  }, [products, categorySlug, q, sort, catName]);
  if (categorySlug && !cat) return <Navigate to="/shop" replace />;
  const clear = () => { setSort("newest"); setParams({}); navigate("/shop"); };
  const chip = (active) => `px-4 py-2 text-xs border whitespace-nowrap transition-colors ${active ? "bg-[#242424] text-white border-[#242424]" : "border-[#E8DDCA] bg-white hover:border-[#C5A16A]"}`;
  const Filters = (
    <div className="space-y-6">
      <div><p className="text-[11px] tracking-[0.25em] uppercase mb-3 text-[#C5A16A]">Categories</p>
        <div className="flex flex-wrap gap-2"><Link to="/shop" className={chip(!categorySlug)}>All</Link>{categories.map((c) => <Link key={c.slug} to={`/category/${c.slug}`} className={chip(categorySlug === c.slug)}>{c.name}</Link>)}</div></div>
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
      <p className={`mt-3 max-w-xl ${MUTED}`}>{cat ? cat.desc : "Browse the full collection."}</p>
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