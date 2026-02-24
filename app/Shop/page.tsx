"use client"

import React from 'react';
import { products } from '../data/products';
import { motion } from 'framer-motion';
import { Plus, Filter } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Link from 'next/link';

export default function Shop() {
  const { addToCart } = useCart();
  const categories = ["All", "Suits", "Knitwear", "Shirts", "Shoes", "Outerwear", "Trousers"];

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="font-serif text-6xl italic mb-6">Collections</h1>
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.2em] font-medium">
            {categories.map(cat => (
              <button key={cat} className={`${cat === 'All' ? 'border-b border-black' : 'opacity-40 hover:opacity-100'} transition-all pb-1`}>
                {cat}
              </button>
            ))}
          </div>
          <button className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold border border-black/10 px-6 py-2 rounded-full">
            <Filter size={14} />
            <span>Filter</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {products.map((product, index) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (index % 3) * 0.1 }}
            className="group"
          >
            <div className="relative aspect-3/4 overflow-hidden bg-[#f5f5f5] mb-6">
              <Link href={`/product/${product.id}`}>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </Link>
              <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
              
              <button 
                onClick={() => addToCart(product)}
                className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 luxury-shadow z-10"
              >
                <Plus size={20} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="flex justify-between items-start">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-serif text-xl mb-1 group-hover:italic transition-all">{product.name}</h3>
                <p className="text-black/40 text-[11px] uppercase tracking-widest">{product.category}</p>
              </Link>
              <span className="font-medium text-sm">${product.price}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
