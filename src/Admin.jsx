import React, { useState, useEffect, useCallback, useRef } from "react";
import { FaTachometerAlt, FaBoxOpen, FaTags, FaWarehouse, FaClipboardList, FaUsers, FaImages, FaTicketAlt, FaStar, FaChartLine, FaCog, FaUserCircle, FaSignOutAlt, FaBars, FaTimes, FaSearch, FaPlus, FaEdit, FaTrashAlt, FaPrint, FaDownload, FaChevronLeft, FaChevronRight, FaArrowUp, FaArrowDown, FaEye, FaEyeSlash, FaCheck, FaUpload, FaExternalLinkAlt } from "react-icons/fa";

// ============================================================
// API + helpers
// ============================================================
const API = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
let CSRF = "";
const call = async (path, { method = "GET", body } = {}) => {
  const r = await fetch(`${API}/api/admin${path}`, { method, credentials: "include", headers: { ...(body ? { "Content-Type": "application/json" } : {}), "X-CSRF-Token": CSRF }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && !["/me", "/login", "/setup-status", "/setup"].includes(path)) window.dispatchEvent(new Event("rg-401"));
  if (!r.ok) throw new Error(j.error || `Request failed (${r.status})`);
  return j;
};
const toast = (m, err = false) => window.dispatchEvent(new CustomEvent("rg-toast", { detail: { m, err } }));
const confirmBox = (msg, label = "Confirm") => new Promise((res) => window.dispatchEvent(new CustomEvent("rg-confirm", { detail: { msg, label, res } })));
const money = (n) => `৳${Math.round(n || 0).toLocaleString("en-US")}`;
const fdate = (d) => (d ? new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");
const qs = (o) => new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null)).toString();
const cx = (...a) => a.filter(Boolean).join(" ");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const csvCell = (c) => { let s = String(c ?? ""); if (/^[=+\-@]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; };
const downloadCsv = (name, rows) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.map(csvCell).join(",")).join("\n")], { type: "text/csv" })); a.download = name; a.click(); };
const STATUSES = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Completed", "Cancelled", "Refunded"];
const SC = { Pending: "bg-amber-100 text-amber-800", Confirmed: "bg-sky-100 text-sky-800", Processing: "bg-indigo-100 text-indigo-800", Shipped: "bg-violet-100 text-violet-800", Delivered: "bg-emerald-100 text-emerald-800", Completed: "bg-emerald-200 text-emerald-900", Cancelled: "bg-red-100 text-red-700", Refunded: "bg-zinc-200 text-zinc-700", Paid: "bg-emerald-100 text-emerald-800", Unpaid: "bg-amber-100 text-amber-800", Active: "bg-emerald-100 text-emerald-800", Inactive: "bg-zinc-200 text-zinc-700", Expired: "bg-red-100 text-red-700", Scheduled: "bg-sky-100 text-sky-800", Approved: "bg-emerald-100 text-emerald-800", Hidden: "bg-zinc-200 text-zinc-700", Published: "bg-emerald-100 text-emerald-800", Draft: "bg-zinc-200 text-zinc-700" };

function useApi(path) {
  const [s, setS] = useState({ data: null, loading: true, error: "" });
  const load = useCallback(() => {
    setS((x) => ({ ...x, loading: true, error: "" }));
    return call(path).then((data) => setS({ data, loading: false, error: "" })).catch((e) => setS((x) => ({ ...x, loading: false, error: e.message })));
  }, [path]);
  useEffect(() => { load(); }, [load]);
  return [s, load];
}
const uploadImage = (file) => new Promise((resolve, reject) => {
  const img = new Image(), u = URL.createObjectURL(file);
  img.onload = async () => {
    const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement("canvas");
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
    try { resolve((await call("/upload", { method: "POST", body: { data: c.toDataURL("image/jpeg", 0.86) } })).url); } catch (e) { reject(e); }
  };
  img.onerror = () => reject(new Error("That file is not a readable image."));
  img.src = u;
});
const rangeOf = (days) => ({ from: new Date(Date.now() - (days - 1) * 864e5).toLocaleDateString("en-CA"), to: new Date().toLocaleDateString("en-CA") });

// ============================================================
// UI kit
// ============================================================
const inp = "w-full bg-white border border-[#E5DCCB] rounded-md px-3 py-2 text-sm outline-none focus:border-[#B8975A] focus:ring-2 focus:ring-[#B8975A]/20 disabled:bg-[#F6F1E7]";
const KINDS = { dark: "bg-[#26231F] text-white hover:bg-black", gold: "bg-[#B8975A] text-white hover:bg-[#a6864c]", line: "border border-[#D9CDB5] bg-white hover:bg-[#F6F1E7]", red: "bg-red-600 text-white hover:bg-red-700", ghost: "hover:bg-[#F1EADB]" };
const Btn = ({ kind = "dark", className, ...p }) => <button type="button" {...p} className={cx("inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm transition disabled:opacity-50 disabled:cursor-not-allowed", KINDS[kind], className)} />;
const Field = ({ label, hint, children, className }) => <label className={cx("block", className)}><span className="text-[11px] uppercase tracking-widest text-[#8A8173]">{label}</span><div className="mt-1.5">{children}</div>{hint && <span className="text-xs text-[#8A8173] mt-1 block">{hint}</span>}</label>;
const Card = ({ title, action, children, className }) => <section className={cx("bg-white border border-[#E8DFCE] rounded-xl shadow-[0_1px_2px_rgba(60,45,20,.04)]", className)}>{(title || action) && <div className="flex items-center justify-between gap-3 px-5 pt-4"><h3 className="font-serif text-lg">{title}</h3>{action}</div>}<div className="p-5">{children}</div></section>;
const Badge = ({ children, k }) => <span className={cx("inline-block px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap", SC[k || children] || "bg-zinc-100 text-zinc-700")}>{children}</span>;
const Empty = ({ text }) => <p className="text-center text-sm text-[#8A8173] py-10">{text}</p>;
const Spinner = () => <div className="flex justify-center py-16"><div className="w-7 h-7 rounded-full border-2 border-[#E5DCCB] border-t-[#B8975A] animate-spin" /></div>;
const Toggle = ({ on, onChange, label }) => <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx("w-10 h-6 rounded-full p-0.5 transition shrink-0", on ? "bg-[#B8975A]" : "bg-zinc-300")}><span className={cx("block w-5 h-5 bg-white rounded-full transition", on && "translate-x-4")} /></button>;
const Check = ({ label, ...p }) => <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" {...p} className="w-4 h-4 accent-[#B8975A]" />{label}</label>;
function State({ s, reload, children }) {
  if (s.loading && !s.data) return <Spinner />;
  if (s.error && !s.data) return <div className="text-center py-12"><p className="text-red-600 text-sm">{s.error}</p><Btn kind="line" className="mt-3" onClick={reload}>Try again</Btn></div>;
  return children;
}
function Modal({ title, onClose, children, wide, footer }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx("bg-[#FFFCF7] w-full sm:rounded-xl shadow-2xl flex flex-col max-h-screen sm:max-h-[92vh]", wide ? "max-w-4xl" : "max-w-xl")}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E8DFCE]"><h2 className="font-serif text-xl">{title}</h2><button onClick={onClose} aria-label="Close" className="w-9 h-9 flex items-center justify-center hover:bg-[#F1EADB] rounded-md"><FaTimes /></button></div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 py-3 border-t border-[#E8DFCE] flex justify-end gap-2 bg-[#FAF6EC] sm:rounded-b-xl">{footer}</div>}
      </div>
    </div>
  );
}
function SearchBox({ onChange, placeholder = "Search…", className }) {
  const [v, setV] = useState(""); const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } const t = setTimeout(() => onChange(v), 350); return () => clearTimeout(t); }, [v]); // eslint-disable-line
  return <div className={cx("relative", className)}><FaSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8173]" /><input value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} className={cx(inp, "pl-8")} /></div>;
}
const Pager = ({ page, pages, onChange }) => pages > 1 ? <div className="flex items-center justify-between mt-4 text-sm"><span className="text-[#8A8173]">Page {page} of {pages}</span><div className="flex gap-2"><Btn kind="line" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><FaChevronLeft size={10} /></Btn><Btn kind="line" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><FaChevronRight size={10} /></Btn></div></div> : null;
const Th = ({ children, className }) => <th className={cx("text-left text-[11px] uppercase tracking-widest text-[#8A8173] font-medium px-3 py-2.5 whitespace-nowrap", className)}>{children}</th>;
const Td = ({ children, className }) => <td className={cx("px-3 py-3 align-middle", className)}>{children}</td>;
const Table = ({ head, children }) => <div className="overflow-x-auto -mx-5"><table className="w-full text-sm min-w-[640px]"><thead className="border-b border-[#E8DFCE]"><tr>{head}</tr></thead><tbody className="divide-y divide-[#F0E9DA]">{children}</tbody></table></div>;
const Thumb = ({ src, className = "w-10 h-12" }) => src ? <img src={src} alt="" className={cx("object-cover rounded bg-[#F1EADB]", className)} onError={(e) => (e.currentTarget.style.visibility = "hidden")} /> : <div className={cx("rounded bg-[#F1EADB]", className)} />;
const PageHead = ({ title, sub, children }) => <div className="flex flex-wrap items-end justify-between gap-3 mb-6"><div><h1 className="font-serif text-3xl">{title}</h1>{sub && <p className="text-sm text-[#8A8173] mt-1">{sub}</p>}</div><div className="flex gap-2 flex-wrap">{children}</div></div>;
function ImageField({ value, onChange, className }) {
  const [busy, setBusy] = useState(false); const ref = useRef();
  const pick = async (e) => { const f = e.target.files[0]; e.target.value = ""; if (!f) return; setBusy(true); try { onChange(await uploadImage(f)); } catch (er) { toast(er.message, true); } setBusy(false); };
  return (
    <div className={cx("flex items-center gap-2", className)}>
      <Thumb src={value} className="w-12 h-14 shrink-0" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste image URL or upload" className={inp} />
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={pick} />
      <Btn kind="line" disabled={busy} onClick={() => ref.current.click()} aria-label="Upload image"><FaUpload size={12} />{busy ? "…" : ""}</Btn>
    </div>
  );
}
function RangeBar({ r, set }) {
  const P = [["1", "Today", "day"], ["7", "7 days", "day"], ["30", "30 days", "day"], ["90", "90 days", "week"], ["365", "12 months", "month"], ["custom", "Custom"]];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex flex-wrap bg-white border border-[#E5DCCB] rounded-md p-0.5">{P.map(([k, l, g]) => <button key={k} onClick={() => (k === "custom" ? set({ ...r, preset: "custom" }) : set({ preset: k, ...rangeOf(+k), group: g }))} className={cx("px-3 py-1.5 text-xs rounded", r.preset === k ? "bg-[#26231F] text-white" : "hover:bg-[#F1EADB]")}>{l}</button>)}</div>
      {r.preset === "custom" && <><input type="date" value={r.from} onChange={(e) => set({ ...r, from: e.target.value })} className={cx(inp, "w-auto")} /><span className="text-[#8A8173]">to</span><input type="date" value={r.to} onChange={(e) => set({ ...r, to: e.target.value })} className={cx(inp, "w-auto")} /></>}
      <select value={r.group} onChange={(e) => set({ ...r, group: e.target.value })} className={cx(inp, "w-auto")}><option value="day">Group: Daily</option><option value="week">Group: Weekly</option><option value="month">Group: Monthly</option></select>
    </div>
  );
}
const useRange = () => useState(() => ({ preset: "30", ...rangeOf(30), group: "day" }));
function Bars({ rows, k = "revenue" }) {
  if (!rows.length) return <Empty text="No sales in this period yet." />;
  const max = Math.max(1, ...rows.map((r) => r[k]));
  return <div className="flex items-end gap-1.5 h-52 overflow-x-auto pt-2">{rows.map((r) => <div key={r._id} className="flex-1 min-w-[26px] flex flex-col items-center justify-end h-full group" title={`${r._id}: ${money(r.revenue)} · ${r.orders} orders`}><span className="text-[9px] text-[#8A8173] opacity-0 group-hover:opacity-100">{money(r[k])}</span><div className="w-full rounded-t bg-[#B8975A] group-hover:bg-[#8F7240] transition-all" style={{ height: `${Math.max(3, (r[k] / max) * 85)}%` }} /><span className="text-[9px] text-[#8A8173] mt-1 whitespace-nowrap">{r._id.slice(-5)}</span></div>)}</div>;
}
function printOrder(o, kind) {
  const w = window.open("", "_blank");
  if (!w) return toast("Please allow pop-ups to print.", true);
  const inv = kind === "invoice";
  const rows = o.items.map((i) => `<tr><td>${esc(i.name)}<br><small>Size ${esc(i.size)}${i.color ? ` · ${esc(i.color)}` : ""}</small></td><td>${i.qty}</td>${inv ? `<td>${money(i.price)}</td><td>${money(i.price * i.qty)}</td>` : "<td>☐ packed</td>"}</tr>`).join("");
  w.document.write(`<!doctype html><html><head><title>${inv ? "Invoice" : "Packing slip"} ${esc(o.id)}</title><style>body{font-family:Georgia,serif;color:#222;padding:32px;max-width:780px;margin:auto}table{width:100%;border-collapse:collapse;margin-top:18px}td,th{border-bottom:1px solid #ddd;padding:9px;text-align:left;font-size:14px}.r{text-align:right}small{color:#777}</style></head><body><h1>Elysian-Raiment</h1><p><b>${inv ? "INVOICE" : "PACKING SLIP"}</b> · ${esc(o.id)} · ${esc(fdate(o.createdAt))}</p><p><b>${esc(o.customer.name)}</b><br>${esc(o.customer.phone)}<br>${esc(o.address)}${o.area ? ", " + esc(o.area) : ""}<br>${esc(o.zone)}</p><table><tr><th>Item</th><th>Qty</th>${inv ? "<th>Price</th><th>Total</th>" : "<th></th>"}</tr>${rows}</table>${inv ? `<p class="r">Subtotal: ${money(o.subtotal)}<br>Discount: -${money(o.discount)}${o.coupon ? ` (${esc(o.coupon)})` : ""}<br>Delivery: ${money(o.deliveryFee)}<br><b>Total: ${money(o.total)}</b><br>${esc(o.payment)} · ${esc(o.paymentStatus)}</p>` : `<p>Customer note: ${esc(o.note) || "—"}</p><p>${esc(o.payment)} — collect ${o.paymentStatus === "Paid" ? "nothing (paid)" : money(o.total)}</p>`}</body></html>`);
  w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
}

