"use client";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, ShoppingBag, Truck, ShieldCheck, RefreshCw } from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useParams, useRouter } from "next/navigation";
import { Product as P } from "@/app/variables";
import { useEffect, useState } from "react";
import { getProductById } from "@/services/products";
import { FavoriteButton } from "@/app/components/FavoriteButton";

const isHex = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c);

export default function ProductDetail() {
  const [product, setProduct]           = useState<P | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize]   = useState<string>("");
  const [quantity, setQuantity]           = useState(1);
  const [sizeError, setSizeError]         = useState(false);
  const [loading, setLoading]             = useState(true);

  const { id }       = useParams();
  const router       = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      const data = await getProductById(id as string);
      setProduct(data);
      if (data?.mainImage) setSelectedImage(data.mainImage);
      if (data?.variants?.length) setSelectedColor(data.variants[0].color);
      setLoading(false);
    };
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] pt-28 pb-24 px-6">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-2 w-14 bg-[#E8E3DB] mb-14" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
            <div className="aspect-3/4 bg-[#EDE9E3]" />
            <div className="space-y-6 pt-4">
              <div className="h-2 w-14 bg-[#EDE9E3]" />
              <div className="h-12 w-3/4 bg-[#EDE9E3]" />
              <div className="h-5 w-24 bg-[#EDE9E3]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center gap-8">
        <div className="w-16 h-px bg-black/15" />
        <h1 className="font-serif text-4xl italic text-black/50">Produit introuvable</h1>
        <div className="w-16 h-px bg-black/15" />
        <button
          onClick={() => router.push("/shop")}
          className="text-[10px] uppercase tracking-[0.35em] font-medium text-black/50 border-b border-black/20 pb-0.5 hover:text-black hover:border-black transition-colors"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const hasVariants   = (product.variants?.length ?? 0) > 0;
  const activeVariant = hasVariants
    ? (product.variants!.find((v) => v.color === selectedColor) ?? product.variants![0])
    : null;

  // Sizes to display
  const variantSizes = activeVariant?.sizes ?? [];
  const flatSizes    = product.sizes;

  // Price: can be overridden per variant-size
  const selectedVSize  = selectedSize ? variantSizes.find((s) => s.name === selectedSize) : undefined;
  const displayPrice   = selectedVSize?.price ?? product.price;

  // Max quantity
  const maxQty = (() => {
    if (activeVariant && selectedSize) return selectedVSize?.stock ?? 1;
    if (!activeVariant && selectedSize) {
      return flatSizes.find((s) => s.size === selectedSize)?.quantity ?? 1;
    }
    return product.stock;
  })();

  // Images: extraImages is now a proper array from the API
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
    const needsSize = hasVariants
      ? variantSizes.length > 0
      : flatSizes.length > 0;
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
            {/* Vertical thumbnail strip */}
            {allImages.length > 1 && (
              <div className="flex flex-col gap-2 w-18 shrink-0">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square overflow-hidden transition-all duration-300 ${
                      selectedImage === img
                        ? "ring-1 ring-black/70 opacity-100"
                        : "opacity-35 hover:opacity-70"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main image */}
            <div className="flex-1 aspect-3/4 overflow-hidden bg-[#EDE9E3]">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                src={selectedImage || product.mainImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          {/* ── Right: Info ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col lg:pt-6"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] font-medium text-black/35 mb-4">
              {product.category}
            </span>

            <h1 className="font-serif text-5xl italic leading-tight mb-6 text-black/90">
              {product.name}
            </h1>

            <div className="w-10 h-px bg-black/15 mb-6" />

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-10">
              <span className="font-serif text-3xl text-black/80">
                {displayPrice.toLocaleString("fr-FR")}
              </span>
              <span className="text-[11px] uppercase tracking-widest text-black/40 font-medium">DA</span>
            </div>

            <p className="text-[13px] text-black/50 leading-7 mb-10 font-light max-w-sm">
              Une pièce qui incarne l'élégance intemporelle, confectionnée dans
              des matières d'exception. Coupe soignée, finitions impeccables.
            </p>

            <div className="space-y-8 mb-12">

              {/* ── Color variants ──────────────────────────────────────── */}
              {hasVariants && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-black/60">
                      Couleur
                    </span>
                    {selectedColor && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">
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

              {/* ── Size selection ──────────────────────────────────────── */}
              {(hasVariants ? variantSizes.length > 0 : flatSizes.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-black/60">
                      Taille
                    </span>
                    <button className="text-[9px] uppercase tracking-widest text-black/30 border-b border-black/15 pb-0.5 hover:text-black/60 hover:border-black/40 transition-colors">
                      Guide des tailles
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
                            className={`w-11 h-11 flex items-center justify-center text-[11px] font-medium tracking-wider transition-all duration-200 border ${
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
                            className={`w-11 h-11 flex items-center justify-center text-[11px] font-medium tracking-wider transition-all duration-200 border ${
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
                      Veuillez sélectionner une taille
                    </p>
                  )}
                </div>
              )}

              {/* ── Actions ─────────────────────────────────────────────── */}
              {selectedSize && (
                <p className="text-[9px] uppercase tracking-[0.3em] -mt-4">
                  {maxQty <= 3 ? (
                    <span className="text-amber-500">{maxQty} restant{maxQty > 1 ? "s" : ""}</span>
                  ) : (
                    <span className="text-black/35">{maxQty} en stock</span>
                  )}
                </p>
              )}
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
                <FavoriteButton product={product} variant="bare" size={20} className="h-14 w-14 border border-black/15 hover:border-black" />
              </div>
            </div>

            {/* Reassurance */}
            <div className="pt-8 border-t border-black/6 grid grid-cols-3 gap-4">
              {[
                { icon: Truck,       label: "Livraison gratuite" },
                { icon: RefreshCw,  label: "Retours faciles" },
                { icon: ShieldCheck, label: "Paiement sécurisé" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center text-center gap-3">
                  <Icon size={17} strokeWidth={1} className="text-black/40" />
                  <span className="text-[9px] uppercase tracking-[0.25em] font-medium text-black/35 leading-4">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
