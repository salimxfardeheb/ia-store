"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, ChevronDown, Trash2, CheckCircle, Tag, X, Loader2, Star, Sparkles } from "lucide-react";
import AdminHeader from "../components/AdminHeader";
import ProductModel from "../components/ProductModel";
import ProductTable from "../components/ProductTable";
import ProductGrid from "../components/ProductGrid";
import { Product, STATUSES } from "@/app/variables";
import { addProduct, updateProduct, getAllProducts, getCategories, deleteProduct } from "@/services/admin";
import { useAuth } from "@/app/context/AuthContext";

// ─── Helper ───────────────────────────────────────────────────────────────────
function promoPrice(price: number, pct: number) {
  return Math.round(price * (1 - pct / 100));
}

// ─── Modal Promotion ──────────────────────────────────────────────────────────
function PromoModal({
  products,
  onClose,
  onSaved,
}: {
  products: Product[];
  onClose: () => void;
  onSaved: (updated: Product) => void;
}) {
  const [search,    setSearch]    = useState("");
  const [selected,  setSelected]  = useState<Product | null>(null);
  const [percent,   setPercent]   = useState<number>(10);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const active = products.filter((p) => p.status === "Actif");
  const filtered = active.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            selected.name,
          category:        selected.category,
          price:           selected.price,
          discountPercent: percent,
          stock:           selected.stock,
          status:          selected.status,
          mainImage:       selected.mainImage,
          extraImages:     (selected.extraImages ?? []).map((img) => ({ url: img.url, color: img.color })),
          sizes:           selected.sizes,
          variants:        selected.variants ?? [],
        }),
      });
      if (!res.ok) throw new Error("Échec de la mise à jour");
      const updated: Product = await res.json();
      onSaved(updated);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            selected.name,
          category:        selected.category,
          price:           selected.price,
          discountPercent: null,
          stock:           selected.stock,
          status:          selected.status,
          mainImage:       selected.mainImage,
          extraImages:     (selected.extraImages ?? []).map((img) => ({ url: img.url, color: img.color })),
          sizes:           selected.sizes,
          variants:        selected.variants ?? [],
        }),
      });
      if (!res.ok) throw new Error("Échec de la suppression de promo");
      const updated: Product = await res.json();
      onSaved(updated);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
          <div className="flex items-center gap-2.5">
            <Tag size={15} strokeWidth={1.5} />
            <h2 className="text-sm font-semibold uppercase tracking-widest font-serif">Gérer les promotions</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Liste produits */}
          <div className="w-80 border-r border-black/8 flex flex-col shrink-0">
            <div className="p-3 border-b border-black/8">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/30" strokeWidth={1.5} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher…"
                  className="w-full border border-black/10 pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-black/30 font-serif"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-black/5">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setPercent(p.discountPercent ?? 10); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/3 ${selected?.id === p.id ? "bg-black/5" : ""}`}
                >
                  {p.mainImage
                    ? <img src={p.mainImage} alt={p.name} className="w-9 h-11 object-cover shrink-0 border border-black/8" />
                    : <div className="w-9 h-11 bg-black/5 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate font-serif">{p.name}</p>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider font-serif">{p.category}</p>
                    <p className="text-[10px] text-black/60 font-serif mt-0.5">{p.price.toLocaleString("fr-FR")} DA</p>
                  </div>
                  {p.discountPercent && (
                    <span className="shrink-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      -{p.discountPercent}%
                    </span>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-black/25 text-xs py-8 font-serif italic">Aucun produit actif</p>
              )}
            </div>
          </div>

          {/* Panneau de configuration */}
          <div className="flex-1 flex flex-col justify-between p-6">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-black/25 text-sm font-serif italic">Sélectionnez un produit</p>
              </div>
            ) : (
              <div className="space-y-6">

                {/* Produit sélectionné */}
                <div className="flex items-center gap-4 p-4 bg-black/2 border border-black/8">
                  {selected.mainImage
                    ? <img src={selected.mainImage} alt={selected.name} className="w-14 h-18 object-cover border border-black/8" />
                    : <div className="w-14 h-18 bg-black/5" />
                  }
                  <div>
                    <p className="font-semibold text-sm font-serif">{selected.name}</p>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider font-serif">{selected.category}</p>
                    <p className="text-sm font-serif mt-1 text-black/70">{selected.price.toLocaleString("fr-FR")} DA</p>
                    {selected.discountPercent && (
                      <p className="text-[10px] text-red-500 font-serif mt-0.5">
                        Promo actuelle : -{selected.discountPercent}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Slider % */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] uppercase tracking-widest text-black/50 font-serif font-semibold">
                      Pourcentage de réduction
                    </label>
                    <span className="text-2xl font-bold font-serif text-red-500">-{percent}%</span>
                  </div>
                  <input
                    type="range"
                    min={1} max={90} step={1}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="w-full accent-black"
                  />
                  <div className="flex justify-between text-[9px] text-black/25 font-serif mt-1">
                    <span>1%</span><span>50%</span><span>90%</span>
                  </div>
                </div>

                {/* Aperçu prix */}
                <div className="bg-[#F7F7F7] border border-black/8 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-black/35 font-serif mb-1">Prix original</p>
                    <p className="text-base font-serif line-through text-black/40">
                      {selected.price.toLocaleString("fr-FR")} DA
                    </p>
                  </div>
                  <div className="text-2xl text-black/20 font-serif">→</div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-widest text-black/35 font-serif mb-1">Prix après promo</p>
                    <p className="text-xl font-bold font-serif text-red-500">
                      {promoPrice(selected.price, percent).toLocaleString("fr-FR")} DA
                    </p>
                    <p className="text-[9px] text-black/35 font-serif">
                      Économie : {(selected.price - promoPrice(selected.price, percent)).toLocaleString("fr-FR")} DA
                    </p>
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs font-serif">{error}</p>}
              </div>
            )}

            {/* Actions */}
            {selected && (
              <div className="flex items-center gap-3 pt-4 border-t border-black/8 mt-6">
                {selected.discountPercent && (
                  <button
                    onClick={handleRemove}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 text-[10px] uppercase tracking-widest font-serif hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={2} />}
                    Retirer la promo
                  </button>
                )}
                <button
                  onClick={handleApply}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2.5 text-[10px] uppercase tracking-widest font-serif hover:bg-black/80 transition-colors disabled:opacity-40"
                >
                  {saving && <Loader2 size={12} className="animate-spin" />}
                  Appliquer -{percent}%
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Best Seller ────────────────────────────────────────────────────────
function BestSellerModal({
  products,
  onClose,
  onSaved,
}: {
  products: Product[];
  onClose: () => void;
  onSaved: (updated: Product) => void;
}) {
  const [search,  setSearch]  = useState("");
  const [saving,  setSaving]  = useState<string | null>(null);
  const [error,   setError]   = useState("");

  const active   = products.filter((p) => p.status === "Actif");
  const filtered = active.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const isNew = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < SEVEN_DAYS;

  const toggle = async (product: Product) => {
    setSaving(product.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            product.name,
          category:        product.category,
          price:           product.price,
          discountPercent: product.discountPercent ?? null,
          isBestSeller:    !product.isBestSeller,
          stock:           product.stock,
          status:          product.status,
          mainImage:       product.mainImage,
          extraImages:     (product.extraImages ?? []).map((img) => ({ url: img.url, color: img.color })),
          sizes:           product.sizes,
          variants:        product.variants ?? [],
        }),
      });
      if (!res.ok) throw new Error("Échec");
      const updated: Product = await res.json();
      onSaved(updated);
    } catch {
      setError("Erreur lors de la mise à jour");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8">
          <div className="flex items-center gap-2.5">
            <Star size={15} strokeWidth={1.5} />
            <h2 className="text-sm font-semibold uppercase tracking-widest font-serif">Best Sellers & Nouveautés</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Info */}
        <div className="px-6 py-3 bg-[#F7F7F7] border-b border-black/6 flex flex-wrap gap-4 text-[10px] font-serif text-black/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1a1713] inline-block" />
            Best Seller — tag permanent (manuel)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b7355] inline-block" />
            Nouveau — automatique pendant 7 jours
          </span>
        </div>

        {/* Recherche */}
        <div className="px-4 py-3 border-b border-black/8">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/30" strokeWidth={1.5} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full border border-black/10 pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-black/30 font-serif"
            />
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto divide-y divide-black/5">
          {filtered.map((p) => {
            const newTag = isNew(p.createdAt);
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-black/2 transition-colors">
                {/* Image */}
                {p.mainImage
                  ? <img src={p.mainImage} alt={p.name} className="w-9 h-11 object-cover shrink-0 border border-black/8" />
                  : <div className="w-9 h-11 bg-black/5 shrink-0" />
                }

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate font-serif">{p.name}</p>
                  <p className="text-[10px] text-black/40 uppercase tracking-wider font-serif">{p.category}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {p.isBestSeller && (
                      <span className="bg-[#1a1713] text-white text-[8px] uppercase tracking-wider px-1.5 py-0.5 font-bold flex items-center gap-0.5">
                        <Star size={7} strokeWidth={2.5} fill="white" /> Best Seller
                      </span>
                    )}
                    {newTag && (
                      <span className="bg-[#8b7355] text-white text-[8px] uppercase tracking-wider px-1.5 py-0.5 font-bold flex items-center gap-0.5">
                        <Sparkles size={7} strokeWidth={2.5} /> Nouveau
                      </span>
                    )}
                  </div>
                </div>

                {/* Toggle Best Seller */}
                <button
                  onClick={() => toggle(p)}
                  disabled={saving === p.id}
                  className={`flex items-center gap-1.5 px-3 py-2 text-[9px] uppercase tracking-widest font-serif border transition-all disabled:opacity-40 shrink-0 ${
                    p.isBestSeller
                      ? "bg-[#1a1713] text-white border-[#1a1713] hover:bg-[#2e2a24]"
                      : "border-black/15 text-black/50 hover:border-black hover:text-black"
                  }`}
                >
                  {saving === p.id
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Star size={11} strokeWidth={p.isBestSeller ? 0 : 1.5} fill={p.isBestSeller ? "white" : "none"} />
                  }
                  {p.isBestSeller ? "Retirer" : "Best Seller"}
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-black/25 text-xs py-8 font-serif italic">Aucun produit actif</p>
          )}
        </div>

        {error && <p className="px-6 py-3 text-red-500 text-xs font-serif border-t border-red-100">{error}</p>}

        <div className="px-6 py-3 border-t border-black/8 text-[9px] text-black/30 font-serif">
          {active.filter((p) => p.isBestSeller).length} Best Seller{active.filter((p) => p.isBestSeller).length > 1 ? "s" : ""} actif{active.filter((p) => p.isBestSeller).length > 1 ? "s" : ""}
          {" · "}
          {active.filter((p) => isNew(p.createdAt)).length} Nouveau{active.filter((p) => isNew(p.createdAt)).length > 1 ? "x" : ""} (7 derniers jours)
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CatalogPage() {
  const { user } = useAuth();
  const readOnly = user?.role === "SELLER";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [sortKey, setSortKey] = useState<keyof Product>("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [categories, setCategories] = useState<string[]>([]);
  const [editProduct, setEditProduct] = useState<Product | null | undefined>(
    undefined,
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [promoOpen, setPromoOpen]       = useState(false);
  const [bestSellerOpen, setBestSellerOpen] = useState(false);
  const [view, setView] = useState<"table" | "grid">("table");
  const [toast, setToast] = useState<string | null>(null);

  // Auto-dismiss toast après 3 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);


  // Fetch products from Firestore on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
      setLoading(false);
    };

    fetchProducts();
  }, []);

    useEffect(() => {
    const getCategoriesProducts = async () => {
      setLoading(true);
      const data = await getCategories();
      setCategories(["Tous", ...data]);
      setLoading(false);
    };

    getCategoriesProducts();
  }, []);
  // Filter + sort
  const filtered = products
    .filter(
      (p) =>
        (categoryFilter === "Tous" || p.category === categoryFilter) &&
        (statusFilter === "Tous" || p.status === statusFilter) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.id.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      const av = a[sortKey],
        bv = b[sortKey];
      const cmp = String(av).localeCompare(String(bv), undefined, {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });

  const handleSort = (key: keyof Product) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Les erreurs NE sont PAS capturées ici — elles remontent à ProductModel
  // qui les affiche dans la modale (modale reste ouverte en cas d'erreur).
  const handleSave = async (product: Product) => {
    if (readOnly) return;
    const isNew = !products.find((p) => p.id === product.id);
    if (isNew) {
      const created = await addProduct(product);
      setProducts((prev) => [...prev, created]);
      setToast("Produit créé avec succès");
    } else {
      const updated = await updateProduct(product, product.id);
      setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
      setToast("Modifications enregistrées");
    }
    setEditProduct(undefined);
  };

  const handleDelete = async (id: string) => {
    if (readOnly) return;
    await deleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setDeleteId(null);
  };

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === "Actif").length,
    outStock: products.filter((p) => p.stock === 0).length,
    draft: products.filter((p) => p.status === "Brouillon").length,
  };

  return (
    <>
      <AdminHeader title="Catalogue" subtitle="Gestion des produits" />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total produits", value: stats.total },
          { label: "Actifs", value: stats.active },
          { label: "Hors stock", value: stats.outStock },
          { label: "Brouillons", value: stats.draft },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border px-5 py-4 border-[rgba(0,0,0,0.08)]"
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 mb-2 font-serif">
              {label}
            </p>
            <p className="text-2xl text-black font-serif font-light italic">
              {loading ? "—" : value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white border mb-4 border-[rgba(0,0,0,0.08)]">
        <div className="flex flex-wrap items-center gap-3 p-4">
          {/* Search */}
          <div className="relative flex-1 min-w-50">
            <Search
              size={13}
              strokeWidth={1.5}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full border bg-[#F7F7F7] text-[11px] py-2.5 pl-9 pr-4 focus:outline-none focus:border-black/30 transition-colors font-serif border-[rgba(0,0,0,0.08)]"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border bg-white text-[10px] uppercase tracking-widest py-2.5 pl-3 pr-8 focus:outline-none appearance-none hover:border-black/25 transition-colors font-serif border-[rgba(0,0,0,0.08)]"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <ChevronDown
              size={10}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-black/30"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border bg-white text-[10px] uppercase tracking-widest py-2.5 pl-3 pr-8 focus:outline-none appearance-none hover:border-black/25 transition-colors font-serif border-[rgba(0,0,0,0.08)]"
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <ChevronDown
              size={10}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-black/30"
            />
          </div>

          {/* View toggle */}
          <div className="flex border border-[rgba(0,0,0,0.08)]">
            {(["table", "grid"] as const).map((v) => (
              <button
                type="button"
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-2.5 text-[8px] uppercase tracking-widest transition-colors font-serif ${
                  view === v
                    ? "bg-black text-white"
                    : "text-black/35 hover:bg-black/4"
                }`}
              >
                {v === "table" ? "Liste" : "Grille"}
              </button>
            ))}
          </div>

          {/* Best Sellers — ADMIN only */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setBestSellerOpen(true)}
              className="flex items-center gap-2 border border-black/15 px-4 py-2.5 text-[9px] uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all font-serif ml-auto"
            >
              <Star size={12} strokeWidth={1.5} />
              <span>Best Sellers</span>
            </button>
          )}

          {/* Promotions — ADMIN only */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setPromoOpen(true)}
              className="flex items-center gap-2 border border-black/15 px-4 py-2.5 text-[9px] uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all font-serif"
            >
              <Tag size={12} strokeWidth={1.5} />
              <span>Promotions</span>
            </button>
          )}

          {/* Add — ADMIN only */}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setEditProduct(null)}
              className="flex items-center space-x-2 bg-black text-white px-5 py-2.5 text-[9px] uppercase tracking-widest hover:bg-black/80 transition-colors font-serif"
            >
              <Plus size={13} strokeWidth={1.5} />
              <span>Nouveau produit</span>
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="px-4 py-2 border-t border-[rgba(0,0,0,0.08)]">
          <p className="text-[8px] uppercase tracking-[0.3em] text-black/30 font-serif">
            {loading
              ? "Chargement..."
              : `${filtered.length} produit${filtered.length !== 1 ? "s" : ""}${search ? ` · "${search}"` : ""}`}
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="bg-white border border-[rgba(0,0,0,0.08)] flex items-center justify-center py-24">
          <p className="text-[9px] uppercase tracking-[0.3em] text-black/25 font-serif animate-pulse">
            Chargement des produits…
          </p>
        </div>
      ) : (
        /* Table / Grid views */
        <AnimatePresence mode="wait">
          {view === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProductTable
                filtered={filtered}
                sortKey={sortKey}
                sortDir={sortDir}
                handleSort={handleSort}
                setEditProduct={setEditProduct}
                setDeleteId={setDeleteId}
                readOnly={readOnly}
              />
            </motion.div>
          )}

          {view === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProductGrid
                filtered={filtered}
                setEditProduct={setEditProduct}
                setDeleteId={setDeleteId}
                readOnly={readOnly}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white w-full max-w-sm mx-4 p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-3 mb-5">
                <Trash2 size={16} strokeWidth={1.5} className="text-black" />
                <h3 className="text-lg text-black font-serif italic font-light">
                  Supprimer le produit ?
                </h3>
              </div>
              <p className="text-[11px] text-black/60 mb-7 leading-relaxed font-serif">
                Cette action est irréversible. Le produit{" "}
                <strong className="text-black">{deleteId}</strong> sera
                définitivement supprimé du catalogue.
              </p>
              <div className="flex space-x-3">
                <button
                type="button"
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 border text-[9px] uppercase tracking-widest text-black/50 hover:text-black transition-colors border-[rgba(0,0,0,0.08)] font-serif"
                >
                  Annuler
                </button>
                <button
                type="button"
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 bg-black text-white text-[9px] uppercase tracking-widest hover:bg-black/80 transition-colors font-serif"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Best Seller modal */}
      <AnimatePresence>
        {bestSellerOpen && (
          <motion.div key="bestseller-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BestSellerModal
              products={products}
              onClose={() => setBestSellerOpen(false)}
              onSaved={(updated) => {
                setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                setToast(updated.isBestSeller ? "Marqué Best Seller" : "Tag Best Seller retiré");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promo modal */}
      <AnimatePresence>
        {promoOpen && (
          <motion.div
            key="promo-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <PromoModal
              products={products}
              onClose={() => setPromoOpen(false)}
              onSaved={(updated) => {
                setProducts((prev) =>
                  prev.map((p) => (p.id === updated.id ? updated : p))
                );
                setToast("Promotion appliquée");
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit modal */}
      <AnimatePresence>
        {editProduct !== undefined && (
          <ProductModel
            product={editProduct}
            onClose={() => setEditProduct(undefined)}
            onSave={handleSave}
            categories={categories}
            onAddCategory={(newCat) => setCategories([...categories, newCat])}
          />
        )}
      </AnimatePresence>

      {/* Toast succès */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 flex items-center gap-2.5 bg-black text-white px-5 py-3 text-[9px] uppercase tracking-widest font-serif shadow-xl"
          >
            <CheckCircle size={13} strokeWidth={1.5} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
