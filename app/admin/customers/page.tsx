"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Users, Phone, Mail, ShoppingBag, Globe, Store, ChevronLeft, ChevronRight } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { getCustomers } from "@/services/admin";
import { type UnifiedCustomer } from "@/app/variables";
import { formatDate } from "@/app/variables";

const PAGE_SIZE = 50;

// ─── Channel badge ────────────────────────────────────────────────────────────

function ChannelBadge({ channel }: { channel: "online" | "offline" }) {
  if (channel === "online") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] uppercase tracking-widest font-serif bg-black text-white">
        <Globe size={11} strokeWidth={1.5} />
        En ligne
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[12px] uppercase tracking-widest font-serif bg-black/8 text-black">
      <Store size={11} strokeWidth={1.5} />
      Magasin
    </span>
  );
}

// ─── Customer Row ─────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: UnifiedCustomer }) {
  const initials = customer.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-12 items-center px-5 py-4 bg-white border border-[rgba(0,0,0,0.06)] hover:border-black/20 transition-colors"
    >
      {/* Avatar + name */}
      <div className="col-span-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[10px] font-serif shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-serif font-medium truncate">{customer.name}</p>
        </div>
      </div>

      {/* Contact */}
      <div className="col-span-3 space-y-0.5">
        {customer.phone && (
          <div className="flex items-center gap-1.5 text-[13px] font-serif text-black/60">
            <Phone size={12} strokeWidth={1.5} className="text-black/25 shrink-0" />
            {customer.phone}
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-1.5 text-[13px] font-serif text-black/60 truncate">
            <Mail size={10} strokeWidth={1.5} className="text-black/25 shrink-0" />
            <span className="truncate">{customer.email}</span>
          </div>
        )}
      </div>

      {/* Channel */}
      <div className="col-span-2">
        <ChannelBadge channel={customer.channel} />
      </div>

      {/* Orders */}
      <div className="col-span-2 flex items-center gap-1.5 text-[13px] font-serif text-black/50">
        <ShoppingBag size={13} strokeWidth={1.5} className="text-black/25" />
        {customer.ordersCount}
        <span className="text-black/25 text-[12px]">
          {customer.ordersCount !== 1 ? "commandes" : "commande"}
        </span>
      </div>

      {/* Last order */}
      <div className="col-span-2 text-right text-[13px] text-black/30 font-serif">
        {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : "—"}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<"all" | "online" | "offline">("all");
  const [page, setPage]           = useState(1);

  // Debounce search to avoid hammering the server while typing
  useEffect(() => {
    const t = setTimeout(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        const data = await getCustomers({
          q:       search,
          channel: filter,
          page,
          limit:   PAGE_SIZE,
        });
        if (cancelled) return;
        setCustomers(data.items);
        setTotal(data.total);
        setLoading(false);
      })();
      return () => { cancelled = true; };
    }, 250);
    return () => clearTimeout(t);
  }, [search, filter, page]);

  // Reset to page 1 when search/filter changes
  useEffect(() => { setPage(1); }, [search, filter]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminHeader title="Clients" subtitle="Vue unifiée" />

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-8">
        {[
          { label: "Tous",      key: "all"     as const },
          { label: "En ligne",  key: "online"  as const },
          { label: "Magasin",   key: "offline" as const },
        ].map(({ label, key }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
              filter === key
                ? "border-black text-black"
                : "border-transparent text-black/30 hover:text-black/60"
            }`}
          >
            <span className="text-[13px] uppercase tracking-[0.2em] font-serif">{label}</span>
          </button>
        ))}
        <span className="ml-auto text-[13px] uppercase tracking-widest text-black/30 font-serif">
          {total} {total > 1 ? "résultats" : "résultat"}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search
          size={13}
          strokeWidth={1.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone, email..."
          className="w-full border border-[rgba(0,0,0,0.08)] bg-white text-[14px] py-3 pl-9 pr-4 font-serif focus:outline-none focus:border-black/30 transition-colors"
        />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 px-5 py-2 mb-2">
        {[
          { label: "Client",    span: "col-span-3" },
          { label: "Contact",   span: "col-span-3" },
          { label: "Canal",     span: "col-span-2" },
          { label: "Commandes", span: "col-span-2" },
          { label: "Dernière commande", span: "col-span-2 text-right" },
        ].map(({ label, span }) => (
          <div key={label} className={`${span} text-[13px] uppercase tracking-[0.2em] text-black/25 font-serif`}>
            {label}
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-24">
          <p className="font-serif italic text-black/20">Chargement...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-black/10">
          <Users size={32} strokeWidth={0.75} className="text-black/10 mx-auto mb-4" />
          <p className="font-serif italic text-black/20">
            {search ? "Aucun client trouvé" : "Aucun client enregistré"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            <AnimatePresence>
              {customers.map((c) => (
                <CustomerRow key={c.id} customer={c} />
              ))}
            </AnimatePresence>
          </div>

          {/* Pager */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-[13px] uppercase tracking-widest font-serif text-black/60 disabled:opacity-20 disabled:cursor-not-allowed hover:text-black transition-colors"
              >
                <ChevronLeft size={15} strokeWidth={1.5} />
                Précédent
              </button>
              <span className="text-[13px] uppercase tracking-widest font-serif text-black/60">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 text-[13px] uppercase tracking-widest font-serif text-black/60 disabled:opacity-20 disabled:cursor-not-allowed hover:text-black transition-colors"
              >
                Suivant
                <ChevronRight size={15} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
