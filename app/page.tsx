import Hero from "@/app/components/Hero";
import ProductGrid from "@/app/components/ProductGrid";
import BrandValues from "@/app/components/BrandValues";
import LooksSection from "@/app/components/LooksSection";

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* 1 — Hero */}
      <Hero />

      {/* 2 — Valeurs de marque */}
      <BrandValues />

      {/* 3 — Produits vedettes */}
      <ProductGrid />

      {/* 5 — Looks / Inspirations */}
      <LooksSection />
    </div>
  );
}
