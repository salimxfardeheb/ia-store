"use client"

import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, X, ChevronDown } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import Link from 'next/link';
import { Product } from "../variables";
import { useEffect, useState } from 'react';
import { getAllProducts, getCategories } from '@/services/products';
import { QuickAddModal } from '@/app/components/QuickAddModal';
import { FavoriteButton } from '@/app/components/FavoriteButton';

type SortOption = "newest" | "price-asc" | "price-desc"

const SORT_LABELS: Record<SortOption, string> = {
  "newest": "Plus récents",
  "price-asc": "Prix croissant",
  "price-desc": "Prix décroissant",
};

export default function Shop() {
  const { addToCart } = useCart();
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showSort, setShowSort] = useState(false);
  const [quickAdd, setQuickAdd] = useState<Product | null>(null);

  const handleQuickAdd = (product: Product) => {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const hasSizes = (product.sizes?.length ?? 0) > 0;
    if (hasVariants || hasSizes) {
      setQuickAdd(product);
      return;
    }
    addToCart(product);
  };

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getAllProducts();
      setProducts(data);
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const getCategoriesProducts = async () => {
      const data = await getCategories();
      setCategories(["Tous", ...data]);
    };
    getCategoriesProducts();
  }, []);

  const filtered = (activeCategory === "Tous"
    ? products
    : products.filter((p) => p.category === activeCategory)
  ).sort((a, b) => {
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    // newest — par défaut ordre Firestore (createdAt)
    return 0;
  });

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="font-serif text-6xl italic mb-6">Collections</h1>
        <div className="flex flex-wrap items-center justify-between gap-6">

          {/* Catégories */}
          <div className="flex flex-wrap gap-6 text-[11px] uppercase tracking-[0.2em] font-medium">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`pb-1 transition-all ${
                  cat === activeCategory
                    ? "border-b border-black opacity-100"
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSort((v) => !v)}
              className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold border border-black/10 px-6 py-2 hover:border-black/30 transition-colors"
            >
              <Filter size={14} />
              <span>{SORT_LABELS[sort]}</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${showSort ? "rotate-180" : ""}`}
              />
            </button>

            <AnimatePresence>
              {showSort && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 bg-white border border-black/8 z-50 min-w-45 shadow-sm"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSort(key); setShowSort(false); }}
                      className={`w-full text-left px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[#F7F7F7] ${
                        sort === key
                          ? "font-bold text-black"
                          : "text-black/40 font-medium"
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
        {filtered.map((product, index) => (
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
                {product.mainImage ? (
                  <img
                    src={product.mainImage}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F2F0ED]" />
                )}
              </Link>
              <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />

              <div className="absolute top-6 right-6 z-10">
                <FavoriteButton product={product} variant="card" />
              </div>

              <button
                onClick={() => handleQuickAdd(product)}
                className="absolute bottom-6 right-6 w-12 h-12 bg-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 luxury-shadow z-10"
              >
                <Plus size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex justify-between items-start">
              <Link href={`/product/${product.id}`}>
                <h3 className="font-serif text-xl mb-1 group-hover:italic transition-all">
                  {product.name}
                </h3>
                <p className="text-black/40 text-xs uppercase tracking-widest">
                  {product.category}
                </p>
              </Link>
              <span className="font-medium text-sm">
                {product.price.toLocaleString("fr-FR")} DA
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-32">
          <p className="font-serif text-2xl italic text-black/30">
            Aucun produit dans cette catégorie
          </p>
        </div>
      )}

      <AnimatePresence>
        {quickAdd && (
          <QuickAddModal
            product={quickAdd}
            onClose={() => setQuickAdd(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}