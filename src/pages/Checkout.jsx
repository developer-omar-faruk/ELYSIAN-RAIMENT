import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaShoppingBag, FaChevronLeft, FaChevronDown, FaLock, FaCheckCircle, FaPlus, FaMinus, FaTrashAlt } from "react-icons/fa";
import { api } from "../api.js";
import { useStore } from "../store.jsx";
import { money, phoneOk, emailOk, Img, Container, Field, MUTED, field, btnDark } from "../ui.jsx";

const QtyControl = ({ qty, onChange }) => (
  <div className="inline-flex items-center border border-[#E8DDCA] bg-white">
    <button onClick={() => onChange(qty - 1)} aria-label="Decrease" className="w-9 h-9 flex items-center justify-center"><FaMinus size={9} /></button>
    <span className="w-8 text-center text-sm">{qty}</span>
    <button onClick={() => onChange(qty + 1)} aria-label="Increase" className="w-9 h-9 flex items-center justify-center"><FaPlus size={9} /></button>
  </div>
);

export function CartPage() {
  const { lines, subtotal, setQty, removeItem, zones } = useStore();
  const fees = zones.map((z) => z.fee);
  if (!lines.length) return (
    <Container className="py-24 text-center"><FaShoppingBag size={42} className="mx-auto text-[#C5A16A]" /><h1 className="font-serif text-4xl mt-6">Your cart is empty</h1><p className={`mt-2 ${MUTED}`}>Discover something you will love.</p><Link to="/shop" className={`inline-block mt-8 px-8 py-3.5 text-sm ${btnDark}`}>Start Shopping</Link></Container>
  );
  return (
    <Container className="py-8 md:py-12">
      <h1 className="font-serif text-4xl md:text-5xl mb-8">Shopping Cart</h1>
      <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-3">
          <AnimatePresence>{lines.map((l) => (
            <motion.div layout key={l.key} exit={{ opacity: 0, x: -30 }} className="bg-white border border-[#E8DDCA] p-3 sm:p-4 flex gap-4">
              <Link to={`/product/${l.product.slug}`}><Img src={l.product.images[0]} alt={l.product.name} className="w-20 sm:w-28 aspect-[4/5]" /></Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2"><Link to={`/product/${l.product.slug}`} className="font-serif text-lg leading-tight">{l.product.name}</Link>
                  <button onClick={() => removeItem(l.key)} aria-label="Remove" className="text-[#77736C] hover:text-red-600 p-1"><FaTrashAlt size={14} /></button></div>
                <p className={`text-xs mt-1 ${MUTED}`}>Size: {l.size}{l.color ? ` · ${l.color}` : ""} · {money(l.product.price)} each</p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2"><QtyControl qty={l.qty} onChange={(n) => setQty(l.key, n)} /><p className="font-semibold">{money(l.product.price * l.qty)}</p></div>
              </div>
            </motion.div>))}</AnimatePresence>
          <Link to="/shop" className="inline-flex items-center gap-2 text-sm mt-2 hover:text-[#C5A16A]"><FaChevronLeft size={10} />Continue Shopping</Link>
        </div>
        <div className="bg-white border border-[#E8DDCA] p-6 lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl mb-4">Order Summary</h2>
          <div className="flex justify-between text-sm py-2"><span className={MUTED}>Subtotal</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-sm py-2 gap-4"><span className={MUTED}>Delivery</span><span className={`text-right ${MUTED}`}>Selected at checkout ({money(Math.min(...fees))}–{money(Math.max(...fees))})</span></div>
          <div className="flex justify-between font-semibold text-lg py-3 border-t border-[#E8DDCA] mt-2"><span>Total</span><span>{money(subtotal)}+</span></div>
          <Link to="/checkout" className={`block text-center py-4 text-sm mt-2 ${btnDark}`}>Proceed to Checkout</Link>
        </div>
      </div>
    </Container>
  );
}

function Step({ n, title, children }) {
  return <section className="bg-white border border-[#E8DDCA] p-5 sm:p-7"><div className="flex items-center gap-3 mb-5"><span className="w-9 h-9 rounded-full bg-[#242424] text-[#C5A16A] text-xs flex items-center justify-center">{n}</span><h2 className="font-serif text-2xl">{title}</h2></div>{children}</section>;
}

