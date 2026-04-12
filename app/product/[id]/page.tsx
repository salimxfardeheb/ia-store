"use client";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useCart } from "@/app/context/CartContext";
import { useParams, useRouter } from "next/navigation";
import { Product as P } from "@/app/variables";
import { useEffect, useState } from "react";
import { getProductById } from "@/services/products";

export default function ProductDetail() {
  const [product, setProduct] = useState<P | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProduct = async () => {
      const data = await getProductById(id as string);
      setProduct(data);
      if (data?.mainImage) setSelectedImage(data.mainImage);
    };
    loadProduct();
  }, [id]);

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center space-y-4">
        <h1 className="font-serif text-4xl">Produit introuvable</h1>
        <button
          onClick={() => router.push("/shop")}
          className="text-[11px] uppercase tracking-widest font-bold border-b border-black"
        >
          Retour à la boutique
        </button>
      </div>
    );
  }

  const allImages = [product.mainImage, ...(product.extraImages ?? [])].filter(
    Boolean,
  );

  return (
    <div className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold mb-12 opacity-40 hover:opacity-100 transition-opacity"
      >
        <ArrowLeft size={16} />
        <span>Retour</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {/* Image principale */}
          <div className="aspect-3/4 overflow-hidden bg-[#f5f5f5]">
            <img
              src={selectedImage || product.mainImage}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-500"
            />
          </div>

          {/* Miniatures */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`aspect-square overflow-hidden transition-all ${
                    selectedImage === img
                      ? "ring-2 ring-black opacity-100"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-8">
            <span className="text-black/40 text-[11px] uppercase tracking-[0.3em] font-medium mb-2 block">
              {product.category}
            </span>
            <h1 className="font-serif text-5xl italic mb-4">{product.name}</h1>
            <span className="text-2xl font-medium">
              {product.price.toLocaleString("fr-FR")} DA
            </span>
          </div>

          <p className="text-black/60 leading-relaxed mb-12 font-light">
            This piece represents the pinnacle of our design philosophy,
            combining traditional tailoring techniques with modern
            functionality. Crafted from premium materials sourced from the
            finest mills.
          </p>

          <div className="space-y-8 mb-12">
            {/* Size Selection */}
            {product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between mb-4">
                  <span className="text-[11px] uppercase tracking-widest font-bold">
                    Choisir la taille
                  </span>
                  <button className="text-[10px] uppercase tracking-widest opacity-40 border-b border-black/20">
                    Guide des tailles
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {Array.from(
                    product.sizes.reduce((map, { size, quantity }) => {
                      map.set(size, (map.get(size) ?? 0) + quantity);
                      return map;
                    }, new Map<string, number>()),
                    ([size, quantity]) => ({ size, quantity })
                  ).map(({ size, quantity }) => (
                    <button
                      key={size}
                      disabled={quantity === 0}
                      onClick={() => {
                        setSelectedSize(size);
                        setSizeError(false);
                        setQuantity((q) => Math.min(q, quantity));
                      }}
                      className={`w-12 h-12 border flex items-center justify-center text-xs font-medium transition-all ${
                        quantity === 0
                          ? "opacity-25 cursor-not-allowed border-black/10 line-through"
                          : selectedSize === size
                            ? "bg-black text-white border-black"
                            : sizeError
                              ? "border-red-400 hover:border-black"
                              : "border-black/10 hover:border-black"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {sizeError && (
                  <p className="text-red-500 text-[10px] uppercase tracking-widest mt-3">
                    Veuillez sélectionner une taille
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              {/* Quantity selector */}
              {(() => {
                const sizeEntry = selectedSize
                  ? product.sizes.find((s) => s.size === selectedSize)
                  : undefined;
                const maxQty = sizeEntry ? sizeEntry.quantity : product.stock;
                return (
                  <div className="flex items-center border border-black/10">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-12 h-16 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors text-lg font-light"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-medium font-serif">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="w-12 h-16 flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                );
              })()}

              {/* Add to bag */}
              <button
                onClick={() => {
                  if (product.sizes.length > 0 && !selectedSize) {
                    setSizeError(true);
                    return;
                  }
                  setSizeError(false);
                  for (let i = 0; i < quantity; i++)
                    addToCart(product, selectedSize || undefined);
                }}
                className="grow bg-black text-white py-5 text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black/80 transition-all luxury-shadow flex items-center justify-center space-x-3"
              >
                <ShoppingBag size={18} />
                <span>Ajouter au panier</span>
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 border-t border-black/5">
            <div className="flex flex-col items-center text-center space-y-2">
              <Truck size={20} strokeWidth={1} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Livraison gratuite
              </span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <RefreshCw size={20} strokeWidth={1} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Retours faciles
              </span>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <ShieldCheck size={20} strokeWidth={1} />
              <span className="text-[10px] uppercase tracking-widest font-bold">
                Paiement sécurisé
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
