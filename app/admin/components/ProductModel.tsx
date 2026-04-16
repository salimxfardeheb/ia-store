"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { X, ChevronDown, Upload, ImagePlus, Layers, Palette, AlertCircle } from "lucide-react";
import { uploadImage } from "@/services/admin";
import {
  Product,
  ProductImage,
  SIZE_OPTIONS,
  SHOE_SIZE_OPTIONS,
  SizeEntry,
  VariantEntry,
} from "@/app/variables";
import VariantBuilder from "@/app/admin/components/VariantBuilder";

// ─── Palette partagée avec VariantBuilder ─────────────────────────────────────

const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Noir",     hex: "#0A0A0A" },
  { name: "Blanc",    hex: "#FFFFFF" },
  { name: "Gris",     hex: "#6B7280" },
  { name: "Beige",    hex: "#D2B48C" },
  { name: "Marine",   hex: "#1E3A5F" },
  { name: "Bleu",     hex: "#3B82F6" },
  { name: "Rouge",    hex: "#EF4444" },
  { name: "Rose",     hex: "#EC4899" },
  { name: "Orange",   hex: "#F97316" },
  { name: "Jaune",    hex: "#EAB308" },
  { name: "Vert",     hex: "#22C55E" },
  { name: "Violet",   hex: "#A855F7" },
  { name: "Marron",   hex: "#92400E" },
  { name: "Bordeaux", hex: "#881337" },
];

const hexOf = (name: string) =>
  PRESET_COLORS.find((c) => c.name === name)?.hex ?? "#CCCCCC";

// ─── Helpers stock ────────────────────────────────────────────────────────────

const totalStock = (sizes: SizeEntry[]) =>
  sizes.reduce((sum, s) => sum + s.quantity, 0);

const totalVariantsStock = (variants: VariantEntry[]) =>
  variants.reduce(
    (sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0),
    0,
  );

// ─── Type état unifié pour les images supplémentaires ────────────────────────

type ExtraItem =
  | { kind: "existing"; url: string; color?: string }
  | { kind: "new"; file: File; preview: string; color?: string };

// ─── Composant principal ──────────────────────────────────────────────────────

