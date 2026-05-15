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
  addToCart: (product: Product, size?: string, color?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, delta: number, size?: string, color?: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Retourne le stock max disponible pour un item + taille + couleur.
 *  Priorité : (couleur+taille) variante → taille flat → stock global.
 *  Note : si une couleur est sélectionnée, on cherche dans la variante correspondante uniquement,
 *  jamais en sommant sur toutes les couleurs. */
function getMaxStock(
  item: {
    sizes?: { size: string; quantity: number }[];
    variants?: { color: string; sizes?: { name: string; stock: number }[] }[];
    stock: number;
  },
  size?: string,
  color?: string
): number {
  if (color) {
    const variant = item.variants?.find((v) => v.color === color);
    if (!variant) return 0;
    if (!size) return (variant.sizes ?? []).reduce((s, vs) => s + vs.stock, 0);
    return variant.sizes?.find((s) => s.name === size)?.stock ?? 0;
  }
  if (!size) return item.stock;
  const flat = item.sizes?.find((s) => s.size === size);
  if (flat) return flat.quantity;
  return item.stock;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { isAuthenticated } = useAuth();

  // Charger le panier quand l'user se connecte
  useEffect(() => {
    if (isAuthenticated) {
      setIsCartLoaded(false);
      loadCart().then((items) => {
        if (items.length > 0) {
          const clamped = items.map((item) => {
            const max = getMaxStock(item, item.selectedSize, item.selectedColor);
            return { ...item, quantity: Math.min(item.quantity, Math.max(1, max)) };
          });
          setCart(clamped);
        }
        setIsCartLoaded(true);
      });
      setShowBanner(false);
      setBannerDismissed(false);
    } else {
      setCart([]);
      setIsCartLoaded(false);
    }
  }, [isAuthenticated]);

  // Sauvegarder le panier à chaque changement (uniquement après le chargement initial et si authentifié)
  useEffect(() => {
    if (!isCartLoaded) return;
    if (!isAuthenticated) return;

    if (cart.length === 0) {
      clearCart();
      return;
    }
    saveCart(cart);
  }, [cart, isCartLoaded, isAuthenticated]);

  const sameLine = (
    item: CartItem,
    productId: string,
    size?: string,
    color?: string,
  ) =>
    item.id === productId &&
    item.selectedSize === size &&
    item.selectedColor === color;

  const addToCart = (product: Product, size?: string, color?: string) => {
    if (!isAuthenticated && !bannerDismissed) setShowBanner(true);

    setCart((prev) => {
      // Clé composite : même produit + même taille + même couleur = même ligne
      const existing = prev.find((item) => sameLine(item, product.id, size, color));
      const maxQty = getMaxStock(product, size, color);
      const currentQty = existing?.quantity ?? 0;
      if (currentQty >= maxQty) return prev;

      if (existing) {
        return prev.map((item) =>
          sameLine(item, product.id, size, color)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedSize: size, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart((prev) => prev.filter((item) => !sameLine(item, productId, size, color)));
  };

  const updateQuantity = (productId: string, delta: number, size?: string, color?: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (!sameLine(item, productId, size, color)) return item;
        const maxQty = getMaxStock(item, size, color);
        return { ...item, quantity: Math.max(1, Math.min(maxQty, item.quantity + delta)) };
      })
    );
  };

  const handleClearCart = () => {
    setCart([]);
    if (isAuthenticated) clearCart();
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