// ============================================================
// Dashboard
// ============================================================
function Stat({ label, value, sub, accent }) {
  return <div className={cx("bg-white border rounded-xl p-4 shadow-[0_1px_2px_rgba(60,45,20,.04)]", accent ? "border-[#B8975A]/60" : "border-[#E8DFCE]")}><p className="text-[11px] uppercase tracking-widest text-[#8A8173]">{label}</p><p className="font-serif text-3xl mt-1.5">{value}</p>{sub && <p className="text-xs text-[#8A8173] mt-1">{sub}</p>}</div>;
}
function Dashboard({ go }) {
  const [r, setR] = useRange();
  const [s, reload] = useApi(`/analytics?${qs({ from: r.from, to: r.to, group: r.group })}`);
  const a = s.data, t = a?.totals, sc = t?.statusCounts || {};
  return (
    <>
      <PageHead title="Dashboard" sub="Live figures from your store database." />
      <RangeBar r={r} set={setR} />
      <State s={s} reload={reload}>{a && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <Stat accent label="Revenue" value={money(t.revenue)} sub="excl. cancelled & refunded" /><Stat label="Orders" value={t.orders} sub="in selected period" /><Stat label="Products" value={t.products} sub="in catalogue" /><Stat label="Customers" value={t.customers} sub="all time" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Stat label="Pending" value={sc.Pending || 0} /><Stat label="Processing" value={sc.Processing || 0} /><Stat label="Delivered" value={(sc.Delivered || 0) + (sc.Completed || 0)} /><Stat label="Cancelled" value={sc.Cancelled || 0} /><Stat label="Low stock" value={a.inventory.low + a.inventory.out} sub={`${a.inventory.out} out of stock`} />
        </div>
        <div className="grid xl:grid-cols-3 gap-4 mb-4">
          <Card title="Sales overview" className="xl:col-span-2"><Bars rows={a.series} /></Card>
          <Card title="Order status">{STATUSES.map((st) => { const n = sc[st] || 0; return <div key={st} className="mb-2.5"><div className="flex justify-between text-xs mb-1"><span>{st}</span><span className="text-[#8A8173]">{n}</span></div><div className="h-2 bg-[#F1EADB] rounded"><div className="h-2 rounded bg-[#B8975A]" style={{ width: `${t.orders ? (n / t.orders) * 100 : 0}%` }} /></div></div>; })}</Card>
        </div>
        <div className="grid xl:grid-cols-3 gap-4">
          <Card title="Recent orders" className="xl:col-span-2" action={<Btn kind="ghost" onClick={() => go("orders")}>View all</Btn>}>
            {a.recent.length ? <Table head={<><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Status</Th></>}>{a.recent.map((o) => <tr key={o.id}><Td className="font-medium">{o.id}</Td><Td>{o.customer.name}</Td><Td>{money(o.total)}</Td><Td><Badge>{o.status}</Badge></Td></tr>)}</Table> : <Empty text="No orders in this period." />}
          </Card>
          <div className="space-y-4">
            <Card title="Best sellers">{a.topProducts.length ? a.topProducts.slice(0, 5).map((p) => <div key={p._id} className="flex items-center gap-3 py-2"><Thumb src={p.image} className="w-9 h-11" /><div className="flex-1 min-w-0"><p className="text-sm truncate">{p.name}</p><p className="text-xs text-[#8A8173]">{p.qty} sold</p></div><span className="text-sm">{money(p.revenue)}</span></div>) : <Empty text="No sales yet." />}</Card>
            <Card title="Low stock" action={<Btn kind="ghost" onClick={() => go("inventory")}>Manage</Btn>}>{a.inventory.lowList.length ? a.inventory.lowList.map((p) => <div key={p.id} className="flex justify-between py-1.5 text-sm"><span className="truncate pr-2">{p.name}</span><Badge k={p.stock ? "Pending" : "Cancelled"}>{p.stock ? `${p.stock} left` : "Out"}</Badge></div>) : <Empty text="All products are well stocked." />}</Card>
          </div>
        </div>
      </>}</State>
    </>
  );
}

