"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, ShoppingBag, Truck, ShieldCheck, RefreshCw, Tag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";
import { useRouter } from "next/navigation";
import { Product } from "@/app/variables";
import { FavoriteButton } from "@/app/components/FavoriteButton";
import type { LookSuggestion, SuggestedProduct } from "./page";

const isHex = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c);

interface Props {
  product:          Product;
  lookSuggestions:  LookSuggestion[];
  fallbackProducts: SuggestedProduct[];
}

export default function ProductDetailClient({ product, lookSuggestions, fallbackProducts }: Props) {
  const [selectedImage, setSelectedImage] = useState<string>(product.mainImage ?? "");
  const [selectedColor, setSelectedColor] = useState<string>(
    product.variants?.length ? product.variants[0].color : ""
  );
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity]         = useState(1);
  const [sizeError, setSizeError]       = useState(false);

  const router        = useRouter();
  const { addToCart } = useCart();

  // ── Derived data ──────────────────────────────────────────────────────────

  const isShoe      = product.category.toLowerCase().includes("chaussure");
  const hasVariants = (product.variants?.length ?? 0) > 0;
  const activeVariant = hasVariants
    ? (product.variants!.find((v) => v.color === selectedColor) ?? product.variants![0])
    : null;

  const variantSizes = activeVariant?.sizes ?? [];
  const flatSizes    = product.sizes;

  const selectedVSize  = selectedSize
    ? variantSizes.find((s) => s.name === selectedSize)
    : undefined;
  const basePrice      = selectedVSize?.price ?? product.price;
  const discountPct    = product.discountPercent ?? 0;
  const displayPrice   = discountPct ? Math.round(basePrice * (1 - discountPct / 100)) : basePrice;
  const hasPromo       = discountPct > 0;

  const maxQty = (() => {
    if (activeVariant && selectedSize) return selectedVSize?.stock ?? 1;
    if (!activeVariant && selectedSize) {
      return flatSizes.find((s) => s.size === selectedSize)?.quantity ?? 1;
    }
    return product.stock;
  })();

  const extraUrls = Array.isArray(product.extraImages)
    ? product.extraImages.map((img) => img.url)
    : [];
  const allImages = [product.mainImage, ...extraUrls].filter(Boolean) as string[];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedSize("");
    setSizeError(false);
    setQuantity(1);
    const colorImg = product.extraImages?.find((img) => img.color === color);
    setSelectedImage(colorImg?.url ?? product.mainImage);
  };

  const handleAddToCart = () => {
    const needsSize = hasVariants ? variantSizes.length > 0 : flatSizes.length > 0;
    if (needsSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    setSizeError(false);
    const colorToSend = hasVariants ? selectedColor || undefined : undefined;
    for (let i = 0; i < quantity; i++)
      addToCart(product, selectedSize || undefined, colorToSend);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] pt-28 pb-28 px-6">
      <div className="max-w-7xl mx-auto">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.3em] font-medium text-black/35 hover:text-black transition-colors mb-14"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          <span>Retour</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">

          {/* ── Left: Gallery ───────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="flex gap-3"
          >
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2 w-18 shrink-0">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-square overflow-hidden transition-all duration-300 ${
                      selectedImage === img
                        ? "ring-1 ring-black/70 opacity-100"
                        : "opacity-35 hover:opacity-70"
                    }`}
                  >
                    <Image src={img} alt={`${product.name} ${i + 1}`} fill sizes="72px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="relative flex-1 aspect-3/4 overflow-hidden bg-[#EDE9E3]">
              <motion.div
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Image
                  src={selectedImage || product.mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              </motion.div>

              {/* Badge promo sur l'image */}
              {hasPromo && (
                <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 flex items-center gap-1.5">
                  <Tag size={11} strokeWidth={2.5} />
                  -{discountPct}%
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Right: Info ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col lg:pt-6"
          >
            {/* Catégorie + badge promo */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-black/35">
                {product.category}
              </span>
              {hasPromo && (
                <span className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1">
                  <Tag size={9} strokeWidth={2.5} />
                  -{discountPct}%
                </span>
              )}
            </div>

            <h1 className="font-serif text-5xl italic leading-tight mb-6 text-black/90">
              {product.name}
            </h1>

            <div className="w-10 h-px bg-black/15 mb-6" />

            {/* Prix */}
            <div className="mb-10">
              <div className="flex items-baseline gap-3">
                <span className={`font-serif text-3xl ${hasPromo ? "text-red-500" : "text-black/80"}`}>
                  {displayPrice.toLocaleString("fr-FR")}
                </span>
                <span className="text-[11px] uppercase tracking-widest text-black/60 font-medium">DA</span>
                {hasPromo && (
                  <span className="font-serif text-xl text-black/25 line-through">
                    {basePrice.toLocaleString("fr-FR")} DA
                  </span>
                )}
              </div>
              {hasPromo && (
                <p className="text-[10px] text-red-400 uppercase tracking-widest mt-1.5 font-medium">
                  Vous économisez {(basePrice - displayPrice).toLocaleString("fr-FR")} DA
                </p>
              )}
            </div>
            <div className="space-y-8 mb-12">

              {/* ── Color variants ──────────────────────────────────────── */}
              {hasVariants && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-black/60">
                      Couleur
                    </span>
                    {selectedColor && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-black/60">
                        {selectedColor}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants!.map((v) => (
                      <button
                        key={v.color}
                        onClick={() => handleColorSelect(v.color)}
                        title={v.color}
                        className={`transition-all duration-200 ${
                          isHex(v.color)
                            ? `w-8 h-8 rounded-full border-2 ${
                                selectedColor === v.color
                                  ? "border-black scale-110"
                                  : "border-transparent hover:border-black/30 hover:scale-105"
                              }`
                            : `px-4 h-9 text-[10px] uppercase tracking-widest font-medium border ${
                                selectedColor === v.color
                                  ? "bg-black text-white border-black"
                                  : "border-black/15 text-black/60 hover:border-black hover:text-black"
                              }`
                        }`}
                        style={isHex(v.color) ? { backgroundColor: v.color } : {}}
                      >
                        {isHex(v.color) ? null : v.color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Size / Pointure selection ────────────────────────────── */}
              {(hasVariants ? variantSizes.length > 0 : flatSizes.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-black/60">
                      {isShoe ? "Pointure" : "Taille"}
                    </span>
                    <button className="text-[9px] uppercase tracking-widest text-black/30 border-b border-black/15 pb-0.5 hover:text-black/60 hover:border-black/40 transition-colors">
                      {isShoe ? "Guide des pointures" : "Guide des tailles"}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {hasVariants
                      ? variantSizes.map(({ name, stock }) => (
                          <button
                            key={name}
                            disabled={stock === 0}
                            onClick={() => {
                              setSelectedSize(name);
                              setSizeError(false);
                              setQuantity((q) => Math.min(q, stock));
                            }}
                            className={`${isShoe ? "min-w-13 px-2 h-11" : "w-11 h-11"} flex items-center justify-center text-[11px] font-medium tracking-wider transition-all duration-200 border ${
                              stock === 0
                                ? "opacity-20 cursor-not-allowed border-black/10 line-through"
                                : selectedSize === name
                                ? "bg-black text-white border-black"
                                : sizeError
                                ? "border-black/30 text-black/60 hover:border-black hover:text-black"
                                : "border-black/15 text-black/60 hover:border-black hover:text-black"
                            }`}
                          >
                            {name}
                          </button>
                        ))
                      : Array.from(
                          flatSizes.reduce((map, { size, quantity }) => {
                            map.set(size, (map.get(size) ?? 0) + quantity);
                            return map;
                          }, new Map<string, number>()),
                          ([size, qty]) => ({ size, qty })
                        ).map(({ size, qty }) => (
                          <button
                            key={size}
                            disabled={qty === 0}
                            onClick={() => {
                              setSelectedSize(size);
                              setSizeError(false);
                              setQuantity((q) => Math.min(q, qty));
                            }}
                            className={`${isShoe ? "min-w-13 px-2 h-11" : "w-11 h-11"} flex items-center justify-center text-[11px] font-medium tracking-wider transition-all duration-200 border ${
                              qty === 0
                                ? "opacity-20 cursor-not-allowed border-black/10 line-through"
                                : selectedSize === size
                                ? "bg-black text-white border-black"
                                : sizeError
                                ? "border-black/30 text-black/60 hover:border-black hover:text-black"
                                : "border-black/15 text-black/60 hover:border-black hover:text-black"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                  </div>

                  {sizeError && (
                    <p className="text-[9px] uppercase tracking-[0.3em] text-red-400 mt-3">
                      {isShoe ? "Veuillez sélectionner une pointure" : "Veuillez sélectionner une taille"}
                    </p>
                  )}
                </div>
              )}

              {/* ── Stock indicator ─────────────────────────────────────── */}
              {selectedSize && (
                <p className="text-[9px] uppercase tracking-[0.3em] -mt-4">
                  {maxQty <= 3 ? (
                    <span className="text-amber-500">{maxQty} restant{maxQty > 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-black/35">{maxQty} en stock</span>
                  )}
                </p>
              )}

              {/* ── Actions ─────────────────────────────────────────────── */}
              <div className="flex gap-3">
                {/* Quantity */}
                <div className="flex items-center border border-black/10 bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-14 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/3 transition-colors"
                  >
                    <Minus size={13} strokeWidth={1.5} />
                  </button>
                  <span className="w-9 text-center text-sm font-serif text-black/80">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                    className="w-11 h-14 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/3 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <Plus size={13} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Add to bag */}
                <button
                  onClick={handleAddToCart}
                  className="grow h-14 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-black/80 transition-colors flex items-center justify-center gap-3"
                >
                  <ShoppingBag size={15} strokeWidth={1.5} />
                  <span>Ajouter au panier</span>
                </button>

                {/* Favorite */}
                <FavoriteButton
                  product={product}
                  variant="bare"
                  size={20}
                  className="h-14 w-14 border border-black/15 hover:border-black"
                />
              </div>
            </div>

            {/* Reassurance */}
            <div className="pt-8 border-t border-black/6 grid grid-cols-3 gap-4">
              {[
                { icon: Truck,        label: "Livraison gratuite" },
                { icon: RefreshCw,   label: "Retours faciles" },
                { icon: ShieldCheck,  label: "Paiement sécurisé" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-3">
                  <Icon size={17} strokeWidth={1} className="text-black/60" />
                  <span className="text-[9px] uppercase tracking-[0.25em] font-medium text-black/35 leading-4">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Suggestions Looks & Tenues ───────────────────────────────── */}
        {(lookSuggestions.length > 0 || fallbackProducts.length > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-24 pt-16 border-t border-black/8"
          >
            {lookSuggestions.length > 0 ? (
              lookSuggestions.map((look) => (
                <div key={look.lookId} className="mb-16 last:mb-0">
                  {/* Header look */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      {/* Miniature du look */}
                      <div className="relative w-12 h-16 overflow-hidden shrink-0 bg-[#EDE9E3]">
                        {look.lookImage && (
                          <Image
                            src={look.lookImage}
                            alt={look.lookTitle}
                            fill
                            sizes="48px"
                            className="object-cover object-top"
                          />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-black/35 mb-1">
                          Looks & Tenues
                        </p>
                        <h2 className="font-serif text-2xl italic text-black/85">
                          {look.lookTitle}
                        </h2>
                      </div>
                    </div>
                    <Link
                      href="/shop"
                      className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-black/35 hover:text-black transition-colors border-b border-transparent hover:border-black/30 pb-0.5"
                    >
                      Voir tout <ArrowRight size={11} strokeWidth={1.8} />
                    </Link>
                  </div>

                  {/* Grille produits du look */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {look.products.map((p) => (
                      <SuggestedCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback même catégorie */
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.4em] text-black/35 mb-1">
                      Vous aimerez aussi
                    </p>
                    <h2 className="font-serif text-2xl italic text-black/85">
                      Dans la même catégorie
                    </h2>
                  </div>
                  <Link
                    href={`/shop?category=${encodeURIComponent(product.category)}`}
                    className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-black/35 hover:text-black transition-colors border-b border-transparent hover:border-black/30 pb-0.5"
                  >
                    Voir tout <ArrowRight size={11} strokeWidth={1.8} />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                  {fallbackProducts.map((p) => (
                    <SuggestedCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </motion.section>
        )}
      </div>
    </div>
  );
}

// ── Card suggestion ────────────────────────────────────────────────────────
function SuggestedCard({ product: p }: { product: SuggestedProduct }) {
  const promoPrice = p.discountPercent
    ? Math.round(p.price * (1 - p.discountPercent / 100))
    : null;

  return (
    <Link href={`/product/${p.id}`} className="group block">
      {/* Image */}
      <div className="relative aspect-3/4 overflow-hidden bg-[#EDE9E3] mb-3">
        {p.mainImage ? (
          <Image
            src={p.mainImage}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="w-full h-full" />
        )}
        {p.discountPercent && (
          <div className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5">
            -{p.discountPercent}%
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/6 transition-colors duration-500" />
      </div>

      {/* Info */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-black/35 mb-1">{p.category}</p>
      <h3 className="font-serif text-base text-black/85 leading-tight mb-1.5 group-hover:italic transition-all line-clamp-2">
        {p.name}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className={`text-sm font-medium ${promoPrice ? "text-red-500" : "text-black/70"}`}>
          {(promoPrice ?? p.price).toLocaleString("fr-FR")} DA
        </span>
        {promoPrice && (
          <span className="text-xs text-black/25 line-through">
            {p.price.toLocaleString("fr-FR")} DA
          </span>
        )}
      </div>
    </Link>
  );
}