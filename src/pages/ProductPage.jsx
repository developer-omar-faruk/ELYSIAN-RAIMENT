import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChevronLeft, FaChevronRight, FaPlus, FaMinus } from "react-icons/fa";
import { SIZE_CHART } from "../data.js";
import { useStore } from "../store.jsx";
import { money, discountPct, Img, Container, SectionHead, Breadcrumb, Accordion, btnDark } from "../ui.jsx";
import { optimizeImage } from "../image.js";
import { ProductGrid } from "../components.jsx";

const SizeTable = () => (
  <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{SIZE_CHART.headers.map((h) => <th key={h} className="py-2 pr-4 font-medium text-[#222222]">{h}</th>)}</tr></thead>
    <tbody>{SIZE_CHART.rows.map((r) => <tr key={r[0]} className="border-t border-[#E8DDCA]">{r.map((c, i) => <td key={i} className="py-2 pr-4">{c}</td>)}</tr>)}</tbody></table>
    <p className="text-xs mt-3">{SIZE_CHART.note}</p></div>
);

export default function ProductPage() {
  const { slug } = useParams();
  const { products, catName, addToCart, notify, infoSections } = useStore(); const navigate = useNavigate();
  const p = products.find((x) => x.slug === slug);
  const [img, setImg] = useState(0); const [size, setSize] = useState(""); const [qty, setQty] = useState(1);
  const [lightbox, setLightbox] = useState(false); const [guide, setGuide] = useState(false); const [color, setColor] = useState(0);
  useEffect(() => { setImg(0); setSize(p?.sizes.length === 1 ? p.sizes[0] : ""); setQty(1); setColor(0); }, [slug]); // eslint-disable-line
  if (!p) return <Container className="py-24 text-center"><h1 className="font-serif text-4xl">Product not found</h1><Link to="/shop" className={`inline-block mt-6 px-6 py-3 text-sm ${btnDark}`}>Back to Shop</Link></Container>;
  const d = discountPct(p), out = p.stock < 1;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).concat(products.filter((x) => x.category !== p.category && x.id !== p.id)).slice(0, 4);
  const step = (n) => setImg((i) => (i + n + p.images.length) % p.images.length);
  const needSize = () => { if (!size) { notify("Please select a size first", "err"); return false; } return true; };
  const col = p.colors[color];
  return (
    <Container className="py-8 md:py-12">
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: catName(p.category), to: `/category/${p.category}` }, { label: p.name }]} />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
        <div className="grid sm:grid-cols-[80px_1fr] gap-3 min-w-0">
          <div className="order-2 sm:order-1 flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
            {p.images.map((s, n) => <button key={n} onClick={() => setImg(n)} className={`shrink-0 w-16 sm:w-full aspect-[4/5] border-2 ${n === img ? "border-[#C5A16A]" : "border-transparent"}`}><Img src={s} alt={`${p.name}, image ${n + 1}`} className="w-full h-full" /></button>)}
          </div>
          <div className="order-1 sm:order-2 relative aspect-[4/5] bg-white overflow-hidden">
            <AnimatePresence mode="wait"><motion.div key={img} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full rounded-sm h-full cursor-zoom-in" onClick={() => setLightbox(true)}><Img src={p.images[img]} alt={p.name} priority className="w-full rounded-sm h-full" /></motion.div></AnimatePresence>
            {p.images.length > 1 && <>
              <button onClick={() => step(-1)} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 flex items-center justify-center"><FaChevronLeft size={12} /></button>
              <button onClick={() => step(1)} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 flex items-center justify-center"><FaChevronRight size={12} /></button></>}
            {d > 0 && <span className="absolute top-3 left-3 bg-[#C5A16A] text-xs font-medium px-3 py-1">-{d}%</span>}
          </div>
        </div>
        <div className="bg-[#242424] text-white p-6 sm:p-9 self-start min-w-0">
          <p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A16A]">{catName(p.category)}</p>
          <h1 className="font-serif text-3xl sm:text-4xl mt-2 leading-tight">{p.name}</h1>
          <div className="flex items-baseline gap-3 mt-5 flex-wrap"><span className="text-3xl font-semibold">{money(p.price)}</span>{p.oldPrice > p.price && <span className="text-white/50 line-through">{money(p.oldPrice)}</span>}{d > 0 && <span className="bg-[#C5A16A] text-[#222222] text-xs px-2 py-1">Save {d}%</span>}</div>
          {p.description && <p className="mt-5 text-sm text-white/70 leading-relaxed">{p.description}</p>}
          <p className={`mt-4 text-sm ${out ? "text-red-400" : p.stock <= 8 ? "text-[#C5A16A]" : "text-emerald-400"}`}>{out ? "Out of stock" : p.stock <= 8 ? `Only ${p.stock} left in stock` : `In stock (${p.stock} available)`}</p>
          {p.colors.length > 0 && p.colors[0] !== "Default" && <div className="mt-6"><p className="text-xs uppercase tracking-widest text-white/60 mb-2">Colour: <span className="text-white">{col}</span></p>
            <div className="flex gap-2 flex-wrap">{p.colors.map((c, n) => <button key={c} onClick={() => setColor(n)} className={`px-4 py-2 text-xs border ${n === color ? "border-[#C5A16A] text-[#C5A16A]" : "border-white/25"}`}>{c}</button>)}</div></div>}
          <div className="mt-6">
            <div className="flex justify-between mb-2"><p className="text-xs uppercase tracking-widest text-white/60">Size</p><button onClick={() => setGuide(true)} className="text-xs underline text-[#C5A16A]">Size guide</button></div>
            <div className="flex gap-2 flex-wrap">{p.sizes.map((s) => <button key={s} onClick={() => setSize(s)} className={`min-w-[48px] h-11 px-3 text-sm border transition-colors ${size === s ? "bg-white text-[#222222] border-white" : "border-white/25 hover:border-white"}`}>{s}</button>)}</div>
          </div>
          <div className="mt-6 flex items-center gap-4"><p className="text-xs uppercase tracking-widest text-white/60">Quantity</p>
            <div className="flex items-center border border-white/25">
              <button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease" className="w-11 h-11 flex items-center justify-center"><FaMinus size={10} /></button>
              <span className="w-10 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min(Math.max(1, p.stock), qty + 1))} aria-label="Increase" className="w-11 h-11 flex items-center justify-center"><FaPlus size={10} /></button></div></div>
          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            <motion.button disabled={out} whileTap={{ scale: 0.97 }} onClick={() => needSize() && addToCart(p.id, size, col, qty)} className="py-4 text-sm border border-white hover:bg-white hover:text-[#222222] transition-colors disabled:opacity-40">{out ? "Sold out" : "Add to Cart"}</motion.button>
            <motion.button disabled={out} whileTap={{ scale: 0.97 }} onClick={() => { if (needSize()) { addToCart(p.id, size, col, qty, true); navigate("/checkout"); } }} className="py-4 text-sm bg-[#C5A16A] text-[#222222] hover:bg-[#d4b27d] transition-colors disabled:opacity-40">Buy Now</motion.button>
          </div>
        </div>
      </div>
      <div className="mt-12 max-w-3xl border-t border-[#E8DDCA]">
        {p.description && <Accordion title="Product Description" defaultOpen>{p.description}</Accordion>}
        <Accordion title="Fabric & Fit">{p.fabric ? `${p.fabric}. ` : ""}Colours: {p.colors.join(", ")}. Sizes: {p.sizes.join(", ")}.</Accordion>
        <Accordion title="Size Guide"><SizeTable /></Accordion>
        {infoSections.map((s) => <Accordion key={s.title} title={s.title}>{s.text}</Accordion>)}
      </div>
      {related.length > 0 && <section className="mt-20"><SectionHead eyebrow="You may also like" title="Similar Products" /><ProductGrid items={related} /></section>}
      <AnimatePresence>{lightbox && (
        <motion.div className="fixed inset-0 z-[95] bg-black/90 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white w-11 h-11" aria-label="Close"><FaTimes size={22} /></button>
          <button onClick={(e) => { e.stopPropagation(); step(-1); }} className="absolute left-3 text-white w-11 h-11" aria-label="Previous"><FaChevronLeft /></button>
          <img src={optimizeImage(p.images[img], 1600)} alt={p.name} className="max-h-[90vh] max-w-full object-contain" onClick={(e) => e.stopPropagation()} />
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