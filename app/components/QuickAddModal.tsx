"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Product } from "../variables";
import { useCart } from "@/app/context/CartContext";
import { FavoriteButton } from "./FavoriteButton";

const isHex = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c);

export function QuickAddModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addToCart } = useCart();

  const hasVariants = (product.variants?.length ?? 0) > 0;

  const [selectedColor, setSelectedColor] = useState<string>(
    hasVariants ? product.variants![0].color : ""
  );
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeError, setSizeError] = useState(false);
  const [added, setAdded] = useState(false);

  const activeVariant = hasVariants
    ? product.variants!.find((v) => v.color === selectedColor) ??
      product.variants![0]
    : null;

  const variantSizes = activeVariant?.sizes ?? [];
  const flatSizes = product.sizes;

  const aggregatedFlatSizes = useMemo(
    () =>
      Array.from(
        flatSizes.reduce((map, { size, quantity }) => {
          map.set(size, (map.get(size) ?? 0) + quantity);
          return map;
        }, new Map<string, number>()),
        ([size, qty]) => ({ size, qty })
      ),
    [flatSizes]
  );

  const needsSize = hasVariants
    ? variantSizes.length > 0
    : flatSizes.length > 0;

  const selectedVSize = selectedSize
    ? variantSizes.find((s) => s.name === selectedSize)
    : undefined;
  const displayPrice = selectedVSize?.price ?? product.price;

  const previewImage =
    (selectedColor &&
      product.extraImages?.find((img) => img.color === selectedColor)?.url) ||
    product.mainImage;

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setSelectedSize("");
    setSizeError(false);
  };

  const handleAdd = () => {
    if (needsSize && !selectedSize) {
      setSizeError(true);
      return;
    }
    const colorToSend = hasVariants ? selectedColor || undefined : undefined;
    addToCart(product, selectedSize || undefined, colorToSend);
    setAdded(true);
    setTimeout(() => onClose(), 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="bg-white w-full max-w-md max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-black/8">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-20 overflow-hidden bg-[#F2F0ED] shrink-0">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-black/40 block mb-1">
                {product.category}
              </span>
              <h2 className="font-serif text-lg italic text-black/80 leading-tight">
                {product.name}
              </h2>
              <p className="text-[11px] text-black/60 mt-1">
                <span className="font-medium">
                  {displayPrice.toLocaleString("fr-FR")}
                </span>{" "}
                <span className="uppercase tracking-widest text-black/40">
                  DA
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 mt-1">
            <FavoriteButton product={product} variant="bare" size={18} className="text-black/40 hover:text-black p-1" />
            <button
              onClick={onClose}
              className="text-black/20 hover:text-black/60 transition-colors p-1"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-6">
          {/* Color variants */}
          {hasVariants && (
            <div>
              <div className="flex items-center justify-between mb-3">
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

          {/* Sizes */}
          {needsSize && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] font-medium text-black/60">
                  Taille
                </span>
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
                        }}
                        className={`w-11 h-11 flex items-center justify-center text-[11px] font-medium tracking-wider transition-all duration-200 border ${
                          stock === 0
                            ? "opacity-20 cursor-not-allowed border-black/10 line-through"
                            : selectedSize === name
                            ? "bg-black text-white border-black"
                            : sizeError
                            ? "border-red-300 text-black/60 hover:border-black hover:text-black"
                            : "border-black/15 text-black/60 hover:border-black hover:text-black"
                        }`}
                      >
                        {name}
                      </button>
                    ))
                  : aggregatedFlatSizes.map(({ size, qty }) => (
                      <button
                        key={size}
                        disabled={qty === 0}
                        onClick={() => {
                          setSelectedSize(size);
                          setSizeError(false);
                        }}
                        className={`w-11 h-11 flex items-center justify-center text-[11px] font-medium tracking-wider transition-all duration-200 border ${
                          qty === 0
                            ? "opacity-20 cursor-not-allowed border-black/10 line-through"
                            : selectedSize === size
                            ? "bg-black text-white border-black"
                            : sizeError
                            ? "border-red-300 text-black/60 hover:border-black hover:text-black"
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

          {/* Add to cart */}
          <button
            onClick={handleAdd}
            disabled={added}
            className="w-full h-12 bg-black text-white text-[10px] uppercase tracking-[0.3em] font-medium hover:bg-black/80 transition-colors flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-3"
                >
                  Ajouté au panier
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center gap-3"
                >
                  <ShoppingBag size={14} strokeWidth={1.5} />
                  <span>Ajouter au panier</span>
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
