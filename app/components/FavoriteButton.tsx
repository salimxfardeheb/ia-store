"use client";

import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { MouseEvent } from "react";
import { Product } from "../variables";
import { useFavorites } from "@/app/context/FavoritesContext";

interface Props {
  product: Product;
  /** Visual preset:
   *  - "card":    floating round button on a product card
   *  - "detail":  inline pill button used on the product detail page
   *  - "bare":    transparent icon-only (use inside other layouts) */
  variant?: "card" | "detail" | "bare";
  size?: number;
  className?: string;
}

export function FavoriteButton({
  product,
  variant = "card",
  size = 18,
  className = "",
}: Props) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(product.id);

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product);
  };

  const base =
    "flex items-center justify-center transition-all duration-300 select-none";

  const variantClasses: Record<NonNullable<Props["variant"]>, string> = {
    card:
      "w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm luxury-shadow hover:scale-105",
    detail:
      "h-14 px-5 border border-black/15 bg-white text-[10px] uppercase tracking-[0.3em] font-medium hover:border-black",
    bare: "",
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.9 }}
      aria-pressed={active}
      aria-label={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      title={active ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`${base} ${variantClasses[variant]} ${className}`}
    >
      <Heart
        size={size}
        strokeWidth={1.5}
        className={`transition-colors duration-300 ${
          active ? "text-red-500" : "text-black/70"
        }`}
        fill={active ? "currentColor" : "none"}
      />
      {variant === "detail" && (
        <span className="ml-3">{active ? "Favori" : "Ajouter aux favoris"}</span>
      )}
    </motion.button>
  );
}
