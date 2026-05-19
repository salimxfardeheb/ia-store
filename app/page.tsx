import Hero from "@/app/components/Hero";
import ProductGrid from "@/app/components/ProductGrid";
import BrandValues from "@/app/components/BrandValues";
import LooksSection from "@/app/components/LooksSection";

export default function HomePage() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <BrandValues />
      <ProductGrid />
      <LooksSection />
    </div>
  );
}
