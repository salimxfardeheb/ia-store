import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80&w=2000" 
          alt="Hero Background"
          className="w-full h-full object-cover grayscale-[0.2]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-white/80 text-[11px] uppercase tracking-[0.4em] font-medium mb-6 block">
              Spring / Summer 2026
            </span>
            <h1 className="text-white font-serif text-7xl md:text-8xl leading-[0.9] mb-8 tracking-tight italic">
              Refined <br />
              <span className="not-italic font-bold">Simplicity.</span>
            </h1>
            <p className="text-white/70 text-lg mb-10 max-w-md font-light leading-relaxed">
              Discover our latest collection of meticulously crafted essentials designed for the modern man.
            </p>
            
            <div className="flex items-center space-x-6">
              <button className="bg-white text-black px-10 py-4 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-black hover:text-white transition-all duration-500 luxury-shadow">
                Shop Collection
              </button>
              <button className="text-white flex items-center space-x-2 text-[11px] uppercase tracking-[0.2em] font-bold group">
                <span>Lookbook</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 left-6 hidden lg:block">
        <div className="flex items-center space-x-4 text-white/40 text-[10px] uppercase tracking-[0.3em]">
          <span>01</span>
          <div className="w-12 h-px bg-white/20"></div>
          <span>Excellence in Tailoring</span>
        </div>
      </div>
    </section>
  );
}
