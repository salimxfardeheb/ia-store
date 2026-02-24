"use client";

import { products } from "@/app/data/products";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";

export default function ProductGrid() {
  const { addToCart } = useCart();

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-serif text-5xl italic mb-4">
            The Essentials
          </h2>
          <p className="text-black/40 text-sm uppercase tracking-widest">
            Curated pieces for your wardrobe
          </p>
        </div>

        <div className="flex space-x-8 text-[11px] uppercase tracking-[0.2em] font-medium">
          <button className="border-b border-black pb-1">All</button>
          <button className="opacity-40 hover:opacity-100 transition-opacity pb-1">
            Suits
          </button>
          <button className="opacity-40 hover:opacity-100 transition-opacity pb-1">
            Knitwear
          </button>
          <button className="opacity-40 hover:opacity-100 transition-opacity pb-1">
            Outerwear
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {products.slice(0, 6).map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div className="relative aspect-3/4 overflow-hidden bg-[#f5f5f5] mb-6">
              
              {/* Image */}
              <Link href={`/product/${product.id}`}>
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
              </Link>

              <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>

              {/* Quick Add */}
              <button
                onClick={() => addToCart(product)}
                className="absolute bottom-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 luxury-shadow z-10"
              >
                <Plus size={20} strokeWidth={1.5} />
              </button>

              {/* Tag */}
              {index === 0 && (
                <div className="absolute top-6 left-6 bg-black text-white text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold">
                  New Arrival
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex justify-between items-start">
              <Link href={`/product/${product.id}`}>
                <div>
                  <h3 className="font-serif text-xl mb-1 group-hover:italic transition-all">
                    {product.name}
                  </h3>
                  <p className="text-black/40 text-[11px] uppercase tracking-widest">
                    {product.category}
                  </p>
                </div>
              </Link>

              <span className="font-medium text-sm">
                ${product.price}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All */}
      <div className="mt-24 text-center">
        <Link
          href="/shop"
          className="border border-black/10 px-12 py-4 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all duration-500 inline-block"
        >
          View All Products
        </Link>
      </div>
    </section>
  );
}