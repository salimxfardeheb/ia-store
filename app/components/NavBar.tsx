"use client";

import { useState, useEffect, useRef } from "react";
import {
  ShoppingBag,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Heart,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { useFavorites } from "@/app/context/FavoritesContext";
import { useAuth } from "../context/AuthContext";
import Logo from "./logo";

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/about", label: "About I.A" },
];

// Cormorant Garamond font style shorthand
const serif = { fontFamily: "'Cormorant Garamond', Georgia, serif" };

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [navState, setNavState] = useState<"hero" | "scrolled">("hero");
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();

  // Switch between transparent (over hero) and solid (scrolled)
  useMotionValueEvent(scrollY, "change", (latest) => {
    setNavState(latest > 60 ? "scrolled" : "hero");
  });

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
    router.push("/");
  };

  const isHero = navState === "hero";

  const hoverOpacity = "hover:opacity-75 transition-opacity duration-300";

  return (
    <>
      {/* Navbar */}
      <motion.nav
        animate={{
          backgroundColor: isHero
            ? "rgba(0,0,0,0)"
            : "color-mix(in oklab, var(--color-white) /* #fff = #ffffff */ 65%, transparent)",
          backdropFilter: isHero ? "blur(0px)" : "blur(16px)",
          borderBottomColor: isHero
            ? "rgba(245,240,232,0.08)"
            : "rgba(44,36,22,0.08)",
        }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b bg-white/65"
      >
        {/* Top accent line — only visible when scrolled */}
        <AnimatePresence>
          {!isHero && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 left-[8%] right-[8%] h-px bg-[#8B7355]/40 origin-left"
            />
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-6 lg:px-[8%]">
          <div className="flex items-center justify-between py-5 lg:py-7">
            {/* Mobile toggle */}
            <button
              className={`lg:hidden p-2 -ml-2 `}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} strokeWidth={1.5} />
            </button>

            {/* Desktop left links */}
            <div className="hidden lg:flex items-center space-x-10">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`relative text-[10px] uppercase tracking-[0.3em] font-medium ${hoverOpacity} group`}
                  style={serif}
                >
                  {label}
                  {/* Active underline */}
                  <span
                    className={`absolute -bottom-1 left-0 h-px bg-[#0A0A0A] transition-all duration-300 ${
                      pathname === href ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              ))}
            </div>

            {/* Logo — centered absolutely */}
            <Link
              href="/"
              className="flex flex-col items-center absolute left-1/2 -translate-x-1/2"
            >
              <motion.div
                animate={{ scale: isHero ? 1 : 0.85 }}
                transition={{ duration: 0.4 }}
              >
                <Logo color={"#2C2416"} size={52} />
              </motion.div>
              <motion.span
                transition={{ duration: 0.4 }}
                className="uppercase tracking-[0.25em] mt-0.5 text-[8px] text-[#0A0A0A]"
                style={serif}
              >
                Clothing Store
              </motion.span>
            </Link>

            {/* Right icons */}
            <div className="flex items-center space-x-5">
              {/* User dropdown */}
              <div className="relative" ref={userMenuRef}>
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center space-x-1.5 ${hoverOpacity}`}
                    >
                      <User size={18} strokeWidth={1.5} />
                      <span
                        className="hidden md:block text-[9px] uppercase tracking-widest font-medium"
                        style={serif}
                      >
                        {user?.email?.split("@")[0] || "User"}
                      </span>
                      <motion.div
                        animate={{ rotate: isUserMenuOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown
                          size={12}
                          strokeWidth={1.5}
                          className="hidden md:block"
                        />
                      </motion.div>
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.97 }}
                          transition={{ duration: 0.18 }}
                          className="absolute right-0 top-10 w-52 bg-white/50 border border-[#2C2416]/8 shadow-xl overflow-hidden"
                        >
                          {/* User info header */}
                          <div className="px-4 py-3 border-b border-[#2C2416]/8">
                            <p
                              className="text-[10px] uppercase tracking-widest text-[#2C2416]"
                              style={serif}
                            >
                              {user?.email?.split("@")[0]}
                            </p>
                            <p className="text-[10px] text-[#2C2416]/40 mt-0.5 truncate">
                              {user?.email}
                            </p>
                          </div>

                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center space-x-3 px-4 py-3 text-[10px] uppercase tracking-widest text-[#2C2416] hover:bg-[#2C2416]/5 transition-colors"
                            style={serif}
                          >
                            <User size={13} strokeWidth={1.5} />
                            <span>Mon Profil</span>
                          </Link>

                          {(user?.role === "ADMIN" || user?.role === "SELLER") && (
                            <Link
                              href="/admin"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center space-x-3 px-4 py-3 text-[10px] uppercase tracking-widest text-[#2C2416] hover:bg-[#2C2416]/5 transition-colors"
                              style={serif}
                            >
                              <LayoutDashboard size={13} strokeWidth={1.5} />
                              <span>Dashboard</span>
                            </Link>
                          )}

                          <div className="h-px bg-[#2C2416]/6 mx-4" />

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-3 text-[10px] uppercase tracking-widest text-[#8B4040] hover:bg-[#8B4040]/5 transition-colors"
                            style={serif}
                          >
                            <LogOut size={13} strokeWidth={1.5} />
                            <span>Se Déconnecter</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href="/login" className={`${hoverOpacity}`}>
                    <User size={18} strokeWidth={1.5} />
                  </Link>
                )}
              </div>

              {/* Favorites */}
              <Link
                href="/favorites"
                aria-label="Mes favoris"
                className={`relative ${hoverOpacity}`}
              >
                <Heart size={18} strokeWidth={1.5} />
                <AnimatePresence>
                  {favoritesCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 bg-[#2C2416] text-[#F5F0E8] text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                    >
                      {favoritesCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* Cart */}
              <Link href="/cart" className={`relative ${hoverOpacity}`}>
                <ShoppingBag size={18} strokeWidth={1.5} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 bg-[#2C2416] text-[#F5F0E8] text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#2C2416]/30 backdrop-blur-sm z-60"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="fixed inset-y-0 left-0 w-3/4 max-w-sm bg-[#F5F0E8] z-70 flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-8 py-7 border-b border-[#2C2416]/8">
                <span
                  className="text-[9px] uppercase tracking-[0.35em]"
                  style={serif}
                >
                  IA Store
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={1} className="text-[#2C2416]" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col px-8 pt-10 space-y-1">
                {[
                  { href: "/", label: "Home" },
                  ...NAV_LINKS,
                  { href: "/favorites", label: `Favoris (${favoritesCount})` },
                  { href: "/cart", label: `My Bag (${cartCount})` },
                ].map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4 }}
                  >
                    <Link
                      href={href}
                      className={`block py-3 border-b border-[#2C2416]/6 transition-opacity ${
                        pathname === href ? "opacity-30" : "hover:opacity-50"
                      }`}
                      style={{
                        ...serif,
                        fontSize: "2rem",
                        fontStyle: "italic",
                        fontWeight: 300,
                        color: "#2C2416",
                      }}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Drawer footer */}
              <div className="mt-auto px-8 py-8 border-t border-[#2C2416]/8">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-[#2C2416]/20 flex items-center justify-center">
                        <User
                          size={13}
                          strokeWidth={1.5}
                          className="text-[#2C2416]"
                        />
                      </div>
                      <div>
                        <p
                          className="text-[10px] uppercase tracking-widest text-[#2C2416]"
                          style={serif}
                        >
                          {user?.email?.split("@")[0]}
                        </p>
                        <p className="text-[9px] text-[#2C2416]/40 truncate max-w-40">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 text-[#8B4040]"
                    >
                      <LogOut size={15} strokeWidth={1.5} />
                      <span
                        className="text-[10px] uppercase tracking-widest"
                        style={serif}
                      >
                        Se Déconnecter
                      </span>
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 text-[#2C2416]"
                  >
                    <User size={18} strokeWidth={1.5} />
                    <span
                      className="text-[10px] uppercase tracking-widest"
                      style={serif}
                    >
                      Se Connecter
                    </span>
                  </Link>
                )}

                <div className="flex items-center mt-6">
                  <div className="h-px flex-1 bg-[#2C2416]/8" />
                  <span
                    className="text-[8px] uppercase tracking-[0.3em] text-[#8B7355] ml-4"
                    style={serif}
                  >
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
