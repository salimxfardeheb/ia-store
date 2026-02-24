"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import Logo from "./logo";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop All" },
  { href: "/about", label: "About I.A" },
];

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cartCount } = useCart();
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md py-5 border-b border-black/5 lg:py-9">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center space-x-8 text-[11px] uppercase tracking-[0.2em] font-medium">
            <Link href="/shop" className="hover:opacity-50 transition-opacity">
              Shop
            </Link>
            <Link href="/about" className="hover:opacity-50 transition-opacity">
              About
            </Link>
          </div>

          {/* Logo */}
          <Link
            href="/"
            className="flex flex-col items-center absolute left-1/2 -translate-x-1/2"
          >
            <Logo color="#000000" size={52} />
            <span className="uppercase tracking-[0.2em] mt-0.5 opacity-60 text-[9px]">
              IA Store
            </span>
          </Link>

          {/* Icons */}
          <div className="flex items-center space-x-5">
            <Link
              href="/search"
              className="hidden sm:block hover:opacity-50 transition-opacity"
            >
              <Search size={20} strokeWidth={1.5} />
            </Link>
            <Link
              href="/user"
              className="hidden sm:block hover:opacity-50 transition-opacity"
            >
              <User size={20} strokeWidth={1.5} />
            </Link>
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
      </nav>

      {/* Mobile Menu — hors du <nav> pour éviter les conflits de z-index */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-60"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-white z-70 p-8 flex flex-col shadow-xl"
            >
              <button
                className="self-end mb-12"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={28} strokeWidth={1} />
              </button>

              <nav className="flex flex-col space-y-8 font-serif text-4xl italic">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={
                      pathname === href
                        ? "opacity-40"
                        : "hover:opacity-50 transition-opacity"
                    }
                  >
                    {label}
                  </Link>
                ))}
                <Link
                  href="/cart"
                  className={
                    pathname === "/cart"
                      ? "opacity-40"
                      : "hover:opacity-50 transition-opacity"
                  }
                >
                  My Bag ({cartCount})
                </Link>
              </nav>

              {/* Icons mobile */}
              <div className="flex items-center space-x-6 mt-auto pt-8 border-t border-black/10">
                <Link href="/search" onClick={() => setIsMobileMenuOpen(false)}>
                  <Search size={22} strokeWidth={1.5} />
                </Link>
                <Link href="/user" onClick={() => setIsMobileMenuOpen(false)}>
                  <User size={22} strokeWidth={1.5} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
