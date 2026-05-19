"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag, Menu, X, User, LogOut,
  ChevronDown, LayoutDashboard, Heart,
} from "lucide-react";
import {
  motion, AnimatePresence, useScroll, useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useFavorites } from "@/app/context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import Logo from "./logo";

const NAV_LINKS = [
  { href: "/shop",  label: "Shop All"  },
  { href: "/about", label: "About I.A" },
];

const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen,   setIsUserMenuOpen]   = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount }     = useCart();
  const { favoritesCount } = useFavorites();
  const pathname = usePathname();
  const router   = useRouter();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 60));

  useEffect(() => { setIsMobileMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setIsUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push("/");
  };

  return (
    <>
      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <motion.nav
        animate={{
          backgroundColor: scrolled ? "rgba(237,232,223,0.88)" : "rgba(237,232,223,0)",
          backdropFilter:  scrolled ? "blur(18px)" : "blur(0px)",
          borderBottomColor: scrolled ? "rgba(26,23,19,0.10)" : "rgba(26,23,19,0.05)",
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">

            {/* ── Left: hamburger (mobile) / nav links (desktop) ── */}
            <div className="flex items-center">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Ouvrir le menu"
                className="lg:hidden p-2 -ml-1 text-[#1a1713] hover:opacity-60 transition-opacity"
              >
                <Menu size={20} strokeWidth={1.5} />
              </button>

              {/* Desktop links */}
              <div className="hidden lg:flex items-center gap-9">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group relative text-[10px] uppercase tracking-[0.35em] font-medium text-[#1a1713] hover:opacity-60 transition-opacity"
                    style={serif}
                  >
                    {label}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px bg-[#1a1713] transition-all duration-300 ${
                        pathname === href ? "w-full" : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Center: Logo ──────────────────────────────────────── */}
            <Link
              href="/"
              className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
            >
              <motion.div animate={{ scale: scrolled ? 0.82 : 1 }} transition={{ duration: 0.35 }}>
                <Logo color="#2C2416" size={scrolled ? 38 : 44} />
              </motion.div>
              <span
                className="text-[7px] uppercase tracking-[0.28em] text-[#2C2416]/70 hidden sm:block"
                style={serif}
              >
                Clothing Store
              </span>
            </Link>

            {/* ── Right: icons ─────────────────────────────────────── */}
            <div className="flex items-center gap-4 sm:gap-5">

              {/* User */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-1.5 text-[#1a1713] hover:opacity-60 transition-opacity"
                    >
                      <User size={18} strokeWidth={1.5} />
                      <span
                        className="hidden md:block text-[9px] uppercase tracking-widest font-medium"
                        style={serif}
                      >
                        {user?.email?.split("@")[0]}
                      </span>
                      <motion.div animate={{ rotate: isUserMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={11} strokeWidth={1.5} className="hidden md:block" />
                      </motion.div>
                    </button>

                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-9 w-52 bg-[#EDE8DF]/95 backdrop-blur-md border border-[#1a1713]/8 shadow-xl overflow-hidden z-10"
                        >
                          <div className="px-4 py-3 border-b border-[#1a1713]/8">
                            <p className="text-[10px] uppercase tracking-widest text-[#1a1713]" style={serif}>
                              {user?.email?.split("@")[0]}
                            </p>
                            <p className="text-[10px] text-[#1a1713]/40 mt-0.5 truncate">{user?.email}</p>
                          </div>

                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-[#1a1713] hover:bg-[#1a1713]/5 transition-colors"
                            style={serif}
                          >
                            <User size={12} strokeWidth={1.5} />
                            Mon Profil
                          </Link>

                          {(user?.role === "ADMIN" || user?.role === "SELLER") && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-[#1a1713] hover:bg-[#1a1713]/5 transition-colors"
                              style={serif}
                            >
                              <LayoutDashboard size={12} strokeWidth={1.5} />
                              Dashboard
                            </Link>
                          )}

                          <div className="h-px bg-[#1a1713]/6 mx-4" />

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-widest text-[#8B4040] hover:bg-[#8B4040]/5 transition-colors"
                            style={serif}
                          >
                            <LogOut size={12} strokeWidth={1.5} />
                            Se Déconnecter
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href="/login" className="text-[#1a1713] hover:opacity-60 transition-opacity">
                    <User size={18} strokeWidth={1.5} />
                  </Link>
                )}
              </div>

              {/* Favorites */}
              <Link href="/favorites" aria-label="Mes favoris" className="relative text-[#1a1713] hover:opacity-60 transition-opacity">
                <Heart size={18} strokeWidth={1.5} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#1a1713] text-[#EDE8DF] text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold animate-pop-in">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative text-[#1a1713] hover:opacity-60 transition-opacity">
                <ShoppingBag size={18} strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#1a1713] text-[#EDE8DF] text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold animate-pop-in">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </div>
      </motion.nav>

      {/* ── Mobile Drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-[#1a1713]/35 backdrop-blur-sm z-60"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-y-0 left-0 w-[80vw] max-w-xs bg-[#EDE8DF] z-70 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1713]/8">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-[#8b7355]" style={serif}>
                    IA Store
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.25em] text-[#1a1713]/30 mt-0.5" style={serif}>
                    Old Money Aesthetic
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Fermer le menu"
                  className="p-1 text-[#1a1713] hover:opacity-60 transition-opacity"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex flex-col px-6 pt-8 flex-1 overflow-y-auto">
                {[
                  { href: "/",         label: "Accueil"                      },
                  { href: "/shop",     label: "Shop All"                     },
                  { href: "/about",    label: "About I.A"                    },
                  { href: "/favorites",label: `Favoris${favoritesCount > 0 ? ` (${favoritesCount})` : ""}` },
                  { href: "/cart",     label: `Mon Panier${cartCount > 0 ? ` (${cartCount})` : ""}` },
                ].map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.35 }}
                  >
                    <Link
                      href={href}
                      className={`block py-4 border-b border-[#1a1713]/6 transition-opacity ${
                        pathname === href ? "opacity-25" : "hover:opacity-50"
                      }`}
                      style={{
                        ...serif,
                        fontSize: "1.6rem",
                        fontStyle: "italic",
                        fontWeight: 300,
                        color: "#1a1713",
                      }}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer */}
              <div className="px-6 py-6 border-t border-[#1a1713]/8">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a1713]/10 flex items-center justify-center shrink-0">
                        <User size={13} strokeWidth={1.5} className="text-[#1a1713]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-[#1a1713] truncate" style={serif}>
                          {user?.email?.split("@")[0]}
                        </p>
                        <p className="text-[9px] text-[#1a1713]/35 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-[#8B4040] hover:opacity-70 transition-opacity"
                    >
                      <LogOut size={14} strokeWidth={1.5} />
                      <span className="text-[10px] uppercase tracking-widest" style={serif}>
                        Se Déconnecter
                      </span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 text-[#1a1713] hover:opacity-60 transition-opacity"
                  >
                    <User size={16} strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest" style={serif}>
                      Se Connecter
                    </span>
                  </Link>
                )}

                <div className="flex items-center gap-3 mt-5">
                  <div className="h-px flex-1 bg-[#1a1713]/8" />
                  <span className="text-[8px] uppercase tracking-[0.35em] text-[#8b7355]" style={serif}>
                    MMXXV
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
