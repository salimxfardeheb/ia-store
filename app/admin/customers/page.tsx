"use client";

import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, Users, Phone, Mail, MapPin, X, ShoppingBag, AlertCircle } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import { Customer } from "@/app/variables";
import { getCustomers, createCustomer } from "@/services/admin";
import { useAuth } from "@/app/context/AuthContext";
import { formatDate } from "@/app/variables";

// ─── Create Customer Modal ────────────────────────────────────────────────────

interface ModalProps {
  onClose: () => void;
  onCreated: (c: Customer) => void;
  token: string;
}

function CreateCustomerModal({ onClose, onCreated, token }: ModalProps) {
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => { phoneRef.current?.focus(); }, []);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Le nom est requis"); return; }
    if (!form.phone.trim()) { setError("Le téléphone est requis"); return; }

    setSaving(true);
    try {
      const customer = await createCustomer(token, {
        name:    form.name.trim(),
        phone:   form.phone.trim(),
        email:   form.email.trim()   || undefined,
        address: form.address.trim() || undefined,
      });
      onCreated(customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(0,0,0,0.08)]">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-black/30 font-serif mb-1">
              Nouveau client
            </p>
            <h2 className="text-xl font-serif italic">Créer un client</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-black/30 hover:text-black hover:bg-black/5 transition-colors"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-[11px] px-3 py-2.5">
              <AlertCircle size={13} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Nom complet <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="Prénom Nom"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Téléphone <span className="text-red-400">*</span>
            </label>
            <input
              ref={phoneRef}
              value={form.phone}
              onChange={set("phone")}
              placeholder="0XX XXX XXXX"
              type="tel"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Email <span className="text-black/25">(optionnel)</span>
            </label>
            <input
              value={form.email}
              onChange={set("email")}
              placeholder="email@exemple.com"
              type="email"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-[9px] uppercase tracking-widest text-black/40 font-serif mb-1.5">
              Adresse <span className="text-black/25">(optionnel)</span>
            </label>
            <input
              value={form.address}
              onChange={set("address")}
              placeholder="Rue, Quartier, Ville"
              className="w-full border border-[rgba(0,0,0,0.12)] text-[12px] py-2.5 px-3 font-serif focus:outline-none focus:border-black transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-[rgba(0,0,0,0.12)] text-[10px] uppercase tracking-widest py-2.5 font-serif hover:bg-black/4 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-black text-white text-[10px] uppercase tracking-widest py-2.5 font-serif hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Créer le client"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Customer Row ─────────────────────────────────────────────────────────────

function CustomerRow({ customer }: { customer: Customer }) {
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
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-[10px] font-serif shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-serif font-medium truncate">{customer.name}</p>
          <p className="text-[10px] text-black/30 uppercase tracking-widest font-serif">
            Magasin
          </p>
        </div>
      </div>

      {/* Phone */}
      <div className="col-span-3 flex items-center gap-2 text-[11px] font-serif text-black/60">
        <Phone size={11} strokeWidth={1.5} className="text-black/25 shrink-0" />
        {customer.phone}
      </div>

      {/* Email */}
      <div className="col-span-3 flex items-center gap-2 text-[11px] font-serif text-black/50 truncate">
        {customer.email ? (
          <>
            <Mail size={11} strokeWidth={1.5} className="text-black/25 shrink-0" />
            <span className="truncate">{customer.email}</span>
          </>
        ) : (
          <span className="text-black/20 italic">—</span>
        )}
      </div>

      {/* Orders count */}
      <div className="col-span-1 flex items-center gap-1.5 text-[11px] font-serif text-black/50">
        <ShoppingBag size={11} strokeWidth={1.5} className="text-black/25" />
        {customer._count?.orders ?? 0}
      </div>

      {/* Date */}
      <div className="col-span-1 text-right text-[10px] text-black/30 font-serif">
        {formatDate(customer.createdAt)}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { getToken } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showModal, setShowModal] = useState(false);

  const token = getToken() ?? "";

  const load = async (q = "") => {
    setLoading(true);
    const data = await getCustomers(token, q);
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side filter for instant feedback while typing
  const filtered = customers.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q)  ||
      c.phone.includes(q)               ||
      (c.email ?? "").toLowerCase().includes(q)
    );
  });

  const handleCreated = (c: Customer) => {
    setCustomers((prev) => [c, ...prev]);
    setShowModal(false);
  };

  return (
    <div>
      <AdminHeader title="Clients" subtitle="Gestion" />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6 gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            size={13}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-black/25"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, email..."
            className="w-full border border-[rgba(0,0,0,0.08)] bg-white text-[11px] py-2.5 pl-9 pr-4 font-serif focus:outline-none focus:border-black/30 transition-colors"
          />
        </div>

        {/* Stats + action */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-widest text-black/30 font-serif">
            {customers.length} client{customers.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-black text-white text-[10px] uppercase tracking-widest px-4 py-2.5 font-serif hover:bg-black/80 transition-colors"
          >
            <Plus size={13} strokeWidth={1.5} />
            Nouveau client
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-12 px-5 py-2 mb-2">
        {[
          { label: "Client",     span: "col-span-4" },
          { label: "Téléphone",  span: "col-span-3" },
          { label: "Email",      span: "col-span-3" },
          { label: "Commandes",  span: "col-span-1" },
          { label: "Depuis",     span: "col-span-1 text-right" },
        ].map(({ label, span }) => (
          <div
            key={label}
            className={`${span} text-[9px] uppercase tracking-[0.3em] text-black/25 font-serif`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-24">
          <p className="font-serif italic text-black/20">Chargement...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-black/10">
          <Users size={32} strokeWidth={0.75} className="text-black/10 mx-auto mb-4" />
          <p className="font-serif italic text-black/20">
            {search ? "Aucun client trouvé" : "Aucun client enregistré"}
          </p>
          {!search && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-[10px] uppercase tracking-widest font-serif border-b border-black/20 hover:border-black transition-colors"
            >
              Créer le premier client
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filtered.map((c) => (
              <CustomerRow key={c.id} customer={c} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <CreateCustomerModal
            token={token}
            onClose={() => setShowModal(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
