"use client"

import React from 'react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="pt-48 pb-24 px-6 max-w-7xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-[#f5f5f0] rounded-full flex items-center justify-center">
            <ShoppingBag size={40} strokeWidth={1} className="opacity-20" />
          </div>
        </div>
        <h1 className="font-serif text-4xl italic mb-6">Your bag is empty</h1>
        <p className="text-black/40 mb-12 max-w-md mx-auto">Looks like you haven't added anything to your bag yet. Explore our latest collections to find your next essential.</p>
        <Link href={"/shop"} className="bg-black text-white px-12 py-5 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow inline-block">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <h1 className="font-serif text-5xl italic mb-16">Your Bag ({cartCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="popLayout">
            {cart.map((item) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center space-x-6 pb-8 border-b border-black/5"
              >
                <div className="w-32 aspect-3/4 bg-[#f5f5f5] rounded-xl overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                
                <div className="grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-serif text-xl italic">{item.name}</h3>
                      <p className="text-black/40 text-[10px] uppercase tracking-widest">{item.category}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 hover:bg-black/5 rounded-full transition-colors"
                    >
                      <X size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-6">
                    <div className="flex items-center space-x-4 border border-black/10 rounded-full px-4 py-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="hover:opacity-50"><Minus size={14} /></button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="hover:opacity-50"><Plus size={14} /></button>
                    </div>
                    <span className="font-medium">${item.price * item.quantity}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#fdfcfb] border border-black/5 p-8 rounded-2xl luxury-shadow sticky top-32">
            <h2 className="text-[11px] uppercase tracking-[0.2em] font-bold mb-8">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Subtotal</span>
                <span>${cartTotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-black/40">Shipping</span>
                <span className="text-emerald-600 uppercase text-[10px] font-bold tracking-widest">Calculated at checkout</span>
              </div>
              <div className="pt-4 border-t border-black/5 flex justify-between">
                <span className="font-serif text-xl italic">Total</span>
                <span className="text-xl font-bold">${cartTotal}</span>
              </div>
            </div>

            <button className="w-full bg-black text-white py-5 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow flex items-center justify-center space-x-3">
              <span>Checkout</span>
              <ArrowRight size={16} />
            </button>
            
            <p className="text-[9px] text-center mt-6 text-black/30 uppercase tracking-widest">
              Secure checkout powered by I.A
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
