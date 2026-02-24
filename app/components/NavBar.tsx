"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const pathname = usePathname();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md py-4 border-b border-black/5"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center space-x-8 text-[11px] uppercase tracking-[0.2em] font-medium">
          <Link href="/shop" className="hover:opacity-50 transition-opacity">
            Shop
          </Link>
          <Link href="/about" className="hover:opacity-50 transition-opacity">
            About
          </Link>
          <Link href="#" className="hover:opacity-50 transition-opacity">
            Journal
          </Link>
        </div>

        {/* Logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
          <div className="font-serif text-3xl tracking-tighter flex items-baseline">
            <span className="font-bold">I</span>
            <span className="w-1.5 h-1.5 bg-black rounded-full mx-0.5"></span>
            <span className="font-bold">A</span>
          </div>
          <span className="text-[9px] uppercase tracking-[0.3em] mt-1 opacity-60">
            Clothing Store
          </span>
        </Link>

        {/* Icons */}
        <div className="flex items-center space-x-5">
          <button className="hidden sm:block hover:opacity-50 transition-opacity">
            <Search size={20} strokeWidth={1.5} />
          </button>

          <button className="hidden sm:block hover:opacity-50 transition-opacity">
            <User size={20} strokeWidth={1.5} />
          </button>

          <Link
            href="/cart"
            className="relative hover:opacity-50 transition-opacity"
          >
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed inset-0 bg-white z-60 p-8 flex flex-col"
          >
            <div className="flex justify-end">
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={32} strokeWidth={1} />
              </button>
            </div>

            <div className="flex flex-col space-y-8 mt-12 font-serif text-4xl italic">
              <Link href="/">Home</Link>
              <Link href="/shop">Shop All</Link>
              <Link href="/about">About I.A</Link>
              <Link href="/cart">
                My Bag ({cartCount})
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}