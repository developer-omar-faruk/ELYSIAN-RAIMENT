import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronRight, FaChevronDown, FaStar, FaRegStar, FaCheckCircle } from "react-icons/fa";
import { BRAND } from "./data.js";
import { useStore } from "./store.jsx";
import { optimizeImage } from "./image.js";

export const money = (n) => `${BRAND.currency}${Math.round(n || 0).toLocaleString("en-US")}`;
export const discountPct = (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);
export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
export const phoneOk = (p) => /^(?:\+?88)?01[3-9]\d{8}$/.test(p.replace(/[\s-]/g, ""));
export const INK = "text-[#222222]", MUTED = "text-[#77736C]";
export const btnDark = "bg-[#242424] text-white hover:bg-black transition-colors";
export const btnLine = "border border-[#222222] text-[#222222] hover:bg-[#222222] hover:text-white transition-colors";
export const field = "w-full bg-[#FAF7F1] border border-[#E8DDCA] px-4 py-3 text-sm outline-none focus:border-[#C5A16A] rounded-sm";

export function Img({ src, alt, className = "", priority = false }) {
  const [bad, setBad] = useState(false);
  if (bad || !src) return <div className={`bg-[#E8DDCA] flex items-center justify-center text-[#77736C] text-xs ${className}`}>{alt}</div>;
  const optimizedSrc = optimizeImage(src);
  const srcSet = src.includes("res.cloudinary.com") && src.includes("/image/upload/")
    ? [480, 900].map((width) => `${optimizeImage(src, width)} ${width}w`).join(", ")
    : undefined;
  return <img
    src={optimizedSrc}
    srcSet={srcSet}
    sizes={srcSet ? "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" : undefined}
    alt={alt}
    loading={priority ? "eager" : "lazy"}
    fetchPriority={priority ? "high" : "auto"}
    decoding="async"
    onError={() => setBad(true)}
    className={`object-cover ${className}`}
  />;
}
export const Stars = ({ value, size = 12 }) => (
  <span className="inline-flex gap-0.5 text-[#C5A16A]">{[1, 2, 3, 4, 5].map((n) => (n <= Math.round(value) ? <FaStar key={n} size={size} /> : <FaRegStar key={n} size={size} />))}</span>
);
export const Reveal = ({ children, className = "", delay = 0 }) => (
  <motion.div className={className} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay }}>{children}</motion.div>
);
export const Container = ({ children, className = "" }) => <div className={`mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
export const Spinner = () => <div className="flex justify-center py-24"><div className="w-8 h-8 rounded-full border-2 border-[#E8DDCA] border-t-[#C5A16A] animate-spin" /></div>;
export const SectionHead = ({ eyebrow, title, text, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-8 md:mb-12">
    <div className="max-w-xl">
      <p className="text-[11px] tracking-[0.3em] uppercase text-[#C5A16A] mb-3">{eyebrow}</p>
      <h2 className="font-serif text-3xl md:text-5xl leading-tight text-[#222222]">{title}</h2>
      {text && <p className={`mt-3 text-sm md:text-base ${MUTED}`}>{text}</p>}
    </div>
    {action}
  </div>
);
export const Breadcrumb = ({ items }) => (
  <nav className={`text-xs ${MUTED} flex flex-wrap gap-2 items-center mb-6`}>
    {items.map((it, i) => (
      <span key={i} className="flex items-center gap-2">
        {it.to ? <Link to={it.to} className="hover:text-[#222222]">{it.label}</Link> : <span className={INK}>{it.label}</span>}
        {i < items.length - 1 && <FaChevronRight size={8} />}
      </span>
    ))}
  </nav>
);
export const Accordion = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E8DDCA]">
      <button onClick={() => setOpen(!open)} className="w-full flex justify-between items-center py-4 text-left text-sm font-medium">
        {title}<FaChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className={`pb-4 text-sm leading-relaxed whitespace-pre-line ${MUTED}`}>{children}</div></motion.div>}
      </AnimatePresence>
    </div>
  );
};
export function Field({ label, error, children }) {
  return <label className="block"><span className="text-xs uppercase tracking-widest text-[#77736C]">{label}</span><div className="mt-2">{children}</div>{error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}</label>;
}
export function Toast() {
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
export function NewsletterForm({ dark }) {
  const { notify } = useStore();
  const [email, setEmail] = useState(""); const [err, setErr] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!emailOk(email)) return setErr("Please enter a valid email address.");
    setErr(""); setEmail(""); notify("Thanks for subscribing!");
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