export function Checkout() {
  const { lines, subtotal, count, removeItem, clearCart, addOrder, notify, zones, reload } = useStore(); const navigate = useNavigate();
  const [f, setF] = useState({ name: "", phone: "", email: "", news: false, address: "", area: "", note: "" });
  const [zone, setZone] = useState(""); const [errors, setErrors] = useState({}); const [busy, setBusy] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false); const [code, setCode] = useState(""); const [coupon, setCoupon] = useState(null); const [cBusy, setCBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const fee = zones.find((z) => z.id === zone)?.fee ?? 0;
  const discount = coupon ? Math.min(subtotal, coupon.value) : 0;
  const total = subtotal - discount + fee;

  // Re-check the coupon on the server whenever the cart total changes
  useEffect(() => {
    if (!coupon) return;
    let off = false;
    api("/coupons/validate", { method: "POST", body: { code: coupon.code, subtotal } })
      .then((c) => !off && setCoupon(c))
      .catch((e) => { if (!off) { setCoupon(null); notify(e.message, "err"); } });
    return () => { off = true; };
  }, [subtotal]); // eslint-disable-line

  const applyCoupon = async () => {
    if (!code.trim()) return;
    setCBusy(true);
    try { const c = await api("/coupons/validate", { method: "POST", body: { code: code.trim(), subtotal } }); setCoupon(c); notify(`Coupon applied: ${c.label}`); }
    catch (e) { notify(e.message, "err"); }
    setCBusy(false);
  };

  const place = async (e) => {
    e.preventDefault(); if (busy) return;
    const er = {};
    if (!f.name.trim()) er.name = "Please enter your full name.";
    if (!phoneOk(f.phone)) er.phone = "Enter a valid Bangladesh mobile number (e.g. 017XXXXXXXX).";
    if (!f.email.trim()) er.email = "Please enter your email address.";
    else if (!emailOk(f.email)) er.email = "Please enter a valid email address.";
    if (!f.address.trim()) er.address = "Please enter your delivery address.";
    if (!zone) er.zone = "Please select a delivery zone.";
    if (!lines.length) er.cart = "Your cart is empty.";
    setErrors(er);
    if (Object.keys(er).length) { notify(er.cart || "Please fix the highlighted fields", "err"); return; }
    setBusy(true);
    try {
      const order = await api("/orders", { method: "POST", body: {
        customer: { name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() },
        address: f.address.trim(), area: f.area.trim(), note: f.note.trim(), zone,
        items: lines.map((l) => ({ id: l.id, size: l.size, color: l.color, qty: l.qty })),
        coupon: coupon?.code || "",
      } });
      addOrder(order); clearCart(); reload();
      navigate(`/order-success/${order.id}`, { replace: true });
    } catch (x) {
      notify(x.message, "err"); setBusy(false); reload();
    }
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
              <div className="sm:col-span-2"><Field label="Email *" error={errors.email}><input value={f.email} onChange={set("email")} className={inp("email")} placeholder="you@example.com" /></Field></div>
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
              {zones.map((z) => (
                <button type="button" key={z.id} onClick={() => setZone(z.id)} className={`text-left p-4 border-2 transition-colors ${zone === z.id ? "border-[#C5A16A] bg-[#FAF7F1]" : "border-[#E8DDCA]"}`}>
                  <div className="flex justify-between"><b className="font-medium">{z.label}</b><span className="font-semibold">{money(z.fee)}</span></div>{z.note && <p className={`text-xs mt-1 ${MUTED}`}>{z.note}</p>}
                </button>))}
            </div>
            {errors.zone && <p className="text-xs text-red-600 mt-2">{errors.zone}</p>}
          </Step>
          <Step n="03" title="Payment">
            <div className="border-2 border-[#C5A16A] bg-[#FAF7F1] p-4 flex items-start gap-3"><FaCheckCircle className="text-[#C5A16A] mt-0.5" /><div><b className="font-medium">Cash on Delivery</b><p className={`text-sm ${MUTED}`}>Pay in cash when your order arrives.</p></div></div>
          </Step>
        </div>
        <aside className="bg-[#242424] text-white p-6 lg:sticky lg:top-6">
          <h2 className="font-serif text-2xl mb-5">Order Summary <span className="text-sm text-white/50">({count})</span></h2>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {lines.map((l) => (
              <div key={l.key} className="flex gap-3"><Img src={l.product.images[0]} alt={l.product.name} className="w-14 aspect-[4/5]" />
                <div className="flex-1 min-w-0 text-sm"><p className="leading-tight">{l.product.name}</p><p className="text-xs text-white/50 mt-1">Size {l.size}{l.color ? ` · ${l.color}` : ""} · Qty {l.qty} · {money(l.product.price)}</p>
                  <button type="button" onClick={() => removeItem(l.key)} className="text-xs text-[#C5A16A] mt-1 underline">Remove</button></div>
                <p className="text-sm">{money(l.product.price * l.qty)}</p></div>))}
          </div>
          <div className="mt-5 border-t border-white/15 pt-4">
            <button type="button" onClick={() => setCouponOpen(!couponOpen)} className="text-sm text-[#C5A16A] flex items-center gap-2">Have a coupon?<FaChevronDown size={9} className={couponOpen ? "rotate-180" : ""} /></button>
            <AnimatePresence>{couponOpen && <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden"><div className="flex gap-2 pt-3">
              <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }} placeholder="Enter coupon code" className="flex-1 min-w-0 bg-white/10 border border-white/20 px-3 py-2.5 text-sm outline-none" />
              <button type="button" disabled={cBusy} onClick={applyCoupon} className="px-4 text-sm bg-[#C5A16A] text-[#222222] disabled:opacity-60">{cBusy ? "…" : "Apply"}</button></div></motion.div>}</AnimatePresence>
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