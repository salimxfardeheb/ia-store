"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Filter, ChevronDown, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCart } from "@/app/context/CartContext";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import type { Product } from "@/app/variables";

const QuickAddModal = dynamic(
  () => import("@/app/components/QuickAddModal").then((m) => ({ default: m.QuickAddModal })),
  { ssr: false }
);

type SortOption = "newest" | "price-asc" | "price-desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest:      "Plus récents",
  "price-asc": "Prix croissant",
  "price-desc":"Prix décroissant",
};

interface Props {
  products:       Product[];
  categories:     string[];
  total:          number;
  page:           number;
  limit:          number;
  activeCategory: string;
  sort:           SortOption;
  promoOnly?:     boolean;
}

export default function ShopClient({
  products, categories, total, page, limit, activeCategory, sort, promoOnly = false,
}: Props) {
  const { addToCart }   = useCart();
  const [quickAdd, setQuickAdd] = useState<Product | null>(null);
  const [showSort, setShowSort] = useState(false);
  const router     = useRouter();
  const pathname   = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / limit);

  function nav(patch: Record<string, string | number>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === "" || v === "Tous" || v === 0) p.delete(k);
      else p.set(k, String(v));
    }
    // reset page when filter/sort changes
    if (!("page" in patch)) p.delete("page");
    router.push(`${pathname}?${p.toString()}`);
  }

  const handleQuickAdd = (product: Product) => {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const hasSizes    = (product.sizes?.length ?? 0) > 0;
    if (hasVariants || hasSizes) { setQuickAdd(product); return; }
    addToCart(product);
  };

  return (
    <>
      <header className="mb-16">
        <h1 className="font-serif text-6xl italic mb-6">Collections</h1>
        <div className="flex flex-wrap items-center justify-between gap-6">

          {/* Catégories */}
          <nav aria-label="Filtrer par catégorie">
            <ul className="flex flex-wrap gap-6 list-none">
              {["Tous", ...categories].map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => nav({ category: cat })}
                    className={`pb-1 text-[11px] uppercase tracking-[0.2em] font-medium transition-all ${
                      cat === activeCategory
                        ? "border-b border-black opacity-100"
                        : "opacity-40 hover:opacity-100"
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Filtre Promotions */}
          <button
            type="button"
            onClick={() => nav({ promo: promoOnly ? "" : "true", page: 1 })}
            className={`flex items-center gap-2 px-4 py-2 text-[11px] uppercase tracking-[0.2em] font-medium border transition-all ${
              promoOnly
                ? "bg-red-500 text-white border-red-500"
                : "border-black/10 text-black/60 hover:border-black/30"
            }`}
          >
            <Tag size={13} strokeWidth={1.5} />
            Promotions
          </button>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSort((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={showSort}
              className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold border border-black/10 px-6 py-2 hover:border-black/30 transition-colors"
            >
              <Filter size={14} />
              <span>{SORT_LABELS[sort]}</span>
              <ChevronDown size={12} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showSort && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSort(false)} />
                  <motion.ul
                    role="listbox"
                    aria-label="Trier les produits"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-black/8 z-50 min-w-45 shadow-sm list-none"
                  >
                    {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                      <li key={key} role="option" aria-selected={sort === key}>
                        <button
                          type="button"
                          onClick={() => { nav({ sort: key }); setShowSort(false); }}
                          className={`w-full text-left px-5 py-3 text-[11px] uppercase tracking-[0.2em] transition-colors hover:bg-[#F7F7F7] ${
                            sort === key ? "font-bold text-black" : "text-black/60 font-medium"
                          }`}
                        >
                          {SORT_LABELS[key]}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 list-none">
        {products.map((product, index) => (
          <li
            key={product.id}
            className="group animate-fade-up"
            style={{ animationDelay: `${(index % 3) * 80}ms` }}
          >
            <div className="relative aspect-3/4 overflow-hidden bg-[#f5f5f5] mb-6">
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

              {product.discountPercent && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[9px] font-bold px-2 py-1 uppercase tracking-wider">
                  -{product.discountPercent}%
                </div>
              )}

              <div className="absolute top-6 right-6 z-10">
                <FavoriteButton product={product} variant="card" />
              </div>

              <button
                type="button"
                onClick={() => handleQuickAdd(product)}
                aria-label={`Ajouter ${product.name} au panier`}
                className="absolute bottom-6 right-6 w-12 h-12 bg-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 luxury-shadow z-10"
              >
                <Plus size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex justify-between items-start">
              <Link href={`/product/${product.id}`}>
                <h2 className="font-serif text-xl mb-1 group-hover:italic transition-all">
                  {product.name}
                </h2>
                <p className="text-black/60 text-xs uppercase tracking-widest">
                  {product.category}
                </p>
              </Link>
              <div className="text-right shrink-0">
                {product.discountPercent ? (
                  <>
                    <span className="font-semibold text-sm text-red-500">
                      {Math.round(product.price * (1 - product.discountPercent / 100)).toLocaleString("fr-FR")} DA
                    </span>
                    <span className="block text-xs text-black/30 line-through">
                      {product.price.toLocaleString("fr-FR")} DA
                    </span>
                  </>
                ) : (
                  <span className="font-medium text-sm">
                    {product.price.toLocaleString("fr-FR")} DA
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {products.length === 0 && (
        <div className="text-center py-32">
          <p className="font-serif text-2xl italic text-black/30">
            Aucun produit dans cette catégorie
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-20 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => nav({ page: page - 1 })}
            className="px-4 py-2 text-[11px] uppercase tracking-widest border border-black/10 hover:border-black/40 disabled:opacity-25 transition-colors"
          >
            ←
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => nav({ page: p })}
              aria-current={p === page ? "page" : undefined}
              className={`w-10 h-10 text-[11px] font-medium transition-colors ${
                p === page
                  ? "bg-black text-white"
                  : "border border-black/10 hover:border-black/40 text-black/60"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => nav({ page: page + 1 })}
            className="px-4 py-2 text-[11px] uppercase tracking-widest border border-black/10 hover:border-black/40 disabled:opacity-25 transition-colors"
          >
            →
          </button>
        </nav>
      )}

      {/* Total count */}
      <p className="text-center mt-6 text-[10px] uppercase tracking-widest text-black/30">
        {total} produit{total !== 1 ? "s" : ""}
        {activeCategory !== "Tous" ? ` · ${activeCategory}` : ""}
      </p>

      {quickAdd && (
        <QuickAddModal product={quickAdd} onClose={() => setQuickAdd(null)} />
      )}
    </>
  );
}
