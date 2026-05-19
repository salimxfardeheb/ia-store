"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, GripVertical,
  X, Upload, Search, ChevronDown, ImageIcon, Loader2,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LookProduct {
  id: number;
  productId: string;
  sortOrder: number;
  product: {
    id: string;
    name: string;
    mainImage: string;
    category: string;
    price: number;
  };
}

interface Look {
  id: string;
  title: string;
  tag: string;
  description: string;
  imageUrl: string;
  accent: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  products: LookProduct[];
}

interface ProductOption {
  id: string;
  name: string;
  mainImage: string;
  category: string;
  price: number;
}

// ─── Formulaire modal ─────────────────────────────────────────────────────────

const ACCENT_PRESETS = [
  { label: "Brun",   value: "#1a1713" },
  { label: "Marine", value: "#1a3a5c" },
  { label: "Kaki",   value: "#3a3a1a" },
  { label: "Bordeaux", value: "#5c1a1a" },
  { label: "Or",     value: "#8b7355" },
];

function LookForm({
  initial,
  onSave,
  onClose,
}: {
  initial?: Look;
  onSave: (data: FormPayload) => Promise<void>;
  onClose: () => void;
}) {
  const [title,       setTitle]       = useState(initial?.title       ?? "");
  const [tag,         setTag]         = useState(initial?.tag         ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl,    setImageUrl]    = useState(initial?.imageUrl    ?? "");
  const [accent,      setAccent]      = useState(initial?.accent      ?? "#1a1713");
  const [active,      setActive]      = useState(initial?.active      ?? true);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.products.map((p) => p.product.id) ?? []
  );
  const [products,    setProducts]    = useState<ProductOption[]>([]);
  const [search,      setSearch]      = useState("");
  const [uploading,   setUploading]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : (data.products ?? [])));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const toggleProduct = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleUpload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (json.url) setImageUrl(json.url);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim())    return setError("Le titre est requis.");
    if (!imageUrl.trim()) return setError("L'image est requise.");
    setSaving(true);
    setError("");
    try {
      await onSave({ title, tag, description, imageUrl, accent, active, productIds: selectedIds });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur serveur");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] flex flex-col rounded-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/6">
          <h2 className="text-sm font-semibold uppercase tracking-widest">
            {initial ? "Modifier le look" : "Nouveau look"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Image upload */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-black/40 mb-2">
              Image principale *
            </label>
            <div
              className="relative w-full h-52 border-2 border-dashed border-black/10 bg-black/[0.02] flex items-center justify-center cursor-pointer hover:border-black/25 transition-colors overflow-hidden"
              onClick={() => fileRef.current?.click()}
            >
              {imageUrl ? (
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-black/30">
                  {uploading
                    ? <Loader2 size={24} className="animate-spin" />
                    : <><ImageIcon size={24} strokeWidth={1} /><span className="text-[11px]">Cliquer pour uploader</span></>
                  }
                </div>
              )}
              {imageUrl && (
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <Upload size={20} className="text-white" />
                </div>
              )}
            </div>
            <input
              ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
          </div>

          {/* Titre + Tag */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Titre *</label>
              <input
                value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Casual Chic"
                className="w-full border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:border-black/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Tag</label>
              <input
                value={tag} onChange={(e) => setTag(e.target.value)}
                placeholder="Ex: Quotidien, Bureau…"
                className="w-full border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:border-black/30 transition-colors"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-black/40 mb-1.5">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Décrivez la tenue…"
              className="w-full border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:border-black/30 transition-colors resize-none"
            />
          </div>

          {/* Accent + Active */}
          <div className="flex items-center gap-6 flex-wrap">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-black/40 mb-2">Couleur du badge</label>
              <div className="flex gap-2 flex-wrap">
                {ACCENT_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setAccent(p.value)}
                    title={p.label}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${accent === p.value ? "border-black scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: p.value }}
                  />
                ))}
                <input
                  type="color" value={accent} onChange={(e) => setAccent(e.target.value)}
                  className="w-7 h-7 rounded-full border border-black/10 cursor-pointer p-0.5"
                  title="Couleur personnalisée"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] uppercase tracking-widest text-black/40">Visible</span>
              <button
                onClick={() => setActive((v) => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${active ? "bg-black" : "bg-black/15"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${active ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Produits liés */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-black/40 mb-2">
              Produits référencés ({selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""})
            </label>

            {/* Sélectionnés */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedIds.map((id) => {
                  const p = products.find((x) => x.id === id);
                  if (!p) return null;
                  return (
                    <div key={id} className="flex items-center gap-1.5 bg-black text-white text-[10px] uppercase tracking-wider px-2.5 py-1">
                      <span className="truncate max-w-32">{p.name}</span>
                      <button onClick={() => toggleProduct(id)} className="shrink-0 hover:opacity-60">
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recherche */}
            <div className="relative mb-2">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" strokeWidth={1.5} />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit…"
                className="w-full border border-black/10 pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-black/30 transition-colors"
              />
            </div>

            {/* Liste produits */}
            <div className="border border-black/8 max-h-48 overflow-y-auto divide-y divide-black/5">
              {filtered.length === 0 && (
                <p className="text-center text-black/30 text-xs py-6">Aucun produit trouvé</p>
              )}
              {filtered.map((p) => {
                const checked = selectedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/[0.03] ${checked ? "bg-black/[0.04]" : ""}`}
                  >
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-black border-black" : "border-black/20"}`}>
                      {checked && <span className="text-white text-[9px] font-bold">✓</span>}
                    </div>
                    {p.mainImage
                      ? <img src={p.mainImage} alt={p.name} className="w-8 h-10 object-cover shrink-0" />
                      : <div className="w-8 h-10 bg-black/5 shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{p.name}</p>
                      <p className="text-[10px] text-black/35 uppercase tracking-wider">{p.category}</p>
                    </div>
                    <span className="text-xs text-black/40 shrink-0">{p.price.toLocaleString("fr-FR")} DA</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-black/6">
          <button onClick={onClose} className="px-5 py-2.5 text-[11px] uppercase tracking-widest text-black/50 hover:text-black transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] uppercase tracking-widest hover:bg-black/80 transition-colors disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {initial ? "Enregistrer" : "Créer le look"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Types payload ────────────────────────────────────────────────────────────

interface FormPayload {
  title: string; tag: string; description: string;
  imageUrl: string; accent: string; active: boolean; productIds: string[];
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function LookBookPage() {
  const [looks,      setLooks]      = useState<Look[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState<"create" | Look | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [toggling,   setToggling]   = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/lookbook");
    const data = await res.json();
    setLooks(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (payload: FormPayload) => {
    const res = await fetch("/api/admin/lookbook", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Échec de la création");
    setModal(null);
    await load();
  };

  const handleUpdate = async (id: string, payload: FormPayload) => {
    const res = await fetch(`/api/admin/lookbook/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Échec de la mise à jour");
    setModal(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce look définitivement ?")) return;
    setDeleting(id);
    await fetch(`/api/admin/lookbook/${id}`, { method: "DELETE" });
    setDeleting(null);
    await load();
  };

  const handleToggle = async (look: Look) => {
    setToggling(look.id);
    await fetch(`/api/admin/lookbook/${look.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !look.active }),
    });
    setToggling(null);
    await load();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Looks & Tenues</h1>
          <p className="text-black/40 text-sm mt-0.5">
            Gérez les looks affichés sur la page d'accueil
          </p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 text-[11px] uppercase tracking-widest hover:bg-black/80 transition-colors"
        >
          <Plus size={14} strokeWidth={2} />
          Nouveau look
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total",    value: looks.length },
          { label: "Actifs",   value: looks.filter((l) => l.active).length },
          { label: "Masqués",  value: looks.filter((l) => !l.active).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-black/6 px-5 py-4">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-black/35 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={22} className="animate-spin text-black/25" />
        </div>
      ) : looks.length === 0 ? (
        <div className="bg-white border border-black/6 flex flex-col items-center justify-center py-24 gap-3">
          <ImageIcon size={32} strokeWidth={1} className="text-black/15" />
          <p className="text-black/35 text-sm">Aucun look créé</p>
          <button
            onClick={() => setModal("create")}
            className="mt-2 flex items-center gap-2 border border-black/15 px-5 py-2.5 text-[11px] uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all"
          >
            <Plus size={13} strokeWidth={2} /> Créer le premier look
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {looks.map((look) => (
            <div key={look.id} className={`bg-white border border-black/6 overflow-hidden group transition-opacity ${!look.active ? "opacity-60" : ""}`}>

              {/* Image */}
              <div className="relative h-52 overflow-hidden bg-black/5">
                {look.imageUrl
                  ? <img src={look.imageUrl} alt={look.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={24} className="text-black/15" strokeWidth={1} /></div>
                }
                {/* Accent badge */}
                <div className="absolute top-3 left-3">
                  <span className="text-[8px] uppercase tracking-[0.3em] font-semibold px-2.5 py-1 text-white" style={{ backgroundColor: look.accent }}>
                    {look.tag || "Look"}
                  </span>
                </div>
                {/* Statut */}
                <div className="absolute top-3 right-3">
                  <span className={`text-[8px] uppercase tracking-widest px-2 py-1 font-semibold ${look.active ? "bg-emerald-500 text-white" : "bg-black/40 text-white"}`}>
                    {look.active ? "Actif" : "Masqué"}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="px-4 py-4">
                <h3 className="font-semibold text-sm truncate">{look.title}</h3>
                {look.description && (
                  <p className="text-black/40 text-xs mt-1 line-clamp-2">{look.description}</p>
                )}

                {/* Produits liés */}
                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {look.products.length === 0 ? (
                    <span className="text-[10px] text-black/25 uppercase tracking-wider">Aucun produit lié</span>
                  ) : (
                    <>
                      {look.products.slice(0, 4).map((lp) => (
                        <div key={lp.id} className="relative w-8 h-10 overflow-hidden bg-black/5 border border-black/8" title={lp.product.name}>
                          {lp.product.mainImage
                            ? <img src={lp.product.mainImage} alt={lp.product.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full" />
                          }
                        </div>
                      ))}
                      {look.products.length > 4 && (
                        <span className="text-[10px] text-black/35 uppercase tracking-wider">+{look.products.length - 4}</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center border-t border-black/6 divide-x divide-black/6">
                <button
                  onClick={() => setModal(look)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] uppercase tracking-wider text-black/50 hover:bg-black/[0.03] hover:text-black transition-colors"
                >
                  <Pencil size={12} strokeWidth={1.5} /> Modifier
                </button>
                <button
                  onClick={() => handleToggle(look)}
                  disabled={toggling === look.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] uppercase tracking-wider text-black/50 hover:bg-black/[0.03] hover:text-black transition-colors disabled:opacity-40"
                >
                  {toggling === look.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : look.active ? <EyeOff size={12} strokeWidth={1.5} /> : <Eye size={12} strokeWidth={1.5} />
                  }
                  {look.active ? "Masquer" : "Afficher"}
                </button>
                <button
                  onClick={() => handleDelete(look.id)}
                  disabled={deleting === look.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                >
                  {deleting === look.id
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Trash2 size={12} strokeWidth={1.5} />
                  }
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === "create" && (
        <LookForm onSave={handleCreate} onClose={() => setModal(null)} />
      )}
      {modal && modal !== "create" && (
        <LookForm
          initial={modal}
          onSave={(payload) => handleUpdate(modal.id, payload)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
