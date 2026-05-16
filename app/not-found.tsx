import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[9px] uppercase tracking-[0.5em] text-black/30 font-serif mb-6">Erreur 404</p>
      <h1 className="font-serif italic font-light text-[clamp(3rem,10vw,7rem)] leading-none text-black mb-4">
        Page introuvable
      </h1>
      <p className="font-serif text-black/60 text-sm max-w-xs leading-relaxed mb-10">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-black text-white text-[9px] uppercase tracking-[0.3em] font-serif hover:bg-black/80 transition-colors"
      >
        Retour à l'accueil
      </Link>
    </main>
  );
}
