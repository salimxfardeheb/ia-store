"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useFavorites } from "@/app/context/FavoritesContext";

export default function FavoritesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { favorites, isLoading, removeFavorite } = useFavorites();
  const router = useRouter();

  // Redirect to login if visitor isn't authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?next=/favorites");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-64 bg-black/5" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mt-16">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="aspect-3/4 bg-black/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <header className="mb-16">
        <h1 className="font-serif text-6xl italic mb-6">Mes favoris</h1>
        <p className="text-black/40 text-sm uppercase tracking-widest">
          {favorites.length} {favorites.length > 1 ? "pièces sélectionnées" : "pièce sélectionnée"}
        </p>
      </header>

      {isLoading && favorites.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="aspect-3/4 bg-black/5" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-32 flex flex-col items-center gap-6">
          <Heart size={36} strokeWidth={1} className="text-black/20" />
          <p className="font-serif text-3xl italic text-black/40">
            Aucun favori pour le moment
          </p>
          <p className="text-[11px] uppercase tracking-widest text-black/40 max-w-sm">
            Parcourez la boutique et appuyez sur le cœur pour sauvegarder
            les pièces qui vous inspirent.
          </p>
          <Link
            href="/shop"
            className="mt-4 border border-black/10 px-12 py-4 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all duration-500"
          >
            Découvrir la collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          <AnimatePresence>
            {favorites.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: (index % 6) * 0.05 }}
                className="group"
              >
                <div className="relative aspect-3/4 overflow-hidden bg-[#f5f5f5] mb-6">
                  <Link href={`/product/${product.id}`}>
                    {product.mainImage ? (
                      <img
                        src={product.mainImage}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#F2F0ED]" />
                    )}
                  </Link>

                  <button
                    onClick={() => removeFavorite(product.id)}
                    aria-label="Retirer des favoris"
                    title="Retirer des favoris"
                    className="absolute top-6 right-6 w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center luxury-shadow z-10 hover:bg-black hover:text-white transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={1.5} />
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
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
