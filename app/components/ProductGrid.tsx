"use client";

import { useState, useEffect } from "react";
import { Plus, Star, Tag } from "lucide-react";
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

const TABS = [
  { id: "all",   label: "Tous",         icon: null },
  { id: "best",  label: "Best Sellers", icon: Star },
  { id: "new",   label: "Nouveautés",   icon: null },
  { id: "promo", label: "Promotions",   icon: Tag  },
];

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isNewProduct(createdAt: string) {
  return Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS_MS;
}

function getBadge(product: Product, tab: string) {
  if (product.discountPercent) return { text: `-${product.discountPercent}%`, color: "bg-red-500 text-white" };
  if (product.isBestSeller)    return { text: "Best Seller", color: "bg-[#1a1713] text-[#EDE8DF]" };
  if (isNewProduct(product.createdAt)) return { text: "Nouveau", color: "bg-[#8b7355] text-white" };
  return null;
}

function getPromoPrice(product: Product) {
  if (!product.discountPercent) return null;
  return Math.round(product.price * (1 - product.discountPercent / 100));
}

interface ProductCardProps {
  product: Product;
  index: number;
  tab: string;
  onQuickAdd: (p: Product) => void;
}

function ProductCard({ product, index, tab, onQuickAdd }: ProductCardProps) {
  const badge         = getBadge(product, tab);
  const promoPrice    = getPromoPrice(product);
  const originalPrice = promoPrice ? product.price : null;

  return (
    <div className="group animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
      {/* Image */}
      <div className="relative aspect-3/4 overflow-hidden bg-[#f0efed] mb-4">
        <Link href={`/product/${product.id}`}>
          {product.mainImage ? (
            <Image
              src={product.mainImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="w-full h-full bg-[#e8e2d9]" />
          )}
        </Link>

        <div className="absolute inset-0 pointer-events-none bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />

        {badge && (
          <div className={`absolute top-3 left-3 ${badge.color} text-[8px] uppercase tracking-[0.2em] px-2 py-1 font-bold`}>
            {badge.text}
          </div>
        )}

        <div className="absolute top-3 right-3 z-10">
          <FavoriteButton product={product} variant="card" />
        </div>

        <button
          onClick={() => onQuickAdd(product)}
          aria-label="Ajouter au panier"
          className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md z-10 hover:bg-[#1a1713] hover:text-white"
        >
          <Plus size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <Link href={`/product/${product.id}`} className="flex-1 min-w-0">
          <h3
            className="text-[#1a1713]/90 leading-snug truncate"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem" }}
          >
            {product.name}
          </h3>
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#8b7355] mt-1">
            {product.category}
          </p>
        </Link>
        <div className="text-right shrink-0">
          <span className={`font-semibold text-sm ${promoPrice ? "text-red-500" : "text-[#1a1713]/90"}`}>
            {(promoPrice ?? product.price).toLocaleString("fr-FR")} DA
          </span>
          {originalPrice && (
            <span className="block text-[11px] text-black/30 line-through">
              {originalPrice.toLocaleString("fr-FR")} DA
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductGrid() {
  const [products,   setProducts]   = useState<Product[]>([]);
  const [activeTab,  setActiveTab]  = useState("all");
  const [quickAdd,   setQuickAdd]   = useState<Product | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const qs =
      activeTab === "promo" ? "promo=true" :
      activeTab === "best"  ? "best=true"  :
      activeTab === "new"   ? "new=true"   : "";

    const fetchProds = qs
      ? fetch(`/api/products?${qs}&limit=9`)
          .then((r) => (r.ok ? r.json() : []))
          .then((d) => Array.isArray(d) ? d : (d.products ?? []))
      : getAllProducts(undefined, 9);

    fetchProds.then(setProducts);
  }, [activeTab]);

  const handleQuickAdd = (product: Product) => {
    const hasVariants = (product.variants?.length ?? 0) > 0;
    const hasSizes    = (product.sizes?.length    ?? 0) > 0;
    if (hasVariants || hasSizes) { setQuickAdd(product); return; }
    addToCart(product);
  };

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-[#faf9f7]">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.4em] text-[#8b7355] font-medium block mb-2">
              Catalogue
            </span>
            <h2
              className="text-[#1a1713]/90 leading-tight"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.9rem, 5vw, 3.2rem)",
                fontWeight: 400,
                fontStyle: "italic",
              }}
            >
              Sélection Premium
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-[10px] uppercase tracking-[0.25em] font-medium text-[#1a1713]/40 hover:text-[#1a1713] transition-colors border-b border-[#1a1713]/15 hover:border-[#1a1713]/50 pb-0.5 self-start sm:self-auto whitespace-nowrap"
          >
            Voir tout →
          </Link>
        </div>

        {/* Tabs — scroll horizontal sur mobile */}
        <div className="flex gap-0 mb-8 sm:mb-10 border-b border-[#1a1713]/8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-3 text-[10px] uppercase tracking-[0.22em] font-medium whitespace-nowrap transition-all border-b-2 -mb-px shrink-0 ${
                  activeTab === tab.id
                    ? "border-[#1a1713] text-[#1a1713]"
                    : "border-transparent text-[#1a1713]/35 hover:text-[#1a1713]/65"
                }`}
              >
                {Icon && <Icon size={10} strokeWidth={2} />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {products.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-8 sm:gap-y-12">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-3/4 bg-[#1a1713]/5 mb-4" />
                <div className="h-4 bg-[#1a1713]/5 rounded mb-2 w-3/4" />
                <div className="h-3 bg-[#1a1713]/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-8 sm:gap-y-14">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
                tab={activeTab}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 sm:mt-20 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 border border-[#1a1713]/20 px-8 sm:px-12 py-3.5 sm:py-4 text-[10px] uppercase tracking-[0.25em] font-semibold text-[#1a1713] hover:bg-[#1a1713] hover:text-[#EDE8DF] hover:border-[#1a1713] transition-all duration-400"
          >
            Voir tous les produits
          </Link>
        </div>
      </div>

      {quickAdd && (
        <QuickAddModal product={quickAdd} onClose={() => setQuickAdd(null)} />
      )}
    </section>
  );
}
