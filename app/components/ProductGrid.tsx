"use client";

"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useCart } from "@/app/context/CartContext";
import { Product } from "../variables";
import { getAllProducts } from "@/services/products";
import { FavoriteButton } from "./FavoriteButton";

const QuickAddModal = dynamic(
  () => import("./QuickAddModal").then((m) => ({ default: m.QuickAddModal })),
  { ssr: false }
);

export default function ProductGrid() {
  const [products, setProducts] = useState<Product[]>([]);
  const [quickAdd, setQuickAdd] = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    getAllProducts(undefined, 6).then(setProducts);
  }, []);

  const handleQuickAdd = (product: Product) => {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const hasSizes = (product.sizes?.length ?? 0) > 0;
    if (hasVariants || hasSizes) {
      setQuickAdd(product);
      return;
    }
    addToCart(product);
  };

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 space-y-4 md:space-y-0">
        <div>
          <h2 className="font-serif text-5xl italic mb-4">L'Essentiel</h2>
          <p className="text-black/60 text-sm uppercase tracking-widest">
            Pièces sélectionnées pour votre garde-robe
          </p>
        </div>

        <Link
          href="/shop"
          className="text-[11px] uppercase tracking-[0.2em] font-medium opacity-40 hover:opacity-100 transition-opacity border-b border-black/20 pb-1"
        >
          Voir tout
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="group animate-fade-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="relative aspect-3/4 overflow-hidden bg-[#f5f5f5] mb-6">

              {/* Image */}
              <Link href={`/product/${product.id}`}>
                {product.mainImage ? (
                  <Image
                    src={product.mainImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F2F0ED]" />
                )}
              </Link>

              <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />

              {/* Favorite */}
              <div className="absolute top-6 right-6 z-10">
                <FavoriteButton product={product} variant="card" />
              </div>

              {/* Quick Add */}
              <button
                onClick={() => handleQuickAdd(product)}
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
                  <p className="text-black/60 text-xs uppercase tracking-widest">
                    {product.category}
                  </p>
                </div>
              </Link>
              <span className="font-medium text-sm">
                {product.price.toLocaleString("fr-FR")} DA
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* View All */}
      <div className="mt-24 text-center">
        <Link
          href="/shop"
          className="border border-black/10 px-12 py-4 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all duration-500 inline-block"
        >
          Voir tous les produits
        </Link>
      </div>

      {quickAdd && (
        <QuickAddModal
          product={quickAdd}
          onClose={() => setQuickAdd(null)}
        />
      )}
    </section>
  );
}