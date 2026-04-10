"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product } from "../variables";
import { useAuth } from "./AuthContext";
import { loadCart, saveCart, clearCart, CartItem } from "@/services/cart";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, size?: string) => void;
  removeFromCart: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, delta: number, size?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { isAuthenticated, getToken } = useAuth();

  // Charger le panier quand l'user se connecte
  useEffect(() => {
    if (isAuthenticated) {
      const token = getToken();
      if (token) {
        loadCart(token).then((items) => {
          if (items.length > 0) setCart(items);
        });
      }
      setShowBanner(false);
      setBannerDismissed(false);
    } else {
      setCart([]);
    }
  }, [isAuthenticated]);

  // Sauvegarder le panier à chaque changement
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    if (cart.length === 0) {
      clearCart(token);
      return;
    }
    saveCart(token, cart);
  }, [cart, isAuthenticated]);

  const addToCart = (product: Product, size?: string) => {
    if (!isAuthenticated && !bannerDismissed) setShowBanner(true);

    setCart((prev) => {
      // Clé composite : même produit + même taille = même ligne
      const existing = prev.find(
        (item) => item.id === product.id && item.selectedSize === size
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, size?: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.id === productId && item.selectedSize === size)
      )
    );
  };

  const updateQuantity = (productId: string, delta: number, size?: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId && item.selectedSize === size
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
    const token = getToken();
    if (token) clearCart(token);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart: handleClearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}

      {/* Bannière connectez-vous */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-black/8 shadow-lg px-6 py-4 flex items-center gap-6 max-w-sm w-full mx-4"
          >
            <ShoppingBag size={18} strokeWidth={1.5} className="text-black/40 shrink-0" />
            <div className="grow">
              <p className="text-[11px] font-serif italic text-black mb-0.5">
                Sauvegardez votre panier
              </p>
              <p className="text-[9px] uppercase tracking-widest text-black/30">
                Connectez-vous pour ne rien perdre
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="text-[9px] uppercase tracking-widest font-bold border-b border-black pb-0.5 hover:opacity-60 transition-opacity"
              >
                Se connecter
              </Link>
              <button
                onClick={() => {
                  setShowBanner(false);
                  setBannerDismissed(true);
                }}
                className="text-black/20 hover:text-black transition-colors"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