// ============================================================
// Products
// ============================================================
function ProductForm({ p, cats, onClose, onSaved }) {
  const edit = !!p;
  const [f, setF] = useState(() => p ? { ...p, oldPrice: p.oldPrice ?? "", sizes: p.sizes.join(", "), colors: p.colors.join(", "), tags: (p.tags || []).join(", "), images: p.images.length ? p.images : [""], variants: p.variants || [] } : { id: "", sku: "", name: "", category: cats[0]?.slug || "", description: "", fabric: "", price: "", oldPrice: "", images: [""], sizes: "S, M, L, XL", colors: "", tags: "", variants: [], stock: 0, featured: false, trending: false, newArrival: false, published: true });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const list = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const gen = () => {
    const sizes = list(f.sizes), colors = list(f.colors).length ? list(f.colors) : [""];
    setF((x) => ({ ...x, variants: sizes.flatMap((size) => colors.map((color) => x.variants.find((v) => v.size === size && v.color === color) || { size, color, stock: 0 })) }));
  };
  const setImg = (i, v) => setF((x) => ({ ...x, images: x.images.map((m, n) => (n === i ? v : m)) }));
  const total = f.variants.reduce((s, v) => s + Number(v.stock || 0), 0);
  const save = async () => {
    setBusy(true);
    try { await call(edit ? `/products/${p.id}` : "/products", { method: edit ? "PUT" : "POST", body: f }); toast(edit ? "Product updated" : "Product created"); onSaved(); }
    catch (e) { toast(e.message, true); setBusy(false); }
  };
  return (
    <Modal wide title={edit ? `Edit: ${p.name}` : "Add product"} onClose={onClose} footer={<><Btn kind="line" onClick={onClose}>Cancel</Btn><Btn kind="gold" disabled={busy} onClick={save}>{busy ? "Saving…" : "Save product"}</Btn></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Product name *" className="sm:col-span-2"><input className={inp} value={f.name} onChange={set("name")} /></Field>
        <Field label="Product ID" hint={edit ? "Cannot be changed" : "Leave blank to auto-generate"}><input className={inp} value={f.id || ""} onChange={set("id")} disabled={edit} /></Field>
        <Field label="SKU"><input className={inp} value={f.sku || ""} onChange={set("sku")} placeholder="Auto" /></Field>
        <Field label="Category *"><select className={inp} value={f.category} onChange={set("category")}>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field>
        <Field label="Fabric"><input className={inp} value={f.fabric || ""} onChange={set("fabric")} /></Field>
        <Field label="Selling price (৳) *"><input type="number" min="0" className={inp} value={f.price} onChange={set("price")} /></Field>
        <Field label="Regular price (৳)" hint="Shown struck-through when higher than selling price"><input type="number" min="0" className={inp} value={f.oldPrice} onChange={set("oldPrice")} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea rows={3} className={inp} value={f.description || ""} onChange={set("description")} /></Field>
        <div className="sm:col-span-2"><p className="text-[11px] uppercase tracking-widest text-[#8A8173] mb-1.5">Images (first is the main image)</p>
          <div className="space-y-2">{f.images.map((m, i) => <div key={i} className="flex items-center gap-2"><ImageField className="flex-1" value={m} onChange={(v) => setImg(i, v)} /><Btn kind="ghost" aria-label="Remove image" onClick={() => setF((x) => ({ ...x, images: x.images.filter((_, n) => n !== i) }))}><FaTrashAlt size={12} /></Btn></div>)}</div>
          <Btn kind="line" className="mt-2" onClick={() => setF((x) => ({ ...x, images: [...x.images, ""] }))}><FaPlus size={10} />Add image</Btn></div>
        <Field label="Sizes *" hint="Comma separated"><input className={inp} value={f.sizes} onChange={set("sizes")} /></Field>
        <Field label="Colours" hint="Comma separated"><input className={inp} value={f.colors} onChange={set("colors")} /></Field>
        <Field label="Tags" className="sm:col-span-2" hint="Comma separated, used for search"><input className={inp} value={f.tags} onChange={set("tags")} /></Field>
        <div className="sm:col-span-2 border border-[#E8DFCE] rounded-lg p-4 bg-[#FAF6EC]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><p className="text-sm font-medium">Stock</p><div className="flex gap-2"><Btn kind="line" onClick={gen}>Generate size × colour variants</Btn>{f.variants.length > 0 && <Btn kind="ghost" onClick={() => setF((x) => ({ ...x, variants: [] }))}>Remove variants</Btn>}</div></div>
          {f.variants.length ? <>
            <div className="grid grid-cols-[1fr_1fr_90px] gap-2 text-[11px] uppercase tracking-widest text-[#8A8173] mb-1"><span>Size</span><span>Colour</span><span>Stock</span></div>
            {f.variants.map((v, i) => <div key={i} className="grid grid-cols-[1fr_1fr_90px] gap-2 mb-1.5"><input className={inp} value={v.size} onChange={(e) => setF((x) => ({ ...x, variants: x.variants.map((y, n) => (n === i ? { ...y, size: e.target.value } : y)) }))} /><input className={inp} value={v.color} onChange={(e) => setF((x) => ({ ...x, variants: x.variants.map((y, n) => (n === i ? { ...y, color: e.target.value } : y)) }))} /><input type="number" min="0" className={inp} value={v.stock} onChange={(e) => setF((x) => ({ ...x, variants: x.variants.map((y, n) => (n === i ? { ...y, stock: e.target.value } : y)) }))} /></div>)}
            <p className="text-xs text-[#8A8173] mt-2">Total stock: <b>{total}</b></p></>
            : <Field label="Total stock (no variants)"><input type="number" min="0" className={cx(inp, "max-w-[140px]")} value={f.stock} onChange={set("stock")} /></Field>}
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-x-6 gap-y-2"><Check label="Published" checked={!!f.published} onChange={set("published")} /><Check label="Featured" checked={!!f.featured} onChange={set("featured")} /><Check label="Trending" checked={!!f.trending} onChange={set("trending")} /><Check label="New arrival" checked={!!f.newArrival} onChange={set("newArrival")} /></div>
      </div>
    </Modal>
  );
}
function Products() {
  const [f, setF] = useState({ q: "", category: "", availability: "", published: "", sort: "-createdAt", page: 1 });
  const [s, reload] = useApi(`/products?${qs({ ...f, limit: 10 })}`);
  const [c] = useApi("/categories");
  const [edit, setEdit] = useState(null);
  const cats = c.data?.items || [];
  const up = (k, v) => setF((x) => ({ ...x, [k]: v, page: k === "page" ? v : 1 }));
  const flag = async (p, k) => { try { await call(`/products/${p.id}/flags`, { method: "PATCH", body: { [k]: !p[k] } }); reload(); } catch (e) { toast(e.message, true); } };
  const del = async (p) => { if (!(await confirmBox(`Delete "${p.name}" permanently? Past orders keep their details.`, "Delete"))) return; try { await call(`/products/${p.id}`, { method: "DELETE" }); toast("Product deleted"); reload(); } catch (e) { toast(e.message, true); } };
  const d = s.data;
  return (
    <>
      <PageHead title="Products" sub={d ? `${d.total} product${d.total !== 1 ? "s" : ""}` : ""}><Btn kind="gold" onClick={() => setEdit({})} disabled={!cats.length}><FaPlus size={11} />Add product</Btn></PageHead>
      {c.data && !cats.length && <p className="text-sm text-amber-700 mb-3">Create a category first before adding products.</p>}
      <Card>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2 mb-4">
          <SearchBox onChange={(v) => up("q", v)} placeholder="Name, ID, SKU, tag" className="lg:col-span-2" />
          <select className={inp} value={f.category} onChange={(e) => up("category", e.target.value)}><option value="">All categories</option>{cats.map((x) => <option key={x.slug} value={x.slug}>{x.name}</option>)}</select>
          <select className={inp} value={f.availability} onChange={(e) => up("availability", e.target.value)}><option value="">Any availability</option><option value="in">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
          <select className={inp} value={f.sort} onChange={(e) => up("sort", e.target.value)}><option value="-createdAt">Newest</option><option value="createdAt">Oldest</option><option value="name">Name A–Z</option><option value="-name">Name Z–A</option><option value="price">Price low–high</option><option value="-price">Price high–low</option><option value="stock">Stock low–high</option><option value="-stock">Stock high–low</option></select>
        </div>
        <State s={s} reload={reload}>{d && (d.items.length ? <>
          <Table head={<><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Published</Th><Th>Featured</Th><Th>Trending</Th><Th className="text-right">Actions</Th></>}>
            {d.items.map((p) => <tr key={p.id} className="hover:bg-[#FAF6EC]">
              <Td><div className="flex items-center gap-3"><Thumb src={p.images[0]} /><div className="min-w-0"><p className="font-medium truncate max-w-[220px]">{p.name}</p><p className="text-xs text-[#8A8173]">{p.id} · {p.sku}</p></div></div></Td>
              <Td>{cats.find((x) => x.slug === p.category)?.name || p.category}</Td>
              <Td>{money(p.price)}{p.oldPrice > p.price && <span className="block text-xs line-through text-[#8A8173]">{money(p.oldPrice)}</span>}</Td>
              <Td><Badge k={p.stock === 0 ? "Cancelled" : p.stock <= d.low ? "Pending" : "Delivered"}>{p.stock === 0 ? "Out of stock" : `${p.stock} in stock`}</Badge></Td>
              <Td><Toggle on={p.published} label="Publish" onChange={() => flag(p, "published")} /></Td>
              <Td><Toggle on={!!p.featured} label="Featured" onChange={() => flag(p, "featured")} /></Td>
              <Td><Toggle on={!!p.trending} label="Trending" onChange={() => flag(p, "trending")} /></Td>
              <Td className="text-right whitespace-nowrap"><Btn kind="ghost" aria-label="Edit" onClick={() => setEdit(p)}><FaEdit /></Btn><Btn kind="ghost" aria-label="Delete" className="text-red-600" onClick={() => del(p)}><FaTrashAlt /></Btn></Td>
            </tr>)}
          </Table>
          <Pager page={d.page} pages={d.pages} onChange={(n) => up("page", n)} /></> : <Empty text="No products match your filters." />)}</State>
      </Card>
      {edit && <ProductForm p={edit.id ? edit : null} cats={cats} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); reload(); }} />}
    </>
  );
}

// ============================================================
// Categories
// ============================================================
function Categories() {
  const [s, reload] = useApi("/categories");
  const [m, setM] = useState(null); const [busy, setBusy] = useState(false);
  const items = s.data?.items || [];
  const save = async () => { setBusy(true); try { await call(m.slug && m._edit ? `/categories/${m.slug}` : "/categories", { method: m._edit ? "PUT" : "POST", body: m }); toast("Category saved"); setM(null); reload(); } catch (e) { toast(e.message, true); } setBusy(false); };
  const move = async (i, d) => { const a = items.map((c) => c.slug); [a[i], a[i + d]] = [a[i + d], a[i]]; try { await call("/categories/reorder", { method: "POST", body: { slugs: a } }); reload(); } catch (e) { toast(e.message, true); } };
  const del = async (c) => { if (!(await confirmBox(`Delete category "${c.name}"?`, "Delete"))) return; try { await call(`/categories/${c.slug}`, { method: "DELETE" }); toast("Category deleted"); reload(); } catch (e) { toast(e.message, true); } };
  const toggle = async (c) => { try { await call(`/categories/${c.slug}`, { method: "PUT", body: { ...c, published: !c.published } }); reload(); } catch (e) { toast(e.message, true); } };
  return (
    <>
      <PageHead title="Categories" sub="Order here is the order shown on the storefront."><Btn kind="gold" onClick={() => setM({ name: "", desc: "", image: "", published: true })}><FaPlus size={11} />Add category</Btn></PageHead>
      <Card><State s={s} reload={reload}>{items.length ? <Table head={<><Th>Order</Th><Th>Category</Th><Th>Products</Th><Th>Published</Th><Th className="text-right">Actions</Th></>}>
        {items.map((c, i) => <tr key={c.slug} className="hover:bg-[#FAF6EC]">
          <Td className="whitespace-nowrap"><Btn kind="ghost" disabled={i === 0} aria-label="Move up" onClick={() => move(i, -1)}><FaArrowUp size={11} /></Btn><Btn kind="ghost" disabled={i === items.length - 1} aria-label="Move down" onClick={() => move(i, 1)}><FaArrowDown size={11} /></Btn></Td>
          <Td><div className="flex items-center gap-3"><Thumb src={c.image} /><div><p className="font-medium">{c.name}</p><p className="text-xs text-[#8A8173]">/{c.slug} · {c.desc}</p></div></div></Td>
          <Td>{c.products}</Td><Td><Toggle on={c.published} label="Publish" onChange={() => toggle(c)} /></Td>
          <Td className="text-right whitespace-nowrap"><Btn kind="ghost" aria-label="Edit" onClick={() => setM({ ...c, _edit: true })}><FaEdit /></Btn><Btn kind="ghost" aria-label="Delete" className="text-red-600" onClick={() => del(c)}><FaTrashAlt /></Btn></Td>
        </tr>)}</Table> : <Empty text="No categories yet." />}</State></Card>
      {m && <Modal title={m._edit ? "Edit category" : "Add category"} onClose={() => setM(null)} footer={<><Btn kind="line" onClick={() => setM(null)}>Cancel</Btn><Btn kind="gold" disabled={busy} onClick={save}>Save</Btn></>}>
        <div className="space-y-4"><Field label="Name *"><input className={inp} value={m.name} onChange={(e) => setM({ ...m, name: e.target.value })} /></Field>
          <Field label="Description"><input className={inp} value={m.desc || ""} onChange={(e) => setM({ ...m, desc: e.target.value })} /></Field>
          <Field label="Image"><ImageField value={m.image || ""} onChange={(v) => setM({ ...m, image: v })} /></Field>
          <Check label="Published on storefront" checked={m.published !== false} onChange={(e) => setM({ ...m, published: e.target.checked })} /></div></Modal>}
    </>
  );
}

