"use client";

import {
  Sparkles,
  Shirt,
  Gem,
  BadgeCheck,
  HeartHandshake,
} from "lucide-react";

const VALUES = [
  {
    icon: Shirt,
    title: "Style moderne",
    desc: "Des pièces casual & sport pensées pour un look élégant au quotidien.",
  },
  {
    icon: Gem,
    title: "Finitions soignées",
    desc: "Des détails propres et des coupes travaillées pour une meilleure allure.",
  },
  {
    icon: Sparkles,
    title: "Confort quotidien",
    desc: "Des vêtements agréables à porter du matin jusqu’au soir.",
  },
  {
    icon: BadgeCheck,
    title: "Sélection tendance",
    desc: "Une collection inspirée des styles actuels et intemporels.",
  },
  {
    icon: HeartHandshake,
    title: "Expérience fiable",
    desc: "Commande simple, suivi clair et service client réactif.",
  },
];

export default function BrandValues() {
  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 bg-[#1a1713] min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-[10px] uppercase tracking-[0.45em] text-white/30 font-medium block mb-3">
            Notre univers
          </span>

          <h2
            className="text-white/85 leading-tight"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(1.6rem, 4vw, 2.6rem)",
              fontWeight: 400,
              fontStyle: "italic",
            }}
          >
            L’équilibre entre élégance et décontraction
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-white/5">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group flex flex-col items-center text-center px-6 py-8 sm:px-8 sm:py-10 bg-[#1a1713] hover:bg-white/3 transition-colors duration-300"
            >
              <div className="mb-4 w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/25 transition-colors duration-300">
                <Icon
                  size={17}
                  strokeWidth={1.4}
                  className="text-white/50 group-hover:text-white/75 transition-colors duration-300"
                />
              </div>

              <h3 className="text-white/80 text-[11px] uppercase tracking-[0.2em] font-semibold mb-2">
                {title}
              </h3>

              <p className="text-white/30 text-[12px] leading-relaxed font-light">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}