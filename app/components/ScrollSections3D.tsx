"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  index: number;
  total: number;
}

function StackCard({ children, index, total }: CardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isLast = index === total - 1;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale   = useTransform(scrollYProgress, [0, 1], isLast ? [1, 1]       : [1, 0.84]);
  const z       = useTransform(scrollYProgress, [0, 1], isLast ? [0, 0]       : [0, -150]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], isLast ? [1, 1, 1] : [1, 0.5, 0]);
  const radius  = useTransform(scrollYProgress, [0, 0.15], isLast ? ["0px", "0px"] : ["0px", "18px"]);
  const filter  = useTransform(scrollYProgress, [0, 1], isLast ? ["blur(0px)", "blur(0px)"] : ["blur(0px)", "blur(3px)"]);

  return (
    // 200vh = 100vh sticky visible + 100vh de scroll pour l'animation de sortie
    <div ref={ref} style={{ height: isLast ? "auto" : "200vh" }}>
      <div
        style={{
          position: isLast ? "relative" : "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <motion.div
          style={{
            scale,
            z,
            opacity,
            borderRadius: radius,
            filter,
            transformOrigin: "50% 0%",
            transformStyle: "preserve-3d",
            willChange: "transform, opacity, filter",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* scroll interne pour contenu qui dépasse 100vh */}
          <div style={{ height: "100%", overflowY: "auto" }}>
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function ScrollSections3D({ sections }: { sections: React.ReactNode[] }) {
  return (
    <div style={{ perspective: "1200px", perspectiveOrigin: "50% -20%" }}>
      {sections.map((section, i) => (
        <StackCard key={i} index={i} total={sections.length}>
          {section}
        </StackCard>
      ))}
    </div>
  );
}
