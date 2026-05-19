"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface LookProduct {
  product: { id: string; name: string; mainImage: string; category: string; price: number };
}

interface Look {
  id: string;
  title: string;
  tag: string;
  description: string;
  imageUrl: string;
  accent: string;
  products: LookProduct[];
}

const FALLBACK_LOOKS: Look[] = [
  {
    id: "casual-chic",
    title: "Casual Chic",
    tag: "Quotidien",
    description: "Chemise oversize, pantalon chino structuré, sneakers blanches.",
    imageUrl: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800",
    accent: "#1a3a5c",
    products: [],
  },
  {
    id: "streetwear-elegant",
    title: "Streetwear Élégant",
    tag: "Moderne",
    description: "Hoodie premium, cargo slim, veste bomber légère.",
    imageUrl: "https://images.unsplash.com/photo-1571945153237-4929e783af4a?auto=format&fit=crop&q=80&w=800",
    accent: "#2d1a0e",
    products: [],
  },
  {
    id: "business-casual",
    title: "Business Casual",
    tag: "Bureau",
    description: "Blazer déstructuré, polo finition premium, chino marine.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800",
    accent: "#0d1a0d",
    products: [],
  },
];

export default function LooksSection() {
  const [looks, setLooks] = useState<Look[]>([]);

  useEffect(() => {
    fetch("/api/lookbook")
      .then((r) => r.json())
      .then((data: Look[]) => {
        setLooks(Array.isArray(data) && data.length > 0 ? data : FALLBACK_LOOKS);
      })
      .catch(() => setLooks(FALLBACK_LOOKS));
  }, []);

  const displayed = looks.length > 0 ? looks : FALLBACK_LOOKS;

  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6 bg-white">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.45em] text-[#8b7355] font-medium block mb-3">
              Inspirations
            </span>
            <h2
              className="leading-tight text-[#1a1713]/90"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "clamp(1.9rem, 5vw, 3.2rem)",
                fontWeight: 400,
                fontStyle: "italic",
              }}
            >
              Looks & Tenues
            </h2>
          </div>
          <p className="text-[#1a1713]/40 text-sm max-w-xs leading-relaxed font-light">
            Tenues complètes pensées pour l'homme moderne.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {displayed.map((look) => (
            <div key={look.id} className="group">
              <Link href="/shop" className="block relative overflow-hidden">
                <div className="relative aspect-3/4 sm:aspect-2/3 overflow-hidden">
                  <img
                    src={look.imageUrl}
                    alt={look.title}
                    className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.05]"
                  />

                  {/* Gradient */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }}
                  />

                  {/* Tag badge */}
                  {look.tag && (
                    <div className="absolute top-4 left-4">
                      <span
                        className="text-[8px] uppercase tracking-[0.3em] font-semibold px-2.5 py-1 text-white"
                        style={{ backgroundColor: look.accent }}
                      >
                        {look.tag}
                      </span>
                    </div>
                  )}

                  {/* Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                    <h3
                      className="text-white text-xl sm:text-2xl font-medium mb-1 leading-tight"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}
                    >
                      {look.title}
                    </h3>
                    {look.description && (
                      <p className="text-white/55 text-[11px] leading-relaxed mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                        {look.description}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.25em] text-white/75 font-medium group-hover:text-white transition-colors">
                      Voir la sélection
                      <ArrowRight size={10} strokeWidth={2} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </Link>

              {/* Produits référencés */}
              {look.products.length > 0 && (
                <div className="mt-3 flex items-center gap-2 flex-wrap px-1">
                  {look.products.slice(0, 4).map((lp) => (
                    <Link
                      key={lp.product.id}
                      href={`/product/${lp.product.id}`}
                      className="group/prod flex items-center gap-2 border border-[#1a1713]/8 hover:border-[#1a1713]/25 px-2 py-1.5 transition-colors"
                      title={lp.product.name}
                    >
                      {lp.product.mainImage && (
                        <img
                          src={lp.product.mainImage}
                          alt={lp.product.name}
                          className="w-6 h-8 object-cover shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-[9px] font-medium text-[#1a1713]/70 truncate max-w-20 group-hover/prod:text-[#1a1713] transition-colors">
                          {lp.product.name}
                        </p>
                        <p className="text-[8px] text-[#8b7355]">{lp.product.price.toLocaleString("fr-FR")} DA</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-14 text-center">
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 bg-[#1a1713] text-[#EDE8DF] px-8 sm:px-10 py-3.5 sm:py-4 text-[10px] uppercase tracking-[0.3em] font-semibold hover:bg-[#2e2a24] transition-colors duration-300"
          >
            Explorer la collection
            <ArrowRight size={12} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
