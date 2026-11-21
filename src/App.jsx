import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { StoreProvider, useStore } from "./store.jsx";
import { MainLayout, ScrollManager } from "./components.jsx";
import { Toast, Spinner, Container, btnDark } from "./ui.jsx";

const Admin = lazy(() => import("./Admin.jsx"));
const Home = lazy(() => import("./pages/Home.jsx"));
const Shop = lazy(() => import("./pages/Shop.jsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.jsx"));
const CartPage = lazy(() => import("./pages/Checkout.jsx").then((m) => ({ default: m.CartPage })));
const Checkout = lazy(() => import("./pages/Checkout.jsx").then((m) => ({ default: m.Checkout })));
const OrderSuccess = lazy(() => import("./pages/Orders.jsx").then((m) => ({ default: m.OrderSuccess })));
const MyOrders = lazy(() => import("./pages/Orders.jsx").then((m) => ({ default: m.MyOrders })));
const About = lazy(() => import("./pages/About.jsx"));

// Wait for the catalogue from the API before rendering any storefront page
function Gate({ children }) {
  const { ready, loading, error, reload } = useStore();
  if (ready) return children;
  return (
    <div className="min-h-screen bg-[#F5F0E7] flex items-center justify-center">
      {loading ? <Spinner /> : (
        <Container className="text-center max-w-md">
          <h1 className="font-serif text-3xl">We couldn't load the store</h1>
          <p className="text-sm text-[#77736C] mt-3">{error || "Something went wrong."}</p>
          <button onClick={reload} className={`mt-6 px-8 py-3.5 text-sm ${btnDark}`}>Try again</button>
        </Container>
      )}
    </div>
  );
}

function Storefront() {
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <StoreProvider>
          <Gate>
            <ScrollManager />
            <Suspense fallback={<div className="min-h-screen bg-[#F5F0E7]"><Spinner /></div>}>
              <Routes>
                <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                <Route path="/shop" element={<MainLayout><Shop /></MainLayout>} />
                <Route path="/category/:categorySlug" element={<MainLayout><Shop /></MainLayout>} />
                <Route path="/product/:slug" element={<MainLayout><ProductPage /></MainLayout>} />
                <Route path="/cart" element={<MainLayout><CartPage /></MainLayout>} />
                <Route path="/checkout" element={<CheckoutShell />} />
                <Route path="/order-success/:orderId" element={<MainLayout><OrderSuccess /></MainLayout>} />
                <Route path="/my-orders" element={<MainLayout><MyOrders /></MainLayout>} />
                <Route path="/about" element={<MainLayout><About /></MainLayout>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Gate>
          <Toast />
        </StoreProvider>
      </HashRouter>
    </MotionConfig>
  );
}

function CheckoutShell() {
  const { brand } = useStore();
  return (
    <div className="min-h-screen bg-[#F5F0E7] text-[#222222]">
      <div className="py-4 text-center border-b border-[#E8DDCA] bg-[#FFFCF7]"><Link to="/" className="font-serif text-2xl">{brand.name}</Link></div>
      <Checkout />
    </div>
  );
}

export default function App() {
  // The admin panel lives at /admin (it uses the URL hash for its own pages)
  if (window.location.pathname.startsWith("/admin")) {
    return <Suspense fallback={<div className="min-h-screen bg-[#F5F0E7]"><Spinner /></div>}><Admin /></Suspense>;
  }
  return <Storefront />;
}