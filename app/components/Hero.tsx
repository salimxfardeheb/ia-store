"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";

const WORDS = ["Intemporel.", "Raffiné.", "Naturel."];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Sur mobile (< 1024 px) ou si l'utilisateur a activé "réduire les animations",
  // on fige les valeurs de parallaxe à leur état initial.
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  const disableParallax = prefersReduced || isMobile;

  const imageY = useTransform(scrollYProgress, [0, 1], disableParallax ? ["0%", "0%"] : ["0%", "20%"]);
  const textY  = useTransform(scrollYProgress, [0, 1], disableParallax ? ["0%", "0%"] : ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], disableParallax ? [1, 1] : [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-175 overflow-hidden bg-white"
    >
      {/* Superposition texture grain */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px",
        }}
      />

      {/* Lignes verticales décoratives */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute left-[8%] top-0 h-full w-px bg-white/8" />
        <div className="absolute right-[8%] top-0 h-full w-px bg-white/8" />
      </div>

      {/* Image de fond avec parallaxe */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 z-0 scale-110"
      >
        <div
          className="h-full w-full"
          style={{
            background: `linear-gradient(165deg, #ffffff 0%, #f5f5f5 40%, #eeeeee 70%, #e8e8e8 100%)`,
          }}
        />

        {/* Superposition atmosphérique */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 80% at 60% 40%, transparent 30%, rgba(0,0,0,0.08) 100%),
              linear-gradient(to right, rgba(0,0,0,0.03) 0%, rgba(0,0,0,0.01) 42%, transparent 65%)
            `,
          }}
        />
      </motion.div>

      {/* Contenu */}
      <motion.div
        style={{ y: textY, opacity }}
        className="relative z-20 flex h-full flex-col justify-center px-[8%]"
      >
        {/* Étiquette saison */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="my-10 flex items-center space-x-4"
        >
          <div className="h-px w-12 bg-black/40" />
          <span
            className="text-[10px] uppercase tracking-[0.35em] text-black/50"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Collection Printemps — 2025
          </span>
        </motion.div>

        {/* Titre principal */}
        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="leading-none text-black/90"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
              fontWeight: 300,
              fontStyle: "italic",
              letterSpacing: "-0.02em",
            }}
          >
            L'Art du
            <br />
            <span style={{ fontWeight: 600 }}>Gentleman</span>
          </motion.h1>
        </div>

        {/* Mots animés */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-6 flex items-center space-x-3"
        >
          {WORDS.map((word, i) => (
            <motion.span
              key={word}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1 + i * 0.15 }}
              className="text-[11px] uppercase tracking-[0.25em] text-black/60"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {word}
              {i < WORDS.length - 1 && (
                <span className="ml-3 text-black/20">·</span>
              )}
            </motion.span>
          ))}
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-8 max-w-xs leading-relaxed text-black/35"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1rem",
          }}
        >
          Des pièces conçues pour l'homme qui comprend que le vrai luxe réside
          dans la discrétion et la permanence du style.
        </motion.p>

        {/* Boutons d'action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          className="mt-12 flex items-center space-x-8"
        >
          <Link
            href="/boutique"
            className="group relative overflow-hidden bg-black px-10 py-4 text-[10px] uppercase tracking-[0.3em] text-white transition-all duration-300 hover:bg-white/85"
          >
            <span className="relative z-10">Découvrir la Collection</span>
          </Link>

          <Link
            href="/notre-histoire"
            className="group flex items-center space-x-3 text-[10px] uppercase tracking-[0.3em] text-black/60 transition-colors hover:text-black"
          >
            <span>Notre Histoire</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Barre inférieure */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        className="absolute bottom-0 left-0 right-0 z-20 flex items-end justify-between px-[8%] py-8"
      >
        {/* Indicateur de défilement */}
        <div className="flex flex-col items-center space-y-3">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center space-y-1"
          >
            <div className="h-8 w-px bg-black/20" />
            <div className="h-1.5 w-1.5 rounded-full bg-black/50" />
          </motion.div>
          <span
            className="text-[8px] uppercase tracking-[0.4em] text-black/25"
            style={{ writingMode: "vertical-rl" }}
          >
            Défiler
          </span>
        </div>

        {/* Statistiques */}
        <div className="hidden sm:flex items-center space-x-10">
          {[
            { value: "MMXXV", label: "Fondé" },
            { value: "100%", label: "Matières naturelles" },
            { value: "∞", label: "Intemporel" },
          ].map(({ value, label }) => (
            <div key={label} className="text-right">
              <div
                className="text-lg text-black/60"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                {value}
              </div>
              <div className="text-[9px] uppercase tracking-[0.25em] text-black/25">
                {label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Chiffre romain décoratif */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 1.6 }}
        className="pointer-events-none absolute bottom-16 right-[8%] z-20 hidden lg:block"
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "12rem",
          fontWeight: 300,
          color: "rgba(255,255,255,0.03)",
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        I
      </motion.div>
    </section>
  );
}