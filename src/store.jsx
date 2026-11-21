import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { api } from "./api.js";
import { BRAND, NEWSLETTER, INFO_SECTIONS, DELIVERY_ZONES } from "./data.js";

const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const loadList = (k) => { const value = load(k, []); return Array.isArray(value) ? value : []; };
const save = (k, value) => {
  try {
    localStorage.setItem(k, JSON.stringify(value));
  } catch (error) {
    console.warn(`Could not save ${k}.`, error);
  }
};
const BOOTSTRAP_KEY = "rg_store_bootstrap";
const isBootstrap = (data) => data && typeof data === "object"
  && Array.isArray(data.products)
  && Array.isArray(data.categories)
  && Array.isArray(data.banners)
  && Array.isArray(data.reviews)
  && data.home
  && Array.isArray(data.home.featuredIds)
  && Array.isArray(data.home.trendingIds);
const cacheBootstrap = (data) => {
  try {
    localStorage.setItem(BOOTSTRAP_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn("Could not cache store data.", error);
  }
};
export const lineKey = (i) => `${i.id}|${i.size}|${i.color || ""}`;
const Store = createContext(null);
export const useStore = () => useContext(Store);

export function StoreProvider({ children }) {
  const [boot, setBoot] = useState(() => {
    const cached = load(BOOTSTRAP_KEY, null);
    return { data: isBootstrap(cached) ? cached : null, loading: true, error: "" };
  });
  const [cart, setCart] = useState(() => loadList("rg_cart"));
  const [orders, setOrders] = useState(() => loadList("rg_orders"));
  const [toast, setToast] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const reload = useCallback(() => {
    setBoot((b) => ({ ...b, loading: true, error: "" }));
    return api("/public/bootstrap")
      .then((data) => {
        cacheBootstrap(data);
        setBoot({ data, loading: false, error: "" });
      })
      .catch((e) => setBoot((b) => ({ ...b, loading: false, error: e.message })));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => save("rg_cart", cart), [cart]);
  useEffect(() => save("rg_orders", orders), [orders]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);
  const notify = useCallback((msg, type = "ok") => setToast({ msg, type, k: Date.now() }), []);

  const d = boot.data;
  const products = useMemo(() => d?.products || [], [d]);
  const categories = useMemo(() => d?.categories || [], [d]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const findProduct = useCallback((id) => byId.get(id), [byId]);
  const catName = useCallback((slug) => categories.find((c) => c.slug === slug)?.name || "", [categories]);

  const configuredBrand = d?.brand || {};
  const brand = {
    name: configuredBrand.name === "Elysan-Raiment" ? BRAND.name : configuredBrand.name || BRAND.name,
    tagline: configuredBrand.tagline || BRAND.tagline,
    description: configuredBrand.description || BRAND.description,
    ...configuredBrand,
  };
  if (brand.name === "Elysan-Raiment") brand.name = BRAND.name;
  const contact = d?.contact || {};
  const policies = d?.policies || {};
  const zones = d?.zones?.length ? d.zones : DELIVERY_ZONES;
  const newsletter = { ...NEWSLETTER, ...(d?.newsletter || {}) };
  const infoSections = useMemo(() => {
    const list = [
      { title: "Delivery Information", text: policies.delivery || INFO_SECTIONS[0].text },
      { title: "Exchange Information", text: policies.exchange || INFO_SECTIONS[1].text },
    ];
    if (policies.returns) list.push({ title: "Return Policy", text: policies.returns });
    return [...list, ...INFO_SECTIONS.slice(2)];
  }, [policies.delivery, policies.exchange, policies.returns]);

  const addToCart = useCallback((id, size, color = "", qty = 1, silent = false) => {
    const p = byId.get(id);
    if (!p) return;
    if (p.stock < 1) return notify("Sorry, this item is out of stock", "err");
    const col = color === "Default" ? "" : color;
    setCart((c) => {
      const ex = c.find((i) => lineKey(i) === lineKey({ id, size, color: col }));
      if (ex) return c.map((i) => (i === ex ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i));
      return [...c, { id, size, color: col, qty: Math.min(p.stock, qty) }];
    });
    if (!silent) notify(`${p.name} added to cart`);
  }, [byId, notify]);
  const setQty = (key, qty) => setCart((c) => c.map((i) => (lineKey(i) === key ? { ...i, qty: Math.max(1, Math.min(byId.get(i.id)?.stock || 1, qty)) } : i)));
  const removeItem = (key) => setCart((c) => c.filter((i) => lineKey(i) !== key));

  const lines = useMemo(() => cart.map((i) => ({ ...i, key: lineKey(i), product: byId.get(i.id) })).filter((l) => l.product && l.product.stock > 0), [cart, byId]);
  const subtotal = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const addOrder = (o) => setOrders((x) => [o, ...x]);
  const refreshOrders = useCallback(async () => {
    const ids = load("rg_orders", []).map((o) => o.id).slice(0, 20);
    if (!ids.length) return;
    try {
      const list = await api(`/orders/track?ids=${ids.join(",")}`);
      setOrders((cur) => cur.map((o) => { const t = list.find((x) => x.id === o.id); return t ? { ...o, status: t.status, cancelled: t.cancelled } : o; }));
    } catch { /* keep the last known status */ }
  }, []);

  return (
    <Store.Provider value={{
      loading: boot.loading, error: boot.error, ready: !!d, reload, products, categories, banners: d?.banners || [], reviews: d?.reviews || [], home: d?.home || { featuredIds: [], trendingIds: [] },
      findProduct, catName, brand, contact, policies, zones, newsletter, infoSections,
      cart, lines, subtotal, count, addToCart, setQty, removeItem, clearCart: () => setCart([]),
      orders, addOrder, refreshOrders, toast, notify, searchOpen, setSearchOpen,
    }}>{children}</Store.Provider>
  );
}