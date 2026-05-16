"use client";

import { useEffect } from "react";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[9px] uppercase tracking-[0.5em] text-black/30 font-serif mb-6">Erreur serveur</p>
      <h1 className="font-serif italic font-light text-[clamp(3rem,10vw,7rem)] leading-none text-black mb-4">
        Quelque chose s'est mal passé
      </h1>
      <p className="font-serif text-black/60 text-sm max-w-xs leading-relaxed mb-10">
        Une erreur inattendue s'est produite. Veuillez réessayer ou revenir à l'accueil.
      </p>
      <div className="flex items-center gap-4">
        <button
        type="button"
          onClick={reset}
          className="px-8 py-3 bg-black text-white text-[9px] uppercase tracking-[0.3em] font-serif hover:bg-black/80 transition-colors"
        >
          Réessayer
        </button>
        <a
          href="/"
          className="px-8 py-3 border border-black text-black text-[9px] uppercase tracking-[0.3em] font-serif hover:bg-black hover:text-white transition-colors"
        >
          Accueil
        </a>
      </div>
    </main>
  );
}
