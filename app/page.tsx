"use client";

import Hero from "@/app/components/Hero";
import ProductGrid from "@/app/components/ProductGrid";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Hero />

      {/* Featured Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-4/5 overflow-hidden rounded-2xl luxury-shadow">
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000"
                alt="Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
          </motion.div>

          <div className="space-y-8">
            <span className="text-black/40 text-[11px] uppercase tracking-[0.4em] font-medium block">
              The Heritage
            </span>

            <h2 className="font-serif text-5xl md:text-6xl leading-tight italic">
              Uncompromising <br />
              <span className="not-italic font-bold">Craftsmanship.</span>
            </h2>

            <p className="text-black/60 text-lg leading-relaxed font-light">
              Every piece in our collection is a testament to our dedication to
              quality.
            </p>
          </div>
        </div>
      </section>

      <ProductGrid />

      {/* Newsletter */}
      <section className="py-32 px-6 bg-[#f5f5f0]">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-serif text-5xl italic">Join the Circle</h2>
        </div>
      </section>
    </motion.div>
  );
}