// ============================================================
// Inventory
// ============================================================
function Inventory() {
  const [tab, setTab] = useState("stock");
  const [f, setF] = useState({ q: "", status: "" }); const [hp, setHp] = useState(1); const [hq, setHq] = useState("");
  const [s, reload] = useApi(`/inventory?${qs(f)}`);
  const [h, hreload] = useApi(`/inventory/history?${qs({ page: hp, q: hq })}`);
  const [adj, setAdj] = useState(null); const [busy, setBusy] = useState(false);
  const d = s.data;
  const submit = async () => { setBusy(true); try { await call("/inventory/adjust", { method: "POST", body: { id: adj.p.id, vid: adj.v?._id, mode: adj.mode, value: adj.value, reason: adj.reason } }); toast("Stock updated"); setAdj(null); reload(); hreload(); } catch (e) { toast(e.message, true); } setBusy(false); };
  const Mini = ({ title, data }) => <Card title={title}>{Object.keys(data).length ? Object.entries(data).sort((a, b) => b[1] - a[1]).map(([k, v]) => <div key={k} className="flex justify-between text-sm py-1"><span>{k}</span><b>{v}</b></div>) : <Empty text="No data" />}</Card>;
  return (
    <>
      <PageHead title="Inventory" sub="Orders deduct stock automatically; cancellations restore it."><div className="flex bg-white border border-[#E5DCCB] rounded-md p-0.5">{[["stock", "Stock"], ["history", "History"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={cx("px-4 py-1.5 text-sm rounded", tab === k ? "bg-[#26231F] text-white" : "hover:bg-[#F1EADB]")}>{l}</button>)}</div></PageHead>
      {tab === "stock" ? <State s={s} reload={reload}>{d && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"><Stat label="Total units" value={d.summary.units} /><Stat label="Products" value={d.summary.products} /><Stat label="Low stock" value={d.summary.low} sub={`≤ ${d.summary.threshold} units`} /><Stat label="Out of stock" value={d.summary.out} /></div>
        <div className="grid md:grid-cols-2 gap-4 mb-4"><Mini title="Stock by size" data={d.bySize} /><Mini title="Stock by colour" data={d.byColor} /></div>
        <Card>
          <div className="grid sm:grid-cols-3 gap-2 mb-4"><SearchBox onChange={(v) => setF((x) => ({ ...x, q: v }))} placeholder="Search product" className="sm:col-span-2" /><select className={inp} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="">All stock levels</option><option value="low">Low stock</option><option value="out">Out of stock</option></select></div>
          {d.items.length ? <Table head={<><Th>Product</Th><Th>Variants / sizes</Th><Th>Stock</Th><Th className="text-right">Adjust</Th></>}>
            {d.items.map((p) => <tr key={p.id}><Td><div className="flex items-center gap-3"><Thumb src={p.images[0]} className="w-9 h-11" /><div><p className="font-medium">{p.name}</p><p className="text-xs text-[#8A8173]">{p.id}</p></div></div></Td>
              <Td>{p.variants.length ? <div className="space-y-1">{p.variants.map((v) => <div key={v._id} className="flex items-center gap-2 text-xs"><span className="min-w-[110px]">{v.size}{v.color ? ` · ${v.color}` : ""}</span><Badge k={v.stock === 0 ? "Cancelled" : v.stock <= d.summary.threshold ? "Pending" : "Delivered"}>{v.stock}</Badge><button className="underline text-[#8F7240]" onClick={() => setAdj({ p, v, mode: "add", value: "", reason: "" })}>adjust</button></div>)}</div> : <span className="text-xs text-[#8A8173]">Sizes: {p.sizes.join(", ")} (no variants)</span>}</Td>
              <Td><Badge k={p.stock === 0 ? "Cancelled" : p.stock <= d.summary.threshold ? "Pending" : "Delivered"}>{p.stock}</Badge></Td>
              <Td className="text-right">{!p.variants.length && <Btn kind="line" onClick={() => setAdj({ p, mode: "add", value: "", reason: "" })}>Adjust</Btn>}</Td></tr>)}</Table> : <Empty text="No products found." />}
        </Card></>}</State>
        : <Card><SearchBox onChange={(v) => { setHq(v); setHp(1); }} placeholder="Search history" className="mb-4 max-w-sm" /><State s={h} reload={hreload}>{h.data && (h.data.items.length ? <><Table head={<><Th>Date</Th><Th>Product</Th><Th>Variant</Th><Th>Change</Th><Th>New stock</Th><Th>Reason</Th><Th>By</Th></>}>{h.data.items.map((x) => <tr key={x._id}><Td className="whitespace-nowrap text-xs">{fdate(x.createdAt)}</Td><Td>{x.name}</Td><Td className="text-xs">{[x.size, x.color].filter(Boolean).join(" · ") || "—"}</Td><Td className={x.delta < 0 ? "text-red-600" : "text-emerald-700"}>{x.delta > 0 ? "+" : ""}{x.delta}</Td><Td>{x.after ?? "—"}</Td><Td className="text-xs">{x.reason}</Td><Td className="text-xs">{x.by}</Td></tr>)}</Table><Pager page={h.data.page} pages={h.data.pages} onChange={setHp} /></> : <Empty text="No stock movements recorded yet." />)}</State></Card>}
      {adj && <Modal title={`Adjust stock: ${adj.p.name}${adj.v ? ` (${adj.v.size}${adj.v.color ? ` · ${adj.v.color}` : ""})` : ""}`} onClose={() => setAdj(null)} footer={<><Btn kind="line" onClick={() => setAdj(null)}>Cancel</Btn><Btn kind="gold" disabled={busy || adj.value === ""} onClick={submit}>Apply</Btn></>}>
        <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Field label="Mode"><select className={inp} value={adj.mode} onChange={(e) => setAdj({ ...adj, mode: e.target.value })}><option value="add">Add / remove (+/−)</option><option value="set">Set exact quantity</option></select></Field><Field label={adj.mode === "set" ? "New quantity" : "Change by"}><input type="number" className={inp} value={adj.value} onChange={(e) => setAdj({ ...adj, value: e.target.value })} /></Field></div>
          <Field label="Reason"><input className={inp} value={adj.reason} onChange={(e) => setAdj({ ...adj, reason: e.target.value })} placeholder="e.g. New delivery from supplier" /></Field></div></Modal>}
    </>
  );
}

// ============================================================
// Orders
// ============================================================
function OrderModal({ id, onClose, onChanged }) {
  const [o, setO] = useState(null); const [err, setErr] = useState("");
  const [st, setSt] = useState(""); const [ps, setPs] = useState(""); const [dv, setDv] = useState(null); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const apply = (x) => { setO(x); setSt(x.status); setPs(x.paymentStatus); setDv({ name: x.customer.name, phone: x.customer.phone, address: x.address, area: x.area || "", note: x.note || "" }); };
  useEffect(() => { call(`/orders/${id}`).then(apply).catch((e) => setErr(e.message)); }, [id]);
  const patch = async (body, msg) => { setBusy(true); try { apply(await call(`/orders/${id}`, { method: "PATCH", body })); toast(msg); onChanged(); } catch (e) { toast(e.message, true); } setBusy(false); };
  const addNote = async () => { if (!note.trim()) return; try { apply(await call(`/orders/${id}/notes`, { method: "POST", body: { text: note } })); setNote(""); toast("Note added"); } catch (e) { toast(e.message, true); } };
  return (
    <Modal wide title={`Order ${id}`} onClose={onClose}>
      {err ? <p className="text-red-600 text-sm">{err}</p> : !o ? <Spinner /> : <div className="grid lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 space-y-5">
          <div><p className="text-[11px] uppercase tracking-widest text-[#8A8173] mb-2">Items</p>{o.items.map((i, n) => <div key={n} className="flex gap-3 items-center py-2 border-b border-[#F0E9DA]"><Thumb src={i.image} /><div className="flex-1 text-sm"><p>{i.name}</p><p className="text-xs text-[#8A8173]">Size {i.size}{i.color ? ` · ${i.color}` : ""} · {money(i.price)} × {i.qty}</p></div><b className="text-sm">{money(i.price * i.qty)}</b></div>)}
            <dl className="text-sm mt-3 space-y-1 ml-auto max-w-xs">{[["Subtotal", money(o.subtotal)], [`Discount${o.coupon ? ` (${o.coupon})` : ""}`, `-${money(o.discount)}`], ["Delivery", money(o.deliveryFee)]].map(([k, v]) => <div key={k} className="flex justify-between"><dt className="text-[#8A8173]">{k}</dt><dd>{v}</dd></div>)}<div className="flex justify-between text-base font-semibold border-t border-[#E8DFCE] pt-2"><dt>Grand total</dt><dd>{money(o.total)}</dd></div></dl></div>
          <div><p className="text-[11px] uppercase tracking-widest text-[#8A8173] mb-2">Delivery information</p>
            <div className="grid sm:grid-cols-2 gap-3"><Field label="Name"><input className={inp} value={dv.name} onChange={(e) => setDv({ ...dv, name: e.target.value })} /></Field><Field label="Phone"><input className={inp} value={dv.phone} onChange={(e) => setDv({ ...dv, phone: e.target.value })} /></Field>
              <Field label="Address" className="sm:col-span-2"><textarea rows={2} className={inp} value={dv.address} onChange={(e) => setDv({ ...dv, address: e.target.value })} /></Field><Field label="Area / landmark"><input className={inp} value={dv.area} onChange={(e) => setDv({ ...dv, area: e.target.value })} /></Field><Field label="Customer note"><input className={inp} value={dv.note} onChange={(e) => setDv({ ...dv, note: e.target.value })} /></Field></div>
            <p className="text-xs text-[#8A8173] mt-2">Zone: {o.zone}</p><Btn kind="line" className="mt-2" disabled={busy} onClick={() => patch({ delivery: dv }, "Delivery details saved")}>Save delivery details</Btn></div>
          <div><p className="text-[11px] uppercase tracking-widest text-[#8A8173] mb-2">Internal notes</p>{o.notes.length ? o.notes.map((n, i) => <div key={i} className="bg-[#FAF6EC] border border-[#E8DFCE] rounded-md p-2.5 mb-2 text-sm"><p>{n.text}</p><p className="text-[11px] text-[#8A8173] mt-1">{n.by} · {fdate(n.at)}</p></div>) : <p className="text-sm text-[#8A8173] mb-2">No notes yet.</p>}
            <div className="flex gap-2"><input className={inp} value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a private note" /><Btn kind="dark" onClick={addNote}>Add</Btn></div></div>
        </div>
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#FAF6EC] border border-[#E8DFCE] rounded-lg p-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-[#8A8173]">Placed</span>{fdate(o.createdAt)}</div><div className="flex justify-between"><span className="text-[#8A8173]">Payment method</span>{o.payment}</div><div className="flex justify-between items-center"><span className="text-[#8A8173]">Status</span><Badge>{o.status}</Badge></div><div className="flex justify-between items-center"><span className="text-[#8A8173]">Payment</span><Badge>{o.paymentStatus}</Badge></div></div>
          <Field label="Order status"><div className="flex gap-2"><select className={inp} value={st} onChange={(e) => setSt(e.target.value)}>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select><Btn kind="gold" disabled={busy || st === o.status} onClick={() => patch({ status: st }, "Status updated")}>Update</Btn></div></Field>
          <Field label="Payment status"><div className="flex gap-2"><select className={inp} value={ps} onChange={(e) => setPs(e.target.value)}>{["Unpaid", "Paid", "Refunded"].map((x) => <option key={x}>{x}</option>)}</select><Btn kind="gold" disabled={busy || ps === o.paymentStatus} onClick={() => patch({ paymentStatus: ps }, "Payment updated")}>Update</Btn></div></Field>
          <div className="flex gap-2"><Btn kind="line" onClick={() => printOrder(o, "invoice")}><FaPrint size={12} />Invoice</Btn><Btn kind="line" onClick={() => printOrder(o, "slip")}><FaPrint size={12} />Packing slip</Btn></div>
          <div><p className="text-[11px] uppercase tracking-widest text-[#8A8173] mb-2">Timeline</p><ol className="border-l-2 border-[#E8DFCE] ml-1.5 space-y-3">{[...o.timeline].reverse().map((t, i) => <li key={i} className="pl-4 relative text-sm"><span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-[#B8975A]" />{t.label}<span className="block text-[11px] text-[#8A8173]">{fdate(t.at)} · {t.by}</span></li>)}</ol></div>
        </div>
      </div>}
    </Modal>
  );
}
function Orders() {
  const [f, setF] = useState({ status: "", q: "", from: "", to: "", page: 1 });
  const [s, reload] = useApi(`/orders?${qs({ ...f, limit: 15 })}`);
  const [sel, setSel] = useState([]); const [bulkSt, setBulkSt] = useState(""); const [open, setOpen] = useState(null);
  const up = (k, v) => setF((x) => ({ ...x, [k]: v, page: k === "page" ? v : 1 }));
  const d = s.data, counts = d?.counts || {}, all = Object.values(counts).reduce((a, b) => a + b, 0);
  const bulk = async () => {
    if (!(await confirmBox(`Change ${sel.length} order(s) to "${bulkSt}"? Stock is adjusted automatically for cancellations.`))) return;
    try { const r = await call("/orders/bulk", { method: "POST", body: { ids: sel, status: bulkSt } }); toast(`${r.updated} updated${r.failed.length ? `, ${r.failed.length} failed: ${r.failed[0].error}` : ""}`, r.failed.length > 0); setSel([]); setBulkSt(""); reload(); } catch (e) { toast(e.message, true); }
  };
  const exportCsv = async () => {
    try { const r = await call(`/orders?${qs({ ...f, page: 1, limit: 5000 })}`); downloadCsv(`orders-${new Date().toLocaleDateString("en-CA")}.csv`, [["Order", "Date", "Customer", "Phone", "Address", "Zone", "Items", "Subtotal", "Discount", "Delivery", "Total", "Payment", "Payment status", "Status"], ...r.items.map((o) => [o.id, new Date(o.createdAt).toISOString(), o.customer.name, o.customer.phone, o.address, o.zone, o.items.map((i) => `${i.name} (${i.size}) x${i.qty}`).join("; "), o.subtotal, o.discount, o.deliveryFee, o.total, o.payment, o.paymentStatus, o.status])]); } catch (e) { toast(e.message, true); }
  };
  const tabs = [["", "All Orders", all], ...STATUSES.map((x) => [x, x === "Shipped" ? "Shipped / In Courier" : x, counts[x] || 0])];
  const ids = d?.items.map((o) => o.id) || [];
  return (
    <>
      <PageHead title="Orders" sub="Orders placed on the storefront appear here instantly."><Btn kind="line" onClick={exportCsv}><FaDownload size={11} />Export CSV</Btn></PageHead>
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">{tabs.map(([k, l, n]) => <button key={k} onClick={() => { up("status", k); setSel([]); }} className={cx("px-3.5 py-2 text-sm rounded-md whitespace-nowrap border", f.status === k ? "bg-[#26231F] text-white border-[#26231F]" : "bg-white border-[#E5DCCB] hover:bg-[#F6F1E7]")}>{l} <span className={cx("ml-1 text-xs", f.status === k ? "text-[#E3C792]" : "text-[#8A8173]")}>{n}</span></button>)}</div>
      <Card>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4"><SearchBox onChange={(v) => up("q", v)} placeholder="Order ID, name or phone" className="lg:col-span-2" /><input type="date" aria-label="From" className={inp} value={f.from} onChange={(e) => up("from", e.target.value)} /><input type="date" aria-label="To" className={inp} value={f.to} onChange={(e) => up("to", e.target.value)} /></div>
        {sel.length > 0 && <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-[#FAF6EC] border border-[#E8DFCE] rounded-lg"><b className="text-sm">{sel.length} selected</b><select className={cx(inp, "w-auto")} value={bulkSt} onChange={(e) => setBulkSt(e.target.value)}><option value="">Set status…</option>{STATUSES.map((x) => <option key={x}>{x}</option>)}</select><Btn kind="gold" disabled={!bulkSt} onClick={bulk}>Apply</Btn><Btn kind="ghost" onClick={() => setSel([])}>Clear</Btn></div>}
        <State s={s} reload={reload}>{d && (d.items.length ? <>
          <Table head={<><Th><input type="checkbox" aria-label="Select all" className="accent-[#B8975A]" checked={ids.length > 0 && ids.every((i) => sel.includes(i))} onChange={(e) => setSel(e.target.checked ? ids : [])} /></Th><Th>Order</Th><Th>Customer</Th><Th>Location</Th><Th>Products</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th>Date</Th></>}>
            {d.items.map((o) => <tr key={o.id} className="hover:bg-[#FAF6EC] cursor-pointer" onClick={() => setOpen(o.id)}>
              <Td><input type="checkbox" aria-label={`Select ${o.id}`} className="accent-[#B8975A]" checked={sel.includes(o.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => setSel((x) => (e.target.checked ? [...x, o.id] : x.filter((i) => i !== o.id)))} /></Td>
              <Td className="font-medium whitespace-nowrap">{o.id}</Td><Td><p>{o.customer.name}</p><p className="text-xs text-[#8A8173]">{o.customer.phone}</p></Td>
              <Td className="max-w-[170px]"><p className="truncate text-xs">{o.address}</p><p className="text-xs text-[#8A8173]">{o.zone}</p></Td>
              <Td className="text-xs max-w-[180px]"><p className="truncate">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</p></Td>
              <Td className="whitespace-nowrap font-medium">{money(o.total)}</Td><Td><p className="text-xs">{o.payment}</p><Badge>{o.paymentStatus}</Badge></Td><Td><Badge>{o.status}</Badge></Td><Td className="text-xs whitespace-nowrap">{fdate(o.createdAt)}</Td>
            </tr>)}</Table>
          <Pager page={d.page} pages={d.pages} onChange={(n) => up("page", n)} /></> : <Empty text="No orders found." />)}</State>
      </Card>
      {open && <OrderModal id={open} onClose={() => setOpen(null)} onChanged={reload} />}
    </>
  );
}

// ============================================================
// Customers
// ============================================================
function Customers() {
  const [f, setF] = useState({ q: "", page: 1 });
  const [s, reload] = useApi(`/customers?${qs(f)}`);
  const [open, setOpen] = useState(null); const [det, setDet] = useState(null);
  useEffect(() => { if (!open) return setDet(null); call(`/customers/${encodeURIComponent(open)}`).then(setDet).catch((e) => { toast(e.message, true); setOpen(null); }); }, [open]);
  const d = s.data;
  return (
    <>
      <PageHead title="Customers" sub="Built from real order records." />
      <Card><SearchBox onChange={(v) => setF({ q: v, page: 1 })} placeholder="Name, phone or email" className="mb-4 max-w-sm" />
        <State s={s} reload={reload}>{d && (d.items.length ? <><Table head={<><Th>Customer</Th><Th>Phone</Th><Th>Email</Th><Th>Address</Th><Th>Orders</Th><Th>Total spent</Th><Th>Recent order</Th></>}>
          {d.items.map((c) => <tr key={c._id} className="hover:bg-[#FAF6EC] cursor-pointer" onClick={() => setOpen(c._id)}><Td className="font-medium">{c.name}</Td><Td>{c._id}</Td><Td className="text-xs">{c.email || "—"}</Td><Td className="text-xs max-w-[200px] truncate">{c.address}</Td><Td>{c.orders}</Td><Td>{money(c.spent)}</Td><Td className="text-xs whitespace-nowrap">{c.recentOrder}<br /><span className="text-[#8A8173]">{fdate(c.last)}</span></Td></tr>)}</Table>
          <Pager page={d.page} pages={d.pages} onChange={(n) => setF({ ...f, page: n })} /></> : <Empty text="No customers yet. They appear after their first order." />)}</State></Card>
      {open && <Modal wide title={det?.customer.name || "Customer"} onClose={() => setOpen(null)}>{!det ? <Spinner /> : <>
        <div className="grid sm:grid-cols-4 gap-3 mb-5 text-sm"><div><p className="text-[11px] uppercase tracking-widest text-[#8A8173]">Phone</p>{det.customer.phone}</div><div><p className="text-[11px] uppercase tracking-widest text-[#8A8173]">Email</p>{det.customer.email || "—"}</div><div><p className="text-[11px] uppercase tracking-widest text-[#8A8173]">Orders</p>{det.customer.orders}</div><div><p className="text-[11px] uppercase tracking-widest text-[#8A8173]">Spent</p>{money(det.customer.spent)}</div><div className="sm:col-span-4"><p className="text-[11px] uppercase tracking-widest text-[#8A8173]">Latest address</p>{det.customer.address}</div></div>
        <Table head={<><Th>Order</Th><Th>Date</Th><Th>Items</Th><Th>Total</Th><Th>Status</Th></>}>{det.orders.map((o) => <tr key={o.id}><Td className="font-medium">{o.id}</Td><Td className="text-xs">{fdate(o.createdAt)}</Td><Td className="text-xs">{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</Td><Td>{money(o.total)}</Td><Td><Badge>{o.status}</Badge></Td></tr>)}</Table></>}</Modal>}
    </>
  );
}

// ============================================================
// Homepage management
// ============================================================
function PickList({ title, hint, products, ids, setIds }) {
  const [q, setQ] = useState("");
  const shown = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Card title={title} action={<span className="text-xs text-[#8A8173]">{ids.length} selected</span>}>
      <p className="text-xs text-[#8A8173] mb-3">{hint}</p><input className={cx(inp, "mb-3")} placeholder="Filter products" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-72 overflow-y-auto divide-y divide-[#F0E9DA]">{shown.map((p) => <label key={p.id} className="flex items-center gap-3 py-2 cursor-pointer"><input type="checkbox" className="accent-[#B8975A]" checked={ids.includes(p.id)} onChange={(e) => setIds(e.target.checked ? [...ids, p.id] : ids.filter((i) => i !== p.id))} /><Thumb src={p.images[0]} className="w-8 h-10" /><span className="text-sm flex-1 truncate">{p.name}</span>{!p.published && <Badge k="Draft">Draft</Badge>}</label>)}</div>
    </Card>
  );
}
function Homepage() {
  const [b, breload] = useApi("/banners");
  const [p, preload] = useApi("/products?limit=500&sort=name");
  const [st, streload] = useApi("/settings");
  const [m, setM] = useState(null); const [sets, setSets] = useState(null); const [nl, setNl] = useState(null); const [busy, setBusy] = useState(false);
  const items = b.data?.items || [], prods = p.data?.items || [];
  useEffect(() => { if (prods.length) setSets({ featured: prods.filter((x) => x.featured).map((x) => x.id), trending: prods.filter((x) => x.trending).map((x) => x.id), newArrival: prods.filter((x) => x.newArrival).map((x) => x.id) }); }, [p.data]); // eslint-disable-line
  useEffect(() => { if (st.data) setNl({ title: st.data.newsletter?.title || "", text: st.data.newsletter?.text || "" }); }, [st.data]);
  const saveB = async () => { setBusy(true); try { await call(m._id ? `/banners/${m._id}` : "/banners", { method: m._id ? "PUT" : "POST", body: m }); toast("Banner saved"); setM(null); breload(); } catch (e) { toast(e.message, true); } setBusy(false); };
  const move = async (i, d) => { const a = items.map((x) => x._id); [a[i], a[i + d]] = [a[i + d], a[i]]; try { await call("/banners/reorder", { method: "POST", body: { ids: a } }); breload(); } catch (e) { toast(e.message, true); } };
  const toggle = async (x) => { try { await call(`/banners/${x._id}`, { method: "PUT", body: { ...x, active: !x.active } }); breload(); } catch (e) { toast(e.message, true); } };
  const del = async (x) => { if (!(await confirmBox(`Delete banner "${x.title}"?`, "Delete"))) return; try { await call(`/banners/${x._id}`, { method: "DELETE" }); toast("Banner deleted"); breload(); } catch (e) { toast(e.message, true); } };
  const saveFlags = async () => { try { await call("/homepage/flags", { method: "PUT", body: sets }); toast("Homepage product sections saved"); preload(); } catch (e) { toast(e.message, true); } };
  const saveNl = async () => { try { await call("/settings", { method: "PUT", body: { ...st.data, newsletter: nl } }); toast("Newsletter text saved"); streload(); } catch (e) { toast(e.message, true); } };
  return (
    <>
      <PageHead title="Homepage Management" sub="Controls the sections your storefront homepage actually has."><Btn kind="gold" onClick={() => setM({ title: "", subtitle: "", image: "", button: "Start Shopping", link: "/shop", active: true })}><FaPlus size={11} />Add banner</Btn></PageHead>
      <Card title="Hero banners" className="mb-5"><State s={b} reload={breload}>{items.length ? items.map((x, i) => <div key={x._id} className="flex items-center gap-3 py-3 border-b border-[#F0E9DA] last:border-0 flex-wrap"><div className="flex"><Btn kind="ghost" disabled={i === 0} aria-label="Move up" onClick={() => move(i, -1)}><FaArrowUp size={11} /></Btn><Btn kind="ghost" disabled={i === items.length - 1} aria-label="Move down" onClick={() => move(i, 1)}><FaArrowDown size={11} /></Btn></div><Thumb src={x.image} className="w-24 h-14" /><div className="flex-1 min-w-[160px]"><p className="font-medium text-sm">{x.title}</p><p className="text-xs text-[#8A8173] truncate max-w-md">{x.subtitle}</p><p className="text-xs text-[#8F7240]">{x.button} → {x.link}</p></div><Toggle on={x.active} label="Enable" onChange={() => toggle(x)} /><Btn kind="ghost" aria-label="Edit" onClick={() => setM(x)}><FaEdit /></Btn><Btn kind="ghost" aria-label="Delete" className="text-red-600" onClick={() => del(x)}><FaTrashAlt /></Btn></div>) : <Empty text="No banners. The storefront will show none until you add one." />}</State></Card>
      <State s={p} reload={preload}>{sets && <><div className="grid lg:grid-cols-3 gap-4 mb-3">
        <PickList title="Featured products" hint="Shown in “Featured Products” (first 8)." products={prods} ids={sets.featured} setIds={(v) => setSets({ ...sets, featured: v })} />
        <PickList title="Trending products" hint="Shown in the “Trending Now” carousel." products={prods} ids={sets.trending} setIds={(v) => setSets({ ...sets, trending: v })} />
        <PickList title="New arrivals" hint="Shows the “New” badge on product cards." products={prods} ids={sets.newArrival} setIds={(v) => setSets({ ...sets, newArrival: v })} /></div>
        <Btn kind="gold" onClick={saveFlags}><FaCheck size={11} />Save product sections</Btn></>}</State>
      {nl && <Card title="Newsletter section" className="mt-5"><div className="grid gap-3 max-w-xl"><Field label="Heading"><input className={inp} value={nl.title} onChange={(e) => setNl({ ...nl, title: e.target.value })} /></Field><Field label="Text"><textarea rows={2} className={inp} value={nl.text} onChange={(e) => setNl({ ...nl, text: e.target.value })} /></Field><div><Btn kind="dark" onClick={saveNl}>Save</Btn></div></div></Card>}
      {m && <Modal title={m._id ? "Edit banner" : "Add banner"} onClose={() => setM(null)} footer={<><Btn kind="line" onClick={() => setM(null)}>Cancel</Btn><Btn kind="gold" disabled={busy} onClick={saveB}>Save banner</Btn></>}>
        <div className="space-y-4"><Field label="Heading *"><input className={inp} value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} /></Field><Field label="Subtitle"><textarea rows={2} className={inp} value={m.subtitle || ""} onChange={(e) => setM({ ...m, subtitle: e.target.value })} /></Field><Field label="Image *"><ImageField value={m.image} onChange={(v) => setM({ ...m, image: v })} /></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Button text"><input className={inp} value={m.button || ""} onChange={(e) => setM({ ...m, button: e.target.value })} /></Field><Field label="Button link" hint="e.g. /shop or /category/abaya"><input className={inp} value={m.link || ""} onChange={(e) => setM({ ...m, link: e.target.value })} /></Field></div>
          <Field label="Image focus"><select className={inp} value={m.pos || "center"} onChange={(e) => setM({ ...m, pos: e.target.value })}>{["center", "center top", "center 30%", "center bottom"].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Check label="Enabled" checked={m.active !== false} onChange={(e) => setM({ ...m, active: e.target.checked })} /></div></Modal>}
    </>
  );
}

// ============================================================
// Coupons
// ============================================================
function Coupons() {
  const [s, reload] = useApi("/coupons");
  const [m, setM] = useState(null); const [busy, setBusy] = useState(false);
  const today = s.data?.today || "";
  const status = (c) => (!c.active ? "Inactive" : c.expiresAt && c.expiresAt < today ? "Expired" : c.startsAt && c.startsAt > today ? "Scheduled" : "Active");
  const save = async () => { setBusy(true); try { await call(m._id ? `/coupons/${m._id}` : "/coupons", { method: m._id ? "PUT" : "POST", body: m }); toast("Coupon saved"); setM(null); reload(); } catch (e) { toast(e.message, true); } setBusy(false); };
  const del = async (c) => { if (!(await confirmBox(`Delete coupon ${c.code}?`, "Delete"))) return; try { await call(`/coupons/${c._id}`, { method: "DELETE" }); reload(); } catch (e) { toast(e.message, true); } };
  const set = (k) => (e) => setM({ ...m, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  return (
    <>
      <PageHead title="Coupons & Discounts" sub="Validated on the server at checkout."><Btn kind="gold" onClick={() => setM({ code: "", type: "percent", value: "", minOrder: 0, maxDiscount: 0, startsAt: "", expiresAt: "", usageLimit: 0, active: true })}><FaPlus size={11} />Add coupon</Btn></PageHead>
      <Card><State s={s} reload={reload}>{s.data?.items.length ? <Table head={<><Th>Code</Th><Th>Discount</Th><Th>Min. order</Th><Th>Valid</Th><Th>Used</Th><Th>Status</Th><Th className="text-right">Actions</Th></>}>
        {s.data.items.map((c) => <tr key={c._id}><Td className="font-medium">{c.code}</Td><Td>{c.type === "percent" ? `${c.value}%${c.maxDiscount ? ` (max ${money(c.maxDiscount)})` : ""}` : money(c.value)}</Td><Td>{c.minOrder ? money(c.minOrder) : "—"}</Td><Td className="text-xs">{c.startsAt || "any time"} → {c.expiresAt || "no expiry"}</Td><Td>{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Td><Td><Badge>{status(c)}</Badge></Td><Td className="text-right whitespace-nowrap"><Btn kind="ghost" aria-label="Edit" onClick={() => setM(c)}><FaEdit /></Btn><Btn kind="ghost" aria-label="Delete" className="text-red-600" onClick={() => del(c)}><FaTrashAlt /></Btn></Td></tr>)}</Table> : <Empty text="No coupons yet." />}</State></Card>
      {m && <Modal title={m._id ? "Edit coupon" : "Add coupon"} onClose={() => setM(null)} footer={<><Btn kind="line" onClick={() => setM(null)}>Cancel</Btn><Btn kind="gold" disabled={busy} onClick={save}>Save coupon</Btn></>}>
        <div className="grid sm:grid-cols-2 gap-4"><Field label="Code *"><input className={cx(inp, "uppercase")} value={m.code} onChange={set("code")} /></Field><Field label="Type"><select className={inp} value={m.type} onChange={set("type")}><option value="percent">Percentage</option><option value="flat">Fixed amount (৳)</option></select></Field>
          <Field label={m.type === "percent" ? "Percent off *" : "Amount off (৳) *"}><input type="number" min="0" className={inp} value={m.value} onChange={set("value")} /></Field><Field label="Minimum order (৳)"><input type="number" min="0" className={inp} value={m.minOrder} onChange={set("minOrder")} /></Field>
          {m.type === "percent" && <Field label="Maximum discount (৳)" hint="0 = no cap"><input type="number" min="0" className={inp} value={m.maxDiscount} onChange={set("maxDiscount")} /></Field>}
          <Field label="Usage limit" hint="0 = unlimited"><input type="number" min="0" className={inp} value={m.usageLimit} onChange={set("usageLimit")} /></Field><Field label="Start date"><input type="date" className={inp} value={m.startsAt || ""} onChange={set("startsAt")} /></Field><Field label="Expiry date"><input type="date" className={inp} value={m.expiresAt || ""} onChange={set("expiresAt")} /></Field>
          <div className="sm:col-span-2"><Check label="Active" checked={m.active !== false} onChange={set("active")} /></div></div></Modal>}
    </>
  );
}

// ============================================================
// Reviews
// ============================================================
function Reviews() {
  const [status, setStatus] = useState("");
  const [s, reload] = useApi(`/reviews?${qs({ status })}`);
  const act = async (r, approved) => { try { await call(`/reviews/${r._id}`, { method: "PATCH", body: { approved } }); toast(approved ? "Review approved" : "Review hidden"); reload(); } catch (e) { toast(e.message, true); } };
  const del = async (r) => { if (!(await confirmBox(`Delete the review by ${r.name}?`, "Delete"))) return; try { await call(`/reviews/${r._id}`, { method: "DELETE" }); reload(); } catch (e) { toast(e.message, true); } };
  return (
    <>
      <PageHead title="Reviews" sub="Only approved reviews are shown on the storefront."><select className={cx(inp, "w-auto")} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All reviews</option><option value="approved">Approved</option><option value="hidden">Hidden</option></select></PageHead>
      <Card><State s={s} reload={reload}>{s.data?.items.length ? <Table head={<><Th>Customer</Th><Th>Product</Th><Th>Rating</Th><Th>Review</Th><Th>Status</Th><Th className="text-right">Actions</Th></>}>
        {s.data.items.map((r) => <tr key={r._id}><Td><p className="font-medium">{r.name}</p><p className="text-xs text-[#8A8173]">{r.city}</p></Td><Td className="text-xs">{r.productName || "General"}</Td><Td className="whitespace-nowrap text-[#B8975A]">{"★".repeat(r.rating)}<span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span></Td><Td className="text-xs max-w-[320px]">{r.text}</Td><Td><Badge k={r.approved ? "Approved" : "Hidden"}>{r.approved ? "Approved" : "Hidden"}</Badge></Td>
          <Td className="text-right whitespace-nowrap">{r.approved ? <Btn kind="ghost" aria-label="Hide" onClick={() => act(r, false)}><FaEyeSlash /></Btn> : <Btn kind="ghost" aria-label="Approve" onClick={() => act(r, true)}><FaEye /></Btn>}<Btn kind="ghost" aria-label="Delete" className="text-red-600" onClick={() => del(r)}><FaTrashAlt /></Btn></Td></tr>)}</Table> : <Empty text="No reviews." />}</State></Card>
    </>
  );
}

// ============================================================
// Reports
// ============================================================
function Reports() {
  const [r, setR] = useRange();
  const [s, reload] = useApi(`/analytics?${qs({ from: r.from, to: r.to, group: r.group })}`);
  const a = s.data;
  const exp = () => downloadCsv(`report-${r.from}-to-${r.to}.csv`, [["Period", "Orders", "Revenue"], ...a.series.map((x) => [x._id, x.orders, x.revenue]), [], ["Product", "Units sold", "Revenue"], ...a.topProducts.map((p) => [p.name, p.qty, p.revenue]), [], ["Category", "Units sold", "Revenue"], ...a.topCategories.map((c) => [c.name, c.qty, c.revenue])]);
  return (
    <>
      <PageHead title="Reports & Analytics" sub="Calculated from real orders. Cancelled and refunded orders are excluded from revenue."><Btn kind="line" disabled={!a} onClick={exp}><FaDownload size={11} />Export CSV</Btn></PageHead>
      <RangeBar r={r} set={setR} />
      <State s={s} reload={reload}>{a && <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4"><Stat accent label="Total revenue" value={money(a.totals.revenue)} /><Stat label="Total orders" value={a.totals.orders} /><Stat label="Average order value" value={money(a.totals.aov)} /><Stat label="Cancelled orders" value={a.totals.cancelled} /></div>
        <Card title={`${{ day: "Daily", week: "Weekly", month: "Monthly" }[r.group]} sales`} className="mb-4"><Bars rows={a.series} />{a.series.length > 0 && <div className="mt-4"><Table head={<><Th>Period</Th><Th>Orders</Th><Th>Revenue</Th></>}>{a.series.map((x) => <tr key={x._id}><Td>{x._id}</Td><Td>{x.orders}</Td><Td>{money(x.revenue)}</Td></tr>)}</Table></div>}</Card>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <Card title="Best-selling products">{a.topProducts.length ? <Table head={<><Th>Product</Th><Th>Units</Th><Th>Revenue</Th></>}>{a.topProducts.map((p) => <tr key={p._id}><Td>{p.name}</Td><Td>{p.qty}</Td><Td>{money(p.revenue)}</Td></tr>)}</Table> : <Empty text="No sales in this period." />}</Card>
          <Card title="Best-performing categories">{a.topCategories.length ? <Table head={<><Th>Category</Th><Th>Units</Th><Th>Revenue</Th></>}>{a.topCategories.map((c) => <tr key={c.slug}><Td>{c.name}</Td><Td>{c.qty}</Td><Td>{money(c.revenue)}</Td></tr>)}</Table> : <Empty text="No sales in this period." />}</Card>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title="Customers">{[["Total customers", a.customers.total], ["New in period", a.customers.newInRange], ["Returning customers", a.customers.returning]].map(([k, v]) => <div key={k} className="flex justify-between py-2 text-sm border-b border-[#F0E9DA] last:border-0"><span className="text-[#8A8173]">{k}</span><b>{v}</b></div>)}</Card>
          <Card title="Inventory summary">{[["Units in stock", a.inventory.units], ["Low-stock products", a.inventory.low], ["Out-of-stock products", a.inventory.out], ["Total products", a.totals.products]].map(([k, v]) => <div key={k} className="flex justify-between py-2 text-sm border-b border-[#F0E9DA] last:border-0"><span className="text-[#8A8173]">{k}</span><b>{v}</b></div>)}</Card>
        </div></>}</State>
    </>
  );
}

// ============================================================
// Settings + Profile
// ============================================================
function Settings() {
  const [s, reload] = useApi("/settings");
  const [f, setF] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { if (s.data) setF(JSON.parse(JSON.stringify(s.data))); }, [s.data]);
  const set = (sec, k) => (e) => setF((x) => ({ ...x, [sec]: { ...x[sec], [k]: e.target.value } }));
  const zone = (i, k, v) => setF((x) => ({ ...x, zones: x.zones.map((z, n) => (n === i ? { ...z, [k]: v } : z)) }));
  const save = async () => { setBusy(true); try { await call("/settings", { method: "PUT", body: f }); toast("Settings saved"); reload(); } catch (e) { toast(e.message, true); } setBusy(false); };
  const T = ({ sec, k, label, ...p }) => <Field label={label}><input className={inp} value={f[sec]?.[k] || ""} onChange={set(sec, k)} {...p} /></Field>;
  return (
    <>
      <PageHead title="Store Settings"><Btn kind="gold" disabled={busy || !f} onClick={save}><FaCheck size={11} />{busy ? "Saving…" : "Save settings"}</Btn></PageHead>
      <State s={s} reload={reload}>{f && <div className="grid xl:grid-cols-2 gap-4">
        <Card title="Store"><div className="grid gap-3"><T sec="brand" k="name" label="Store name" /><T sec="brand" k="tagline" label="Tagline" /><Field label="Description"><textarea rows={3} className={inp} value={f.brand.description || ""} onChange={set("brand", "description")} /></Field><Field label="Logo"><ImageField value={f.brand.logo || ""} onChange={(v) => setF({ ...f, brand: { ...f.brand, logo: v } })} /></Field>
          <Field label="Low-stock threshold" hint="Products at or below this are flagged"><input type="number" min="0" className={cx(inp, "max-w-[120px]")} value={f.lowStock} onChange={(e) => setF({ ...f, lowStock: e.target.value })} /></Field></div></Card>
        <Card title="Contact"><div className="grid sm:grid-cols-2 gap-3"><T sec="contact" k="phone" label="Phone (dial format)" /><T sec="contact" k="phoneDisplay" label="Phone (display)" /><T sec="contact" k="email" label="Email" /><T sec="contact" k="hours" label="Opening hours" /><div className="sm:col-span-2"><T sec="contact" k="address" label="Address" /></div></div></Card>
        <Card title="Social links"><div className="grid gap-3">{[["facebook", "Facebook"], ["instagram", "Instagram"], ["whatsapp", "WhatsApp link"], ["youtube", "YouTube"], ["tiktok", "TikTok"]].map(([k, l]) => <T key={k} sec="contact" k={k} label={l} placeholder="https://" />)}</div></Card>
        <Card title="Delivery charges" action={<Btn kind="line" onClick={() => setF({ ...f, zones: [...f.zones, { id: "", label: "", fee: 0, note: "" }] })}><FaPlus size={10} />Zone</Btn>}>
          {f.zones.map((z, i) => <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2 mb-3 items-end"><Field label="Zone name"><input className={inp} value={z.label} onChange={(e) => zone(i, "label", e.target.value)} /></Field><Field label="Fee ৳"><input type="number" min="0" className={inp} value={z.fee} onChange={(e) => zone(i, "fee", e.target.value)} /></Field><Btn kind="ghost" aria-label="Remove zone" disabled={f.zones.length < 2} onClick={() => setF({ ...f, zones: f.zones.filter((_, n) => n !== i) })}><FaTrashAlt size={12} /></Btn><Field label="Delivery note" className="col-span-3"><input className={inp} value={z.note || ""} onChange={(e) => zone(i, "note", e.target.value)} /></Field></div>)}</Card>
        <Card title="Policies" className="xl:col-span-2"><div className="grid md:grid-cols-2 gap-3">{[["delivery", "Delivery information"], ["exchange", "Exchange policy"], ["returns", "Return policy"], ["privacy", "Privacy policy"], ["terms", "Terms & conditions"]].map(([k, l]) => <Field key={k} label={l}><textarea rows={4} className={inp} value={f.policies?.[k] || ""} onChange={set("policies", k)} /></Field>)}</div><p className="text-xs text-[#8A8173] mt-3">Delivery and exchange text appear in the product-page accordions. Other policies are stored for later use.</p></Card>
      </div>}</State>
    </>
  );
}
function Profile({ me, setMe }) {
  const [f, setF] = useState({ name: me.name, email: me.email, currentPassword: "", newPassword: "" }); const [busy, setBusy] = useState(false);
  const save = async () => { setBusy(true); try { const r = await call("/profile", { method: "PUT", body: f }); setMe(r.admin); setF({ ...f, currentPassword: "", newPassword: "" }); toast("Profile updated"); } catch (e) { toast(e.message, true); } setBusy(false); };
  return (
    <><PageHead title="Admin Profile" />
      <Card className="max-w-xl"><div className="grid gap-4"><Field label="Name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Email"><input className={inp} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <div className="border-t border-[#E8DFCE] pt-4 grid gap-4"><p className="text-sm font-medium">Change password</p><Field label="Current password"><input type="password" autoComplete="current-password" className={inp} value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} /></Field><Field label="New password" hint="At least 10 characters. Other sessions are signed out."><input type="password" autoComplete="new-password" className={inp} value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} /></Field></div>
        <div><Btn kind="gold" disabled={busy} onClick={save}>Save changes</Btn></div></div></Card></>
  );
}

// ============================================================
// Login / first-owner setup
// ============================================================
function Login({ boot, onDone, retry }) {
  const [f, setF] = useState({ name: "", email: "", password: "", token: "" }); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await call(boot.needsSetup ? "/setup" : "/login", { method: "POST", body: f }); CSRF = r.csrf; onDone(r.admin); } catch (x) { setErr(x.message); }
    setBusy(false);
  };
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F5F0E7] font-sans text-[#26231F]">
      <div className="hidden lg:flex flex-col justify-between bg-[#1F1D1A] text-white p-14">
        <p className="font-serif text-3xl">Elysian-Raiment</p>
        <div><p className="text-[11px] tracking-[0.35em] uppercase text-[#C9A96A] mb-4">Store administration</p><h1 className="font-serif text-5xl leading-[1.1]">Run your whole business from one quiet place.</h1></div>
        <p className="text-sm text-white/50">Products · Orders · Stock · Customers</p>
      </div>
      <div className="flex items-center justify-center p-6">
        {boot.error ? <div className="max-w-sm text-center"><p className="text-red-600 text-sm">{boot.error}</p><Btn className="mt-4" onClick={retry}>Retry</Btn></div> :
          <form onSubmit={submit} className="w-full max-w-sm bg-white border border-[#E8DFCE] rounded-xl p-7 shadow-sm space-y-4">
            <h2 className="font-serif text-3xl">{boot.needsSetup ? "Create owner account" : "Admin sign in"}</h2>
            {boot.needsSetup && <><p className="text-xs text-[#8A8173]">First-time setup. Enter the SETUP_TOKEN from your backend .env file.</p><Field label="Setup token"><input type="password" required className={inp} value={f.token} onChange={(e) => setF({ ...f, token: e.target.value })} /></Field><Field label="Your name"><input className={inp} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field></>}
            <Field label="Email"><input type="email" required autoComplete="username" className={inp} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Password" hint={boot.needsSetup ? "At least 10 characters" : ""}><input type="password" required autoComplete={boot.needsSetup ? "new-password" : "current-password"} className={inp} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Btn type="submit" className="w-full py-3" disabled={busy}>{busy ? "Please wait…" : boot.needsSetup ? "Create account" : "Sign in"}</Btn>
          </form>}
      </div>
    </div>
  );
}

// ============================================================
// Shell
// ============================================================
const NAV = [["dashboard", "Dashboard", FaTachometerAlt], ["products", "Products", FaBoxOpen], ["categories", "Categories", FaTags], ["inventory", "Inventory", FaWarehouse], ["orders", "Orders", FaClipboardList], ["customers", "Customers", FaUsers], ["homepage", "Homepage Management", FaImages], ["coupons", "Coupons & Discounts", FaTicketAlt], ["reviews", "Reviews", FaStar], ["reports", "Reports & Analytics", FaChartLine], ["settings", "Store Settings", FaCog], ["profile", "Admin Profile", FaUserCircle]];
const PAGES = { dashboard: Dashboard, products: Products, categories: Categories, inventory: Inventory, orders: Orders, customers: Customers, homepage: Homepage, coupons: Coupons, reviews: Reviews, reports: Reports, settings: Settings, profile: Profile };

export default function Admin() {
  const [me, setMe] = useState(undefined);
  const [boot, setBoot] = useState({ needsSetup: false, error: "" });
  const [page, setPage] = useState(() => window.location.hash.slice(1) || "dashboard");
  const [collapsed, setCollapsed] = useState(false); const [mobile, setMobile] = useState(false);
  const [toasts, setToasts] = useState([]); const [conf, setConf] = useState(null);
  const init = useCallback(async () => {
    setMe(undefined); setBoot({ needsSetup: false, error: "" });
    try { const r = await call("/me"); CSRF = r.csrf; setMe(r.admin); }
    catch { try { const s = await call("/setup-status"); setBoot({ needsSetup: s.needsSetup, error: "" }); setMe(null); } catch { setBoot({ needsSetup: false, error: "Cannot reach the backend. Start it with “npm run dev” inside the backend folder." }); setMe(null); } }
  }, []);
  useEffect(() => {
    init();
    const t = (e) => { const id = Math.random(); setToasts((x) => [...x, { id, ...e.detail }]); setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3800); };
    const c = (e) => setConf(e.detail), u = () => { CSRF = ""; setMe(null); toast("Your session has expired. Please sign in again.", true); }, h = () => setPage(window.location.hash.slice(1) || "dashboard");
    window.addEventListener("rg-toast", t); window.addEventListener("rg-confirm", c); window.addEventListener("rg-401", u); window.addEventListener("hashchange", h);
    return () => { window.removeEventListener("rg-toast", t); window.removeEventListener("rg-confirm", c); window.removeEventListener("rg-401", u); window.removeEventListener("hashchange", h); };
  }, [init]);
  const go = (p) => { window.location.hash = p; setPage(p); setMobile(false); };
  const logout = async () => { try { await call("/logout", { method: "POST" }); } catch { /* ignore */ } CSRF = ""; setMe(null); init(); };
  const Toasts = <div className="fixed bottom-5 right-5 z-[100] space-y-2">{toasts.map((x) => <div key={x.id} className={cx("px-4 py-3 rounded-md text-sm text-white shadow-xl max-w-xs", x.err ? "bg-red-700" : "bg-[#26231F]")}>{x.m}</div>)}</div>;
  if (me === undefined) return <div className="min-h-screen bg-[#F5F0E7]"><Spinner /></div>;
  if (!me) return <><Login boot={boot} onDone={setMe} retry={init} />{Toasts}</>;
  const Page = PAGES[page] || Dashboard;
  const Side = ({ mini }) => (
    <div className="h-full flex flex-col bg-[#1F1D1A] text-white">
      <div className={cx("h-16 flex items-center border-b border-white/10 shrink-0", mini ? "justify-center" : "px-5")}><span className="font-serif text-2xl">{mini ? "ER" : "Elysian-Raiment"}</span>{!mini && <span className="ml-2 text-[10px] tracking-widest uppercase text-[#C9A96A]">Admin</span>}</div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">{NAV.map(([k, l, I]) => <button key={k} onClick={() => go(k)} title={l} className={cx("w-full flex items-center gap-3 rounded-md py-2.5 text-sm transition", mini ? "justify-center" : "px-3", page === k ? "bg-[#B8975A] text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}><I size={15} />{!mini && l}</button>)}</nav>
      <div className="p-2 border-t border-white/10"><button onClick={logout} title="Logout" className={cx("w-full flex items-center gap-3 rounded-md py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white", mini ? "justify-center" : "px-3")}><FaSignOutAlt size={15} />{!mini && "Logout"}</button></div>
    </div>
  );
  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#26231F] font-sans">
      <aside className={cx("hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-200", collapsed ? "w-[72px]" : "w-64")}><Side mini={collapsed} /></aside>
      {mobile && <><div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobile(false)} /><aside className="lg:hidden fixed inset-y-0 left-0 z-[60] w-72"><Side /></aside></>}
      <div className={cx("transition-all duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-30 h-16 bg-[#FFFCF7]/90 backdrop-blur border-b border-[#E8DFCE] flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-2"><button className="lg:hidden w-10 h-10 flex items-center justify-center" onClick={() => setMobile(true)} aria-label="Open menu"><FaBars /></button><button className="hidden lg:flex w-10 h-10 items-center justify-center hover:bg-[#F1EADB] rounded-md" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar"><FaBars /></button><span className="font-serif text-lg hidden sm:block">{NAV.find((n) => n[0] === page)?.[1]}</span></div>
          <div className="flex items-center gap-3"><a href="/" target="_blank" rel="noreferrer" className="text-sm flex items-center gap-1.5 hover:text-[#8F7240]"><FaExternalLinkAlt size={11} />View store</a><div className="w-9 h-9 rounded-full bg-[#26231F] text-[#E3C792] flex items-center justify-center text-sm font-medium" title={me.email}>{me.name?.[0]?.toUpperCase()}</div></div>
        </header>
        <main className="p-4 sm:p-8 max-w-[1400px]"><Page key={page} go={go} me={me} setMe={setMe} /></main>
      </div>
      {conf && <Modal title="Please confirm" onClose={() => { conf.res(false); setConf(null); }} footer={<><Btn kind="line" onClick={() => { conf.res(false); setConf(null); }}>Cancel</Btn><Btn kind={/delete/i.test(conf.label) ? "red" : "gold"} onClick={() => { conf.res(true); setConf(null); }}>{conf.label}</Btn></>}><p className="text-sm">{conf.msg}</p></Modal>}
      {Toasts}
    </div>
  );
}