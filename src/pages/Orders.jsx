import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheckCircle, FaBoxOpen } from "react-icons/fa";
import { ORDER_STATUSES } from "../data.js";
import { useStore } from "../store.jsx";
import { money, Img, Container, INK, MUTED, btnDark, btnLine } from "../ui.jsx";

export function OrderSuccess() {
  const { orderId } = useParams(); const { orders } = useStore(); const o = orders.find((x) => x.id === orderId);
  if (!o) return <Container className="py-24 text-center"><h1 className="font-serif text-4xl">Order not found</h1><Link to="/my-orders" className={`inline-block mt-6 px-8 py-3.5 text-sm ${btnDark}`}>My Orders</Link></Container>;
  const row = (l, v) => <div className="flex justify-between gap-6 py-3 border-b border-[#E8DDCA] text-sm"><span className={MUTED}>{l}</span><span className="text-right">{v}</span></div>;
  return (
    <Container className="py-12 md:py-20 max-w-2xl text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}><FaCheckCircle size={64} className="mx-auto text-[#C5A16A]" /></motion.div>
      <h1 className="font-serif text-3xl sm:text-5xl mt-6">Your Order Has Been Placed!</h1>
      <p className={`mt-3 ${MUTED}`}>Thank you, {o.customer.name}. We'll call to confirm your order shortly.</p>
      <div className="bg-white border border-[#E8DDCA] p-6 mt-8 text-left">
        {row("Order ID", <b>{o.id}</b>)}{row("Customer", o.customer.name)}{row("Total", <b>{money(o.total)}</b>)}{row("Payment", o.payment)}{row("Delivery address", o.address + (o.area ? `, ${o.area}` : ""))}{row("Delivery zone", o.zone)}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/my-orders" className={`px-7 py-3.5 text-sm ${btnDark}`}>View My Orders</Link><Link to="/shop" className={`px-7 py-3.5 text-sm ${btnLine}`}>Continue Shopping</Link></div>
    </Container>
  );
}

export function MyOrders() {
  const { orders, refreshOrders } = useStore();
  useEffect(() => { refreshOrders(); }, [refreshOrders]);
  if (!orders.length) return <Container className="py-24 text-center"><FaBoxOpen size={44} className="mx-auto text-[#C5A16A]" /><h1 className="font-serif text-4xl mt-6">No orders yet</h1><p className={`mt-2 ${MUTED}`}>Your placed orders will appear here.</p><Link to="/shop" className={`inline-block mt-8 px-8 py-3.5 text-sm ${btnDark}`}>Start Shopping</Link></Container>;
  return (
    <Container className="py-8 md:py-12 max-w-4xl">
      <h1 className="font-serif text-4xl md:text-5xl">My Orders</h1>
      <p className={`text-xs mt-2 ${MUTED}`}>Order status updates automatically when our team processes your order. Orders are remembered on this device.</p>
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
          </div>
        ))}
      </div>
    </Container>
  );
}