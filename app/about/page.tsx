"use client"
import { motion } from 'framer-motion';

export default function About() {
  return (
    <div className="pt-32 pb-24">
      {/* Hero */}
      <section className="px-6 max-w-7xl mx-auto mb-32">
        <div className="max-w-3xl">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-black/60 text-[11px] uppercase tracking-[0.4em] font-medium mb-6 block"
          >
            Since 2024
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-7xl md:text-8xl italic leading-tight mb-12"
          >
            A legacy of <br />
            <span className="not-italic font-bold">Modernity.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-black/60 font-light leading-relaxed"
          >
            I.A was founded on a simple premise: that men's clothing should be as enduring as it is elegant. We believe in the power of a well-tailored suit, the comfort of pure cashmere, and the confidence that comes from wearing something truly exceptional.
          </motion.p>
        </div>
      </section>

      {/* Image Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-32">
        <div className="aspect-4/5 overflow-hidden rounded-3xl">
          <img src="https://images.unsplash.com/photo-1594932224828-b4b05a832fe3?auto=format&fit=crop&q=80&w=1000" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="aspect-4/5 overflow-hidden rounded-3xl md:mt-24">
          <img src="https://images.unsplash.com/photo-1550246140-5119ae4790b8?auto=format&fit=crop&q=80&w=1000" alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      </section>

      {/* Values */}
      <section className="px-6 max-w-7xl mx-auto mb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-20">01</span>
            <h3 className="font-serif text-3xl italic">Ethical Sourcing</h3>
            <p className="text-black/60 font-light leading-relaxed">We partner exclusively with mills that share our commitment to environmental stewardship and fair labor practices.</p>
          </div>
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-20">02</span>
            <h3 className="font-serif text-3xl italic">Timeless Design</h3>
            <p className="text-black/60 font-light leading-relaxed">Our aesthetic avoids fleeting trends in favor of silhouettes that remain relevant for decades, not just seasons.</p>
          </div>
          <div className="space-y-6">
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-20">03</span>
            <h3 className="font-serif text-3xl italic">Personal Service</h3>
            <p className="text-black/60 font-light leading-relaxed">From made-to-measure tailoring to personal styling, we provide a bespoke experience for every client.</p>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="bg-black text-white py-32 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h2 className="font-serif text-5xl italic">Visit our Atelier</h2>
          <p className="text-white/60 font-light">Experience the collection in person at our flagship store in the heart of Paris.</p>
          <div className="pt-8">
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold mb-2">24 Rue du Faubourg Saint-Honoré</p>
            <p className="text-[11px] uppercase tracking-[0.3em] font-bold opacity-40">75008 Paris, France</p>
          </div>
        </div>
      </section>
    </div>
  );
}