export default function ProductModel({
  product,
  onClose,
  onSave,
  categories,
  onAddCategory,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => Promise<void>;
  categories: string[];
  onAddCategory: (cat: string) => void;
}) {
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const validCategories = categories.filter((c) => c !== "Tous");
  const [showAddCategory, setShowAddCategory] = useState(validCategories.length === 0);
  const [uploading, setUploading] = useState(false);
  const isNew = !product;

  const [useVariants, setUseVariants] = useState(
    () => (product?.variants?.length ?? 0) > 0,
  );

  // Image principale
  const [mainPreview, setMainPreview] = useState<string>(product?.mainImage ?? "");
  const [mainFile, setMainFile] = useState<File | null>(null);

  // Images supplémentaires — sans limite fixe, avec couleur optionnelle
  const [extraItems, setExtraItems] = useState<ExtraItem[]>(
    () =>
      (product?.extraImages ?? []).map((img) => ({
        kind: "existing" as const,
        url: img.url,
        color: img.color,
      })),
  );

  // Index de l'image dont le sélecteur de couleur est ouvert (-1 = fermé)
  const [colorPickerIdx, setColorPickerIdx] = useState<number>(-1);

  // Erreur de soumission (validation ou API)
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Product>(
    product ?? {
      id: "",
      name: "",
      category: "",
      price: 0,
      stock: 0,
      sizes: [],
      variants: [],
      status: "Brouillon",
      createdAt: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      mainImage: "",
      extraImages: [],
    },
  );

  // ── Tailles ──────────────────────────────────────────────────────────────

  const toggleSize = (size: string) => {
    setForm((f) => {
      const exists = f.sizes.find((s) => s.size === size);
      const sizes = exists
        ? f.sizes.filter((s) => s.size !== size)
        : [...f.sizes, { size, quantity: 1 }];
      return { ...f, sizes, stock: totalStock(sizes) };
    });
  };

  const updateQuantity = (size: string, quantity: number) => {
    setForm((f) => {
      const sizes = f.sizes.map((s) =>
        s.size === size ? { ...s, quantity: Math.max(0, quantity) } : s,
      );
      return { ...f, sizes, stock: totalStock(sizes) };
    });
  };

  // ── Catégorie ─────────────────────────────────────────────────────────────

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onAddCategory(trimmed);
    setForm({ ...form, category: trimmed });
    setNewCategoryInput("");
    setShowAddCategory(false);
  };

  // ── Images ────────────────────────────────────────────────────────────────

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainFile(file);
    setMainPreview(URL.createObjectURL(file));
  };

  const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setExtraItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        kind: "new" as const,
        file,
        preview: URL.createObjectURL(file),
        color: undefined,
      })),
    ]);
    e.target.value = "";
  };

  const removeExtraImage = (index: number) => {
    setExtraItems((prev) => prev.filter((_, i) => i !== index));
    if (colorPickerIdx === index) setColorPickerIdx(-1);
  };

  const setImageColor = (index: number, color: string | undefined) => {
    setExtraItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, color } : item)),
    );
    setColorPickerIdx(-1);
  };

  // ── Soumission ───────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!mainPreview || !form.category) return;

    // ── Validation : doublons de couleurs ────────────────────────────────
    if (useVariants && (form.variants?.length ?? 0) > 0) {
      const colors = (form.variants ?? [])
        .map((v) => v.color.toLowerCase().trim())
        .filter(Boolean);
      if (new Set(colors).size !== colors.length) {
        setSubmitError("Chaque variante doit avoir une couleur unique.");
        return;
      }
      // Vérifie aussi qu'aucune variante n'a de couleur vide
      if ((form.variants ?? []).some((v) => !v.color.trim())) {
        setSubmitError("Toutes les variantes doivent avoir une couleur.");
        return;
      }
    }

    setSubmitError(null);
    setUploading(true);

    try {
      let mainImageUrl = form.mainImage;
      if (mainFile) {
        mainImageUrl = await uploadImage(mainFile);
      }

      const extraImages: ProductImage[] = [];
      for (const item of extraItems) {
        const url =
          item.kind === "existing" ? item.url : await uploadImage(item.file);
        extraImages.push({ url, ...(item.color ? { color: item.color } : {}) });
      }

      // Normalise les couleurs des variantes (trim) avant envoi
      const normalizedVariants = (form.variants ?? []).map((v) => ({
        ...v,
        color: v.color.trim(),
      }));

      await onSave({
        ...form,
        variants: normalizedVariants,
        mainImage: mainImageUrl,
        extraImages,
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Une erreur est survenue";
      // Traduit les messages backend en français lisible
      const msg =
        raw.includes("couleur") || raw.includes("color") || raw.includes("DUPLICATE")
          ? "Deux variantes ont la même couleur. Corrigez les doublons et réessayez."
          : raw;
      setSubmitError(msg);
    } finally {
      setUploading(false);
    }
  };

  const sizeOptions =
    form.category.toLocaleLowerCase().includes("chaussure")
      ? SHOE_SIZE_OPTIONS
      : SIZE_OPTIONS;
  const selectedSizes = form.sizes.map((s) => s.size);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-lg mx-4 relative max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-[rgba(0,0,0,0.08)] shrink-0">
          <div>
            <h2 className="text-lg text-black font-serif italic font-light">
              {isNew ? "Nouveau produit" : "Modifier le produit"}
            </h2>
            <p className="text-[8px] uppercase tracking-[0.3em] text-black/30 mt-0.5 font-serif">
              {form.id || "Nouveau"}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-black/5 transition-colors">
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form scrollable */}
        <div className="px-7 py-6 space-y-5 overflow-y-auto" onClick={() => setColorPickerIdx(-1)}>

          {/* ── Images ─────────────────────────────────────────── */}
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-3 font-serif">
              Images
            </label>

            {/* Image principale */}
            <div className="mb-3">
              <p className="text-[8px] text-black/30 font-serif mb-1.5">
                Principale <span className="text-black/50">*</span>
              </p>
              <button
                type="button"
                onClick={() => mainInputRef.current?.click()}
                className={`w-24 h-24 border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden shrink-0 ${
                  mainPreview
                    ? "border-transparent"
                    : "border-black/10 hover:border-black/30"
                }`}
              >
                {mainPreview ? (
                  <>
                    <img src={mainPreview} alt="main" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all flex items-center justify-center">
                      <Upload size={14} className="text-white opacity-0 group-hover:opacity-100" strokeWidth={1.5} />
                    </div>
                  </>
                ) : (
                  <>
                    <ImagePlus size={18} strokeWidth={1} className="text-black/20 mb-1" />
                    <span className="text-[8px] text-black/20 font-serif">Ajouter</span>
                  </>
                )}
              </button>
              <input
                ref={mainInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMainImageChange}
              />
              {!mainPreview && (
                <p className="mt-1 text-[8px] text-red-400/70 font-serif italic">
                  Obligatoire
                </p>
              )}
            </div>

            {/* Images supplémentaires */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] text-black/30 font-serif">
                  Supplémentaires{" "}
                  {extraItems.length > 0 && (
                    <span className="text-black/20 italic">({extraItems.length})</span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); extraInputRef.current?.click(); }}
                  className="flex items-center gap-1 text-[8px] uppercase tracking-widest text-black/40 hover:text-black border border-[rgba(0,0,0,0.08)] hover:border-black/30 px-2.5 py-1 font-serif transition-all"
                >
                  <ImagePlus size={10} strokeWidth={1.5} />
                  Ajouter
                </button>
              </div>

              {/* Grille d'images */}
              {extraItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extraItems.map((item, i) => {
                    const src = item.kind === "existing" ? item.url : item.preview;
                    const isPickerOpen = colorPickerIdx === i;
                    return (
                      <div
                        key={i}
                        className="relative w-20 h-20 border border-[rgba(0,0,0,0.08)] overflow-visible shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img src={src} alt={`extra-${i}`} className="w-full h-full object-cover" />

                        {/* Bouton supprimer */}
                        <button
                          type="button"
                          onClick={() => removeExtraImage(i)}
                          className="absolute -top-1.5 -right-1.5 bg-black hover:bg-black/70 p-0.5 transition-colors z-10"
                        >
                          <X size={9} className="text-white" />
                        </button>

                        {/* Badge couleur */}
                        <button
                          type="button"
                          onClick={() => setColorPickerIdx(isPickerOpen ? -1 : i)}
                          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-0.5 transition-all bg-black/0 hover:bg-black/30"
                          title={item.color ? `Couleur : ${item.color}` : "Attribuer une couleur"}
                        >
                          {item.color ? (
                            <>
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                                style={{ backgroundColor: hexOf(item.color) }}
                              />
                              <span className="text-[7px] text-white font-serif drop-shadow truncate max-w-[44px]">
                                {item.color}
                              </span>
                            </>
                          ) : (
                            <Palette size={10} className="text-white/60" strokeWidth={1.5} />
                          )}
                        </button>

                        {/* Sélecteur de couleur */}
                        {isPickerOpen && (
                          <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-[rgba(0,0,0,0.12)] shadow-lg p-2.5 w-48">
                            <p className="text-[7px] uppercase tracking-[0.25em] text-black/30 font-serif mb-2">
                              Couleur de l'image
                            </p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {PRESET_COLORS.map((c) => (
                                <button
                                  key={c.name}
                                  type="button"
                                  title={c.name}
                                  onClick={() => setImageColor(i, c.name)}
                                  className={`w-5 h-5 rounded-full border-2 transition-all ${
                                    item.color === c.name
                                      ? "border-black scale-110"
                                      : "border-[rgba(0,0,0,0.08)] hover:scale-105 hover:border-black/30"
                                  }`}
                                  style={{ backgroundColor: c.hex }}
                                />
                              ))}
                            </div>
                            {item.color && (
                              <button
                                type="button"
                                onClick={() => setImageColor(i, undefined)}
                                className="text-[8px] text-black/35 hover:text-black font-serif transition-colors"
                              >
                                ✕ Retirer la couleur
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {extraItems.length === 0 && (
                <p className="text-[8px] text-black/20 font-serif italic">
                  Aucune image supplémentaire. Cliquez sur « Ajouter » pour en insérer.
                </p>
              )}

              <input
                ref={extraInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleExtraImagesChange}
              />
            </div>
          </div>

          {/* ── Nom ────────────────────────────────────────────── */}
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Nom du produit
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border text-sm py-2.5 px-3 focus:outline-none focus:border-black transition-colors bg-[#F7F7F7] font-serif border-[rgba(0,0,0,0.08)]"
              placeholder="Ex : Costume Trois-Pièces Laine Serge"
            />
          </div>

          {/* ── Category + Status ───────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Catégorie
              </label>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={(e) => {
                    if (e.target.value === "__add__") {
                      setShowAddCategory(true);
                    } else {
                      setForm({ ...form, category: e.target.value, sizes: [], stock: 0 });
                      setShowAddCategory(false);
                    }
                  }}
                  className={`w-full border text-[11px] py-2.5 px-3 focus:outline-none focus:border-black appearance-none bg-[#F7F7F7] transition-colors font-serif ${
                    !form.category ? "border-black/20 text-black/30" : "border-[rgba(0,0,0,0.08)]"
                  }`}
                >
                  <option value="" disabled>Sélectionner...</option>
                  {validCategories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                  <option value="__add__">+ Ajouter une catégorie</option>
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
              </div>

              {showAddCategory && (
                <div className="flex gap-2 mt-2">
                  <input
                    autoFocus
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                    placeholder="Nouvelle catégorie..."
                    className="flex-1 border text-[11px] py-2 px-3 focus:outline-none focus:border-black bg-[#F7F7F7] font-serif border-[rgba(0,0,0,0.08)]"
                  />
                  <button type="button" onClick={handleAddCategory}
                    className="px-3 py-2 bg-black text-white text-[9px] uppercase tracking-widest font-serif hover:bg-black/80 transition-all">
                    OK
                  </button>
                  <button type="button" onClick={() => { setShowAddCategory(false); setNewCategoryInput(""); }}
                    className="px-3 py-2 border text-[9px] text-black/40 font-serif border-[rgba(0,0,0,0.08)] hover:border-black/30 transition-all">
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Statut
              </label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Product["status"] })}
                  className="w-full border text-[11px] py-2.5 px-3 focus:outline-none focus:border-black appearance-none bg-[#F7F7F7] transition-colors font-serif border-[rgba(0,0,0,0.08)]"
                >
                  {["Actif", "Brouillon", "Archivé"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
              </div>
            </div>
          </div>

          {/* ── Price + Stock ───────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Prix (DA)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full border text-[11px] py-2.5 px-3 focus:outline-none focus:border-black transition-colors bg-[#F7F7F7] border-[rgba(0,0,0,0.08)] font-serif"
              />
            </div>
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Stock total
              </label>
              <div className="w-full border text-[11px] py-2.5 px-3 bg-[#F2F0ED] text-black/40 font-serif italic border-[rgba(0,0,0,0.08)] select-none">
                {form.stock} unité{form.stock !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* ── Toggle variantes couleur ─────────────────────────── */}
          <div>
            <button
              type="button"
              onClick={() => {
                setUseVariants((v) => !v);
                if (!useVariants) {
                  setForm((f) => ({ ...f, sizes: [], stock: 0 }));
                } else {
                  setForm((f) => ({ ...f, variants: [], stock: 0 }));
                }
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 border text-[9px] uppercase tracking-widest font-serif transition-all w-full ${
                useVariants
                  ? "bg-black text-white border-black"
                  : "bg-white text-black/40 border-black/10 hover:border-black/30 hover:text-black"
              }`}
            >
              <Layers size={13} strokeWidth={1.5} />
              {useVariants ? "Variantes couleur activées" : "Activer les variantes couleur"}
              <span className="ml-auto text-[7px] opacity-50 normal-case italic font-light">
                {useVariants ? "(clic pour désactiver)" : "(couleurs + tailles par couleur)"}
              </span>
            </button>
          </div>

          {/* ── Mode variantes : VariantBuilder ──────────────────── */}
          {useVariants && (
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 font-serif">
                  Couleurs & tailles
                </label>
                {(form.variants?.length ?? 0) > 0 && (
                  <span className="text-[8px] text-black/25 font-serif italic">
                    {form.variants!.length} couleur{form.variants!.length > 1 ? "s" : ""} —{" "}
                    {totalVariantsStock(form.variants!)} unités
                  </span>
                )}
              </div>
              <VariantBuilder
                variants={form.variants ?? []}
                sizeOptions={sizeOptions}
                onChange={(variants) =>
                  setForm((f) => ({
                    ...f,
                    variants,
                    stock: totalVariantsStock(variants),
                  }))
                }
              />
            </div>
          )}

          {/* ── Mode simple : tailles & quantités ───────────────── */}
          {!useVariants && (
            <div>
              <div className="flex items-baseline justify-between mb-3">
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 font-serif">
                  Tailles & quantités
                </label>
                {selectedSizes.length > 0 && (
                  <span className="text-[8px] text-black/25 font-serif italic">
                    {selectedSizes.length} taille{selectedSizes.length > 1 ? "s" : ""} sélectionnée{selectedSizes.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((s) => {
                  const isSelected = !!form.sizes.find((e) => e.size === s);
                  return (
                    <button key={s} type="button" onClick={() => toggleSize(s)}
                      className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all font-serif ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-white text-black/40 border-black/10 hover:border-black/30"
                      }`}>
                      {s}
                    </button>
                  );
                })}
              </div>

              {form.sizes.length > 0 && (
                <div className="mt-4 border border-[rgba(0,0,0,0.08)] divide-y divide-[rgba(0,0,0,0.05)]">
                  {form.sizes.map(({ size, quantity }) => (
                    <div key={size} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif w-10">{size}</span>
                      <div className="flex items-center gap-0">
                        <button type="button" onClick={() => updateQuantity(size, quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors text-sm font-light">−</button>
                        <input type="number" min={0} value={quantity}
                          onChange={(e) => updateQuantity(size, Number(e.target.value))}
                          className="w-12 text-center text-[11px] font-serif border-x border-[rgba(0,0,0,0.08)] py-1.5 focus:outline-none bg-[#F7F7F7] focus:bg-white transition-colors" />
                        <button type="button" onClick={() => updateQuantity(size, quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black hover:bg-black/5 transition-colors text-sm font-light">+</button>
                      </div>
                      <span className="text-[8px] text-black/25 font-serif italic w-16 text-right">{quantity} unité{quantity !== 1 ? "s" : ""}</span>
                      <button type="button" onClick={() => toggleSize(size)}
                        className="ml-3 text-black/20 hover:text-black transition-colors">
                        <X size={11} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#F7F7F7]">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 font-serif">Total</span>
                    <span className="text-[11px] font-serif text-black italic">{form.stock} unité{form.stock !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              )}

              {form.sizes.length === 0 && (
                <p className="mt-3 text-[9px] text-black/20 font-serif italic">
                  Sélectionnez les tailles disponibles ci-dessus.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Erreur de soumission */}
        {submitError && (
          <div className="px-7 pb-0 pt-3 shrink-0 border-t border-[rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-2 text-[8px] text-red-500 bg-red-50 border border-red-200 px-3 py-2.5 font-serif leading-relaxed">
              <AlertCircle size={12} className="shrink-0 mt-px" />
              <span>{submitError}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`px-7 py-5 flex justify-end space-x-3 shrink-0 ${submitError ? "pt-3" : "border-t border-[rgba(0,0,0,0.08)]"}`}>
          <button onClick={onClose}
            className="px-6 py-2.5 border text-[9px] uppercase tracking-widest text-black/50 hover:text-black hover:border-black/30 transition-all font-serif border-[rgba(0,0,0,0.08)]">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!mainPreview || !form.category || uploading}
            className={`px-6 py-2.5 text-white text-[9px] uppercase tracking-widest transition-all font-serif flex items-center gap-2 ${
              !mainPreview || !form.category || uploading
                ? "bg-black/30 cursor-not-allowed"
                : "bg-black hover:bg-black/80"
            }`}
          >
            {uploading && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {uploading ? "Envoi en cours…" : isNew ? "Créer le produit" : "Enregistrer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
