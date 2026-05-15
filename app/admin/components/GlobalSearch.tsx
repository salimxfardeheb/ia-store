"use client";

import { Search, Package, ShoppingBag, Users, X } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResults {
  products:  Array<{ id: string; name: string; category: string; mainImage: string; status: string }>;
  orders:    Array<{ id: string; shortId: string; name: string; total: number; status: string }>;
  customers: Array<{ id: string; name: string; email: string | null; phone: string | null }>;
}

export default function GlobalSearch() {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen,    setIsOpen]    = useState(false);

  const inputRef     = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router       = useRouter();

  // Global "/" shortcut → focus search
  const handleGlobalKey = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "/") {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  // Click outside → close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced fetch (300ms, min 2 chars)
  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      setIsOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data: SearchResults = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const clear = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
  };

  const navigate = (href: string) => {
    clear();
    router.push(href);
  };

  const hasResults = results && (
    results.products.length > 0 ||
    results.orders.length > 0 ||
    results.customers.length > 0
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20 pointer-events-none"
        size={13}
        strokeWidth={1.5}
      />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (results && query.length >= 2) setIsOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "Escape") { clear(); inputRef.current?.blur(); }
        }}
        placeholder="Rechercher…"
        aria-label="Rechercher"
        className="border bg-white text-[11px] focus:outline-none focus:border-black/30 w-52 py-2.5 pl-9 pr-8 transition-colors border-[rgba(0,0,0,0.08)] font-serif text-[#0A0A0A] placeholder:text-black/25"
      />
      {query ? (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-black/25 hover:text-black/60 transition-colors"
          aria-label="Effacer"
        >
          <X size={10} />
        </button>
      ) : (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-black/20 font-mono pointer-events-none select-none">
          /
        </span>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-1 left-0 w-80 bg-white border border-[rgba(0,0,0,0.08)] shadow-sm z-50">

          {isLoading && (
            <p className="px-4 py-3 text-[10px] text-black/30 font-serif">Recherche…</p>
          )}

          {!isLoading && !hasResults && (
            <p className="px-4 py-3 text-[10px] text-black/30 font-serif">
              Aucun résultat pour «&nbsp;{query}&nbsp;»
            </p>
          )}

          {!isLoading && hasResults && (
            <>
              {/* Produits */}
              {results!.products.length > 0 && (
                <section>
                  <header className="flex items-center space-x-2 px-4 py-2 border-b border-[rgba(0,0,0,0.05)]">
                    <Package size={10} strokeWidth={1.5} className="text-black/30" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-black/30 font-serif">Produits</span>
                  </header>
                  {results!.products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate("/admin/catalog")}
                      className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
                    >
                      {p.mainImage ? (
                        <img
                          src={p.mainImage}
                          alt=""
                          className="w-7 h-7 object-cover shrink-0 bg-black/5"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div className="w-7 h-7 shrink-0 bg-black/5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-serif text-black truncate">{p.name}</p>
                        <p className="text-[9px] text-black/30 font-serif">{p.category}</p>
                      </div>
                    </button>
                  ))}
                </section>
              )}

              {/* Commandes */}
              {results!.orders.length > 0 && (
                <section className={results!.products.length > 0 ? "border-t border-[rgba(0,0,0,0.05)]" : ""}>
                  <header className="flex items-center space-x-2 px-4 py-2 border-b border-[rgba(0,0,0,0.05)]">
                    <ShoppingBag size={10} strokeWidth={1.5} className="text-black/30" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-black/30 font-serif">Commandes</span>
                  </header>
                  {results!.orders.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => navigate("/admin/orders")}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-serif text-black truncate">{o.name}</p>
                        <p className="text-[9px] text-black/30 font-serif">{o.shortId} · {o.status}</p>
                      </div>
                      <span className="text-[9px] font-serif text-black/40 shrink-0 ml-3">
                        {o.total.toLocaleString("fr-FR")} DA
                      </span>
                    </button>
                  ))}
                </section>
              )}

              {/* Clients */}
              {results!.customers.length > 0 && (
                <section className={(results!.products.length > 0 || results!.orders.length > 0) ? "border-t border-[rgba(0,0,0,0.05)]" : ""}>
                  <header className="flex items-center space-x-2 px-4 py-2 border-b border-[rgba(0,0,0,0.05)]">
                    <Users size={10} strokeWidth={1.5} className="text-black/30" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-black/30 font-serif">Clients</span>
                  </header>
                  {results!.customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate("/admin/customers")}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-black/5 transition-colors text-left"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-serif text-black truncate">{c.name}</p>
                        <p className="text-[9px] text-black/30 font-serif">
                          {c.email ?? c.phone ?? "—"}
                        </p>
                      </div>
                    </button>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
