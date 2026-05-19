"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const MARQUEE_ITEMS = [
  "Old Money", "Classique", "Intemporel", "Élégance", "Discrétion",
  "Qualité", "Héritage", "Style", "Noblesse", "Old Money",
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const imgY = useTransform(
    scrollYProgress, [0, 1],
    prefersReduced ? ["0%", "0%"] : ["0%", "12%"]
  );
  const fadeOut = useTransform(
    scrollYProgress, [0, 0.6],
    prefersReduced ? [1, 1] : [1, 0]
  );

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden pt-16 sm:pt-18 lg:pt-20 h-svh"
      style={{ backgroundColor: "#EDE8DF" }}
    >
      {/* Marquee — juste sous la navbar fixe */}
      <div className="absolute top-16 sm:top-18 lg:top-20 left-0 right-0 z-20 overflow-hidden bg-[#1a1713] py-1.5">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="mx-5 text-[8px] uppercase tracking-[0.45em] text-[#EDE8DF]/45"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {item}<span className="ml-5 text-[#EDE8DF]/20">·</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* Image de fond — mobile uniquement */}
      <div className="absolute inset-0 lg:hidden">
        <img
          src="/hero.jpg"
          alt=""
          className="w-full h-full object-cover object-top"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(237,232,223,0.55) 0%, rgba(237,232,223,0.85) 60%, rgba(237,232,223,1) 100%)" }}
        />
      </div>

      {/* Grid principal */}
      <motion.div
        style={{ opacity: fadeOut, height: "100%" }}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-2"
      >
        {/* ── Colonne texte ─────────────────────────────────────── */}
        <div className="flex flex-col justify-center gap-6 px-6 sm:px-10 lg:px-16
                        pt-12 sm:pt-14 lg:pt-16
                        pb-20 sm:pb-24 lg:pb-24">

          {/* Top meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex items-center gap-3"
          >
            <div className="h-px w-7 bg-[#8b7355]/50" />
            <span className="text-[9px] uppercase tracking-[0.5em] text-[#8b7355] font-medium">
              Collection 2025
            </span>
          </motion.div>

          {/* Bloc central */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-[10px] uppercase tracking-[0.5em] text-[#1a1713]/35 mb-4 font-medium"
            >
              Style vestimentaire
            </motion.p>

            {/* H1 */}
            <div className="overflow-hidden">
              <motion.h1
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="leading-[0.88] text-[#1a1713]"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "clamp(3.5rem, 10vw, 8rem)",
                  fontWeight: 300,
                  letterSpacing: "-0.03em",
                }}
              >
                Old
                <br />
                <em style={{ fontWeight: 600 }}>Money.</em>
              </motion.h1>
            </div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.85 }}
              className="mt-4 text-[#5a4e3a]/60 leading-relaxed text-sm max-w-xs"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
            >
              Coupes rigoureuses, matières nobles, aucun logo.
              L'élégance qui n'a pas besoin de se justifier.
            </motion.p>

            {/* Pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1.05 }}
              className="mt-4 flex flex-wrap gap-2"
            >
              {["Blazer", "Polo Piqué", "Chino", "Cachemire", "Lin"].map((item, i) => (
                <motion.span
                  key={item}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + i * 0.07, duration: 0.35 }}
                  className="text-[9px] uppercase tracking-[0.25em] text-[#8b7355] border border-[#8b7355]/25 px-2.5 py-1"
                >
                  {item}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.25 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/shop"
              className="group flex items-center justify-center gap-2 bg-[#1a1713] text-[#EDE8DF]
                         px-7 py-3.5 text-[10px] uppercase tracking-[0.38em] font-semibold
                         hover:bg-[#2e2a24] transition-colors duration-300 whitespace-nowrap"
            >
              Découvrir la boutique
              <ArrowUpRight size={12} strokeWidth={2}
                className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
            </Link>
            <Link
              href="/shop?sort=newest"
              className="flex items-center justify-center gap-2 border border-[#1a1713]/20
                         text-[#1a1713]/60 px-7 py-3.5 text-[10px] uppercase tracking-[0.38em]
                         font-medium hover:border-[#1a1713]/50 hover:text-[#1a1713]
                         transition-all duration-300 whitespace-nowrap"
            >
              Nouvelle collection
            </Link>
          </motion.div>
        </div>

        {/* ── Colonne image — desktop uniquement ───────────────── */}
        <div className="relative overflow-hidden hidden lg:block">
          <motion.div style={{ y: imgY }} className="absolute inset-0 scale-[1.08]">
            <img
              src="/hero.jpg"
              alt="Style Old Money — Homme élégant"
              className="w-full h-full object-cover object-top"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(237,232,223,0.6) 0%, transparent 30%), linear-gradient(to top, rgba(237,232,223,0.45) 0%, transparent 35%)",
              }}
            />
          </motion.div>

          {/* Quote card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="absolute bottom-10 left-6 z-10
                       max-w-52
                       bg-[#EDE8DF]/88 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-5
                       border-l-2 border-[#8b7355]"
          >
            <p
              className="text-[#1a1713]/70 leading-snug mb-2 text-sm"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
            >
              "Le vrai luxe ne se voit pas. Il se ressent."
            </p>
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#8b7355]">
              IA Store · Algérie
            </span>
          </motion.div>

          {/* Label haut-droite */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.6 }}
            className="absolute top-5 right-5 z-10 flex flex-col items-end gap-0.5"
          >
            <span className="text-[8px] uppercase tracking-[0.4em] text-[#1a1713]/25">Old Money</span>
            <span className="text-[8px] uppercase tracking-[0.3em] text-[#8b7355]/50">Aesthetic</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Diviseur vertical desktop */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block absolute top-24 bottom-0 left-1/2 w-px bg-[#1a1713]/8 origin-top z-20"
      />

      {/* Barre stats bas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.7 }}
        className="absolute bottom-0 left-0 right-0 z-20
                   border-t border-[#1a1713]/8 bg-[#EDE8DF]/75 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-10">
            {[
              { v: "100%", l: "Premium" },
              { v: "500+", l: "Pièces" },
              { v: "48h",  l: "Livraison" },
            ].map(({ v, l }) => (
              <div key={l} className="flex items-baseline gap-1">
                <span
                  className="text-sm sm:text-base text-[#1a1713]/65"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}
                >
                  {v}
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.18em] text-[#1a1713]/25">{l}</span>
              </div>
            ))}
          </div>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="hidden sm:flex items-center gap-2"
          >
            <div className="h-4 w-px bg-[#1a1713]/20" />
            <span className="text-[8px] uppercase tracking-[0.4em] text-[#1a1713]/20">Défiler</span>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
