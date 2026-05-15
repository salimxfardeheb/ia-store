"use client"

import { useCart } from '@/app/context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="pt-48 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <ShoppingBag size={40} strokeWidth={0.75} className="opacity-15" />
        </div>
        <h1 className="font-serif text-4xl italic mb-6">Votre panier est vide</h1>
        <p className="text-black/40 mb-12 max-w-md mx-auto text-sm font-light">
          Vous n'avez encore rien ajouté. Explorez nos collections pour trouver votre prochaine pièce essentielle.
        </p>
        <Link
          href="/shop"
          className="bg-black text-white px-12 py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow inline-block"
        >
          Commencer mes achats
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <h1 className="font-serif text-5xl italic mb-16">
        Mon Panier <span className="not-italic text-black/20 text-3xl">({cartCount})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">

        {/* Items List */}
        <div className="lg:col-span-2 space-y-0 border-t border-black/8">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => {
              // Si la couleur est fournie, on scope sur cette variante exacte ;
              // sinon priorité : taille flat → stock global.
              let maxQty: number;
              if (item.selectedColor) {
                const variant = item.variants?.find((v) => v.color === item.selectedColor);
                if (!variant) {
                  maxQty = 0;
                } else if (item.selectedSize) {
                  maxQty = variant.sizes?.find((s) => s.name === item.selectedSize)?.stock ?? 0;
                } else {
                  maxQty = (variant.sizes ?? []).reduce((s, vs) => s + vs.stock, 0);
                }
              } else if (item.selectedSize) {
                const flat = item.sizes?.find((s) => s.size === item.selectedSize);
                maxQty = flat ? flat.quantity : item.stock;
              } else {
                maxQty = item.stock;
              }
              const atMax = item.quantity >= maxQty;

              return (
                <motion.div
                  key={`${item.id}-${item.selectedSize ?? ''}-${item.selectedColor ?? ''}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-start space-x-6 py-8 border-b border-black/8"
                >
                  {/* Image */}
                  <div className="w-28 aspect-3/4 bg-[#f5f5f5] overflow-hidden shrink-0">
                    <img
                      src={item.mainImage}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="grow">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-serif text-xl italic">{item.name}</h3>
                        <p className="text-black/30 text-[10px] uppercase tracking-[0.25em] mt-0.5">
                          {item.category}
                          {item.selectedColor && <span className="ml-2">· {item.selectedColor}</span>}
                          {item.selectedSize && <span className="ml-2">· Taille {item.selectedSize}</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                        className="p-1.5 hover:bg-black/5 transition-colors"
                      >
                        <X size={15} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      {/* Quantity */}
                      <div className="flex items-center border border-black/10">
                        <button
                          onClick={() => updateQuantity(item.id, -1, item.selectedSize, item.selectedColor)}
                          className="w-9 h-9 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors"
                        >
                          <Minus size={13} strokeWidth={1.5} />
                        </button>
                        <span className="w-9 text-center text-sm font-medium font-serif">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1, item.selectedSize, item.selectedColor)}
                          disabled={atMax}
                          className={`w-9 h-9 flex items-center justify-center transition-colors ${atMax ? 'text-black/10 cursor-not-allowed' : 'text-black/30 hover:text-black hover:bg-black/5'}`}
                        >
                          <Plus size={13} strokeWidth={1.5} />
                        </button>
                      </div>

                      <span className="font-serif text-lg italic">
                        {(item.price * item.quantity).toLocaleString("fr-FR")} DA
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="border border-black/8 p-8 sticky top-32">
            <h2 className="text-[11px] uppercase tracking-[0.3em] text-black/40 font-serif mb-8">
              Résumé
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-black/40 font-light">Sous-total</span>
                <span className="font-serif italic">
                  {cartTotal.toLocaleString("fr-FR")} DA
                </span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-black/40 font-light">Livraison</span>
                <span className="text-black/40 uppercase text-[10px] tracking-widest font-serif">
                  À confirmer
                </span>
              </div>
              <div className="pt-6 border-t border-black/8 flex justify-between items-baseline">
                <span className="font-serif text-xl italic">Total</span>
                <span className="font-serif text-xl italic">
                  {cartTotal.toLocaleString("fr-FR")} DA
                </span>
              </div>
            </div>

            <Link
            href={"/checkout"}
            className="w-full bg-black text-white py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow flex items-center justify-center space-x-3">
              <span>Commander</span>
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>

            <p className="text-[9px] text-center mt-6 text-black/20 uppercase tracking-[0.3em] font-serif">
              Paiement sécurisé
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}