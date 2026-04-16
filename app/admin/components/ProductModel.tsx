"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  X, ChevronDown, Upload, ImagePlus, Layers, Palette,
  AlertCircle, Check, FileText, Image as ImageIcon, Plus,
} from "lucide-react";
import { uploadImage } from "@/services/admin";
import {
  Product, ProductImage, SIZE_OPTIONS, SHOE_SIZE_OPTIONS,
  SizeEntry, VariantEntry,
} from "@/app/variables";
import VariantBuilder from "@/app/admin/components/VariantBuilder";

// ─── Constants ────────────────────────────────────────────────────────────────

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

const STATUS_OPTIONS = [
  { value: "Brouillon" as const, label: "Brouillon", active: "bg-black/50 text-white" },
  { value: "Actif"     as const, label: "Actif",     active: "bg-emerald-600 text-white" },
  { value: "Archivé"   as const, label: "Archivé",   active: "bg-black/30 text-white" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type ExtraItem =
  | { kind: "existing"; url: string; color?: string }
  | { kind: "new"; file: File; preview: string; color?: string };

type StepId = 0 | 1 | 2;

type FieldErrors = Partial<{
  name: string;
  category: string;
  price: string;
  mainImage: string;
}>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const totalStock = (sizes: SizeEntry[]) =>
  sizes.reduce((sum, s) => sum + s.quantity, 0);

const totalVariantsStock = (variants: VariantEntry[]) =>
  variants.reduce((sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0), 0);

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductModel({
  product, onClose, onSave, categories, onAddCategory,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => Promise<void>;
  categories: string[];
  onAddCategory: (cat: string) => void;
}) {
  const isNew = !product;
  const validCategories = categories.filter((c) => c !== "Tous");

  // ── Core state ───────────────────────────────────────────────────────────

  const [step, setStep]               = useState<StepId>(0);
  const [uploading, setUploading]     = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors]           = useState<FieldErrors>({});
  const [colorPickerIdx, setColorPickerIdx] = useState(-1);
  const [showAddCategory, setShowAddCategory] = useState(validCategories.length === 0);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [useVariants, setUseVariants] = useState(() => (product?.variants?.length ?? 0) > 0);
  const [quickFill,   setQuickFill]   = useState(() => (product?.variants?.length ?? 0) === 0 && (product?.variants !== undefined ? false : true));
  const [quickColors, setQuickColors] = useState<string[]>([]);
  const [quickSizes,  setQuickSizes]  = useState<string[]>([]);
  const [quickQty,    setQuickQty]    = useState<Record<string, number>>({});

  const [mainPreview, setMainPreview] = useState(product?.mainImage ?? "");
  const [mainFile,    setMainFile]    = useState<File | null>(null);

  const [extraItems, setExtraItems] = useState<ExtraItem[]>(() =>
    (product?.extraImages ?? []).map((img) => ({
      kind: "existing" as const,
      url: img.url,
      color: img.color,
    }))
  );

  const [form, setForm] = useState<Product>(() =>
    product ?? {
      id: "", name: "", category: "", price: 0, stock: 0,
      sizes: [], variants: [], status: "Brouillon",
      createdAt: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      mainImage: "", extraImages: [],
    }
  );

  const mainInputRef  = useRef<HTMLInputElement>(null);
  const extraInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────

  const sizeOptions = form.category.toLowerCase().includes("chaussure")
    ? SHOE_SIZE_OPTIONS
    : SIZE_OPTIONS;

  const computedStock = useVariants
    ? totalVariantsStock(form.variants ?? [])
    : totalStock(form.sizes);

  // ── Validation ───────────────────────────────────────────────────────────

  const validateStep = (s: StepId): FieldErrors => {
    const e: FieldErrors = {};
    if (s === 0) {
      if (!form.name.trim())  e.name     = "Le nom est requis";
      if (!form.category)     e.category = "La catégorie est requise";
      if (form.price <= 0)    e.price    = "Le prix doit être supérieur à 0";
    }
    if (s === 1) {
      if (!mainPreview) e.mainImage = "L'image principale est requise";
    }
    return e;
  };

  const step0HasError = () => Object.keys(validateStep(0)).length > 0;
  const step1HasError = () => Object.keys(validateStep(1)).length > 0;

  // ── Field helpers ────────────────────────────────────────────────────────

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const blurValidate = (field: keyof FieldErrors) => {
    const fieldErrors = validateStep(step);
    if (fieldErrors[field]) {
      setErrors((e) => ({ ...e, [field]: fieldErrors[field] }));
    }
  };

  // ── Simple sizes ─────────────────────────────────────────────────────────

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
        s.size === size ? { ...s, quantity: Math.max(0, quantity) } : s
      );
      return { ...f, sizes, stock: totalStock(sizes) };
    });
  };

  // ── Category ─────────────────────────────────────────────────────────────

  const handleAddCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onAddCategory(trimmed);
    setForm((f) => ({ ...f, category: trimmed }));
    setErrors((e) => ({ ...e, category: undefined }));
    setNewCategoryInput("");
    setShowAddCategory(false);
  };

  // ── Images ───────────────────────────────────────────────────────────────

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainFile(file);
    setMainPreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, mainImage: undefined }));
  };

  const handleExtraImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setExtraItems((prev) => [
      ...prev,
      ...files.map((file) => ({ kind: "new" as const, file, preview: URL.createObjectURL(file), color: undefined })),
    ]);
    e.target.value = "";
  };

  const removeExtraImage = (index: number) => {
    setExtraItems((prev) => prev.filter((_, i) => i !== index));
    if (colorPickerIdx === index) setColorPickerIdx(-1);
  };

  const setImageColor = (index: number, color: string | undefined) => {
    setExtraItems((prev) => prev.map((item, i) => (i === index ? { ...item, color } : item)));
    setColorPickerIdx(-1);
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setStep((s) => Math.min(2, s + 1) as StepId);
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1) as StepId);

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const allErrors = { ...validateStep(0), ...validateStep(1) };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (Object.keys(validateStep(0)).length > 0) { setStep(0); return; }
      if (Object.keys(validateStep(1)).length > 0) { setStep(1); return; }
    }

    if (useVariants && (form.variants?.length ?? 0) > 0) {
      const colors = (form.variants ?? []).map((v) => v.color.toLowerCase().trim()).filter(Boolean);
      if (new Set(colors).size !== colors.length) {
        setSubmitError("Chaque variante doit avoir une couleur unique."); return;
      }
      if ((form.variants ?? []).some((v) => !v.color.trim())) {
        setSubmitError("Toutes les variantes doivent avoir une couleur."); return;
      }
    }

    setSubmitError(null);
    setUploading(true);

    try {
      let mainImageUrl = form.mainImage;
      if (mainFile) mainImageUrl = await uploadImage(mainFile);

      const extraImages: ProductImage[] = [];
      for (const item of extraItems) {
        const url = item.kind === "existing" ? item.url : await uploadImage(item.file);
        extraImages.push({ url, ...(item.color ? { color: item.color } : {}) });
      }

      const normalizedVariants = (form.variants ?? []).map((v) => ({ ...v, color: v.color.trim() }));

      await onSave({
        ...form,
        stock: computedStock,
        variants: normalizedVariants,
        mainImage: mainImageUrl,
        extraImages,
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Une erreur est survenue";
      const msg =
        raw.includes("couleur") || raw.includes("color") || raw.includes("DUPLICATE")
          ? "Deux variantes ont la même couleur. Corrigez les doublons et réessayez."
          : raw;
      setSubmitError(msg);
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.18 }}
        className="bg-white w-full max-w-2xl relative max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 shrink-0">
          <div>
            <h2 className="text-base text-black font-serif italic font-light">
              {isNew ? "Nouveau produit" : "Modifier le produit"}
            </h2>
            {!isNew && (
              <p className="text-[8px] uppercase tracking-[0.3em] text-black/25 mt-0.5 font-serif">{form.id}</p>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-[7px] uppercase tracking-[0.25em] text-black/25 font-serif">Stock total</p>
              <p className="text-sm font-serif text-black tabular-nums">{computedStock}</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-black/5 transition-colors rounded">
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* ── Step tabs ───────────────────────────────────────────────────── */}
        <div className="flex border-b border-black/8 shrink-0">
          {(
            [
              { id: 0 as StepId, label: "Infos de base", Icon: FileText,  hasError: () => step > 0 && step0HasError() },
              { id: 1 as StepId, label: "Images",        Icon: ImageIcon, hasError: () => step > 1 && step1HasError() },
              { id: 2 as StepId, label: "Variantes",     Icon: Layers,    hasError: () => false },
            ] as const
          ).map(({ id, label, Icon, hasError }) => {
            const isActive = step === id;
            const isDone   = id < step && !hasError();
            const isErr    = hasError();
            return (
              <button
                key={id}
                onClick={() => setStep(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[8px] uppercase tracking-[0.2em] font-serif transition-all border-b-2 ${
                  isActive
                    ? "border-black text-black"
                    : isErr
                    ? "border-red-300 text-red-400 hover:text-red-500"
                    : isDone
                    ? "border-transparent text-black/40 hover:text-black/70"
                    : "border-transparent text-black/30 hover:text-black/60"
                }`}
              >
                {isDone ? (
                  <Check size={10} strokeWidth={2.5} className="text-black/40" />
                ) : (
                  <Icon size={11} strokeWidth={1.5} />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Scrollable content ──────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5 min-h-0"
          onClick={() => setColorPickerIdx(-1)}
        >
          {step === 0 && <StepBasicInfo />}
          {step === 1 && <StepImages />}
          {step === 2 && <StepVariants />}
        </div>

        {/* ── Error banner ────────────────────────────────────────────────── */}
        {submitError && (
          <div className="px-6 py-3 border-t border-red-100 bg-red-50 shrink-0">
            <div className="flex items-start gap-2 text-[9px] text-red-500 font-serif leading-relaxed">
              <AlertCircle size={12} className="shrink-0 mt-px" />
              {submitError}
            </div>
          </div>
        )}

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-black/8 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border text-[9px] uppercase tracking-widest text-black/40 hover:text-black hover:border-black/30 transition-all font-serif border-black/10"
          >
            Annuler
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={goPrev}
                className="px-4 py-2 border text-[9px] uppercase tracking-widest text-black/40 hover:text-black hover:border-black/30 transition-all font-serif border-black/10"
              >
                ← Précédent
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={goNext}
                className="px-5 py-2 bg-black text-white text-[9px] uppercase tracking-widest font-serif hover:bg-black/80 transition-all"
              >
                Suivant →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className={`px-6 py-2 text-white text-[9px] uppercase tracking-widest font-serif flex items-center gap-2 transition-all ${
                  uploading ? "bg-black/30 cursor-not-allowed" : "bg-black hover:bg-black/80"
                }`}
              >
                {uploading && (
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {uploading ? "Envoi en cours…" : isNew ? "Créer le produit" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  // ── Step: Basic Info ───────────────────────────────────────────────────────

  function StepBasicInfo() {
    return (
      <div className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
            Nom du produit <span className="text-red-400">*</span>
          </label>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            onBlur={() => blurValidate("name")}
            placeholder="Ex : Costume Trois-Pièces Laine Serge"
            className={`w-full border text-sm py-2.5 px-3 focus:outline-none transition-colors bg-[#F7F7F7] font-serif ${
              errors.name
                ? "border-red-300 focus:border-red-400"
                : "border-black/8 focus:border-black"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-[8px] text-red-400 font-serif">{errors.name}</p>
          )}
        </div>

        {/* Category + Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Catégorie <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={form.category}
                onChange={(e) => {
                  if (e.target.value === "__add__") {
                    setShowAddCategory(true);
                  } else {
                    setForm((f) => ({ ...f, category: e.target.value, sizes: [], variants: [], stock: 0 }));
                    setErrors((e) => ({ ...e, category: undefined }));
                    setShowAddCategory(false);
                    setQuickSizes([]);
                    setQuickQty({});
                    setQuickColors([]);
                    if (useVariants) setQuickFill(true);
                  }
                }}
                className={`w-full border text-[11px] py-2.5 px-3 focus:outline-none appearance-none bg-[#F7F7F7] transition-colors font-serif ${
                  errors.category
                    ? "border-red-300"
                    : !form.category
                    ? "border-black/12 text-black/30"
                    : "border-black/8"
                }`}
              >
                <option value="" disabled>Sélectionner...</option>
                {validCategories.map((c) => <option key={c}>{c}</option>)}
                <option value="__add__">+ Ajouter une catégorie</option>
              </select>
              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black/30" />
            </div>
            {errors.category && (
              <p className="mt-1 text-[8px] text-red-400 font-serif">{errors.category}</p>
            )}

            {showAddCategory && (
              <div className="flex gap-2 mt-2">
                <input
                  autoFocus
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="Nouvelle catégorie..."
                  className="flex-1 border text-[11px] py-2 px-3 focus:outline-none focus:border-black bg-[#F7F7F7] font-serif border-black/8"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-2 bg-black text-white text-[9px] uppercase tracking-widest font-serif hover:bg-black/80 transition-all"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddCategory(false); setNewCategoryInput(""); }}
                  className="px-3 py-2 border text-[9px] text-black/40 font-serif border-black/8 hover:border-black/30 transition-all"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
              Prix de base (DA) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={form.price || ""}
              onChange={(e) => setField("price", Number(e.target.value))}
              onBlur={() => blurValidate("price")}
              placeholder="0"
              className={`w-full border text-[11px] py-2.5 px-3 focus:outline-none transition-colors bg-[#F7F7F7] font-serif ${
                errors.price
                  ? "border-red-300"
                  : "border-black/8 focus:border-black"
              }`}
            />
            {errors.price && (
              <p className="mt-1 text-[8px] text-red-400 font-serif">{errors.price}</p>
            )}
          </div>
        </div>

        {/* Status segmented control */}
        <div>
          <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">
            Statut
          </label>
          <div className="flex border border-black/10 overflow-hidden">
            {STATUS_OPTIONS.map(({ value, label, active }) => (
              <button
                key={value}
                type="button"
                onClick={() => setField("status", value)}
                className={`flex-1 py-2.5 text-[9px] uppercase tracking-widest font-serif transition-all border-r last:border-r-0 border-black/10 ${
                  form.status === value
                    ? active
                    : "text-black/35 hover:text-black hover:bg-black/3"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Images ──────────────────────────────────────────────────────────

  function StepImages() {
    return (
      <div className="space-y-6">
        {/* Main image */}
        <div>
          <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-3 font-serif">
            Image principale <span className="text-red-400">*</span>
          </label>
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => mainInputRef.current?.click()}
              className={`w-32 h-32 border-2 border-dashed flex flex-col items-center justify-center relative overflow-hidden shrink-0 group transition-all ${
                mainPreview
                  ? "border-transparent"
                  : errors.mainImage
                  ? "border-red-300 hover:border-red-400"
                  : "border-black/10 hover:border-black/30"
              }`}
            >
              {mainPreview ? (
                <>
                  <img src={mainPreview} alt="main" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center">
                    <Upload size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                  </div>
                </>
              ) : (
                <>
                  <ImagePlus size={20} strokeWidth={1} className="text-black/20 mb-1.5" />
                  <span className="text-[9px] text-black/20 font-serif">Cliquer pour ajouter</span>
                </>
              )}
            </button>

            <div className="flex-1 pt-1">
              <p className="text-[9px] text-black/40 font-serif leading-relaxed">
                Affichée dans les listes de produits et en en-tête de la fiche produit.
              </p>
              {mainPreview && (
                <button
                  type="button"
                  onClick={() => mainInputRef.current?.click()}
                  className="mt-2 text-[8px] uppercase tracking-widest text-black/35 hover:text-black font-serif transition-colors border-b border-transparent hover:border-black/30"
                >
                  Changer l'image
                </button>
              )}
              {errors.mainImage && (
                <p className="mt-2 text-[8px] text-red-400 font-serif flex items-center gap-1">
                  <AlertCircle size={10} />
                  {errors.mainImage}
                </p>
              )}
            </div>
          </div>
          <input
            ref={mainInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleMainImageChange}
          />
        </div>

        {/* Extra images */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 font-serif">
              Images supplémentaires
              {extraItems.length > 0 && (
                <span className="text-black/20 italic normal-case ml-1">({extraItems.length})</span>
              )}
            </label>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); extraInputRef.current?.click(); }}
              className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-black/40 hover:text-black border border-black/8 hover:border-black/30 px-3 py-1.5 font-serif transition-all"
            >
              <Plus size={10} strokeWidth={1.5} />
              Ajouter
            </button>
          </div>

          {extraItems.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {extraItems.map((item, i) => {
                const src         = item.kind === "existing" ? item.url : item.preview;
                const isPickerOpen = colorPickerIdx === i;
                return (
                  <div
                    key={i}
                    className="relative w-20 h-20 border border-black/8 overflow-visible shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <img src={src} alt={`extra-${i}`} className="w-full h-full object-cover" />

                    <button
                      type="button"
                      onClick={() => removeExtraImage(i)}
                      className="absolute -top-1.5 -right-1.5 bg-black hover:bg-black/70 p-0.5 z-10 transition-colors"
                    >
                      <X size={9} className="text-white" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setColorPickerIdx(isPickerOpen ? -1 : i)}
                      className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-0.5 bg-black/0 hover:bg-black/30 transition-all"
                      title={item.color ? `Couleur : ${item.color}` : "Associer une couleur"}
                    >
                      {item.color ? (
                        <>
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/50 shrink-0"
                            style={{ backgroundColor: hexOf(item.color) }}
                          />
                          <span className="text-[7px] text-white font-serif drop-shadow truncate max-w-11">
                            {item.color}
                          </span>
                        </>
                      ) : (
                        <Palette size={10} className="text-white/60" strokeWidth={1.5} />
                      )}
                    </button>

                    {isPickerOpen && (
                      <div className="absolute top-[calc(100%+4px)] left-0 z-20 bg-white border border-black/12 shadow-lg p-2.5 w-48">
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
                                  : "border-black/8 hover:scale-105"
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
          ) : (
            <div
              className="h-20 border-2 border-dashed border-black/8 flex items-center justify-center cursor-pointer hover:border-black/20 transition-colors"
              onClick={() => extraInputRef.current?.click()}
            >
              <p className="text-[9px] text-black/20 font-serif">
                Cliquer pour ajouter des images supplémentaires
              </p>
            </div>
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
    );
  }

  // ── Step: Variants ────────────────────────────────────────────────────────

  function StepVariants() {
    const canValidateQuick = quickColors.length > 0 && quickSizes.length > 0;

    const applyQuickFill = () => {
      if (!canValidateQuick) return;
      const variants = quickColors.map((color) => ({
        color,
        sku: "",
        sizes: quickSizes.map((name) => ({ name, stock: quickQty[name] ?? 0 })),
      }));
      setForm((f) => ({ ...f, variants, stock: totalVariantsStock(variants) }));
      setQuickFill(false);
    };

    return (
      <div className="space-y-4">
        {/* Mode toggle */}
        <div className="flex border border-black/10 overflow-hidden">
          <button
            type="button"
            onClick={() => {
              setUseVariants(false);
              setForm((f) => ({ ...f, variants: [], stock: 0 }));
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] uppercase tracking-widest font-serif transition-all ${
              !useVariants
                ? "bg-black text-white"
                : "text-black/35 hover:text-black hover:bg-black/3"
            }`}
          >
            Tailles simples
          </button>
          <button
            type="button"
            onClick={() => {
              setUseVariants(true);
              setForm((f) => ({ ...f, sizes: [], stock: 0 }));
              if ((form.variants?.length ?? 0) === 0) setQuickFill(true);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] uppercase tracking-widest font-serif transition-all border-l border-black/10 ${
              useVariants
                ? "bg-black text-white"
                : "text-black/35 hover:text-black hover:bg-black/3"
            }`}
          >
            <Layers size={11} strokeWidth={1.5} />
            Couleurs + tailles
          </button>
        </div>

        {/* Simple sizes */}
        {!useVariants && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {sizeOptions.map((s) => {
                const isSelected = !!form.sizes.find((e) => e.size === s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(s)}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all font-serif ${
                      isSelected
                        ? "bg-black text-white border-black"
                        : "bg-white text-black/40 border-black/10 hover:border-black/30"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            {form.sizes.length > 0 && (
              <div className="border border-black/8 divide-y divide-black/5">
                <div className="grid grid-cols-[1fr_auto_auto] px-3 py-1.5 bg-[#F2F0ED]">
                  <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif">Taille</span>
                  <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif w-32 text-center">Quantité</span>
                  <span className="w-6" />
                </div>
                {form.sizes.map(({ size, quantity }) => (
                  <div key={size} className="grid grid-cols-[1fr_auto_auto] items-center px-3 py-2">
                    <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif">{size}</span>
                    <div className="flex items-center w-32">
                      <button
                        type="button"
                        onClick={() => updateQuantity(size, quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min={0}
                        value={quantity}
                        onChange={(e) => updateQuantity(size, Number(e.target.value))}
                        className="w-14 text-center text-[11px] font-serif border-x border-black/8 py-1.5 focus:outline-none bg-[#F7F7F7] focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => updateQuantity(size, quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="text-black/20 hover:text-red-400 transition-colors ml-1"
                    >
                      <X size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between px-3 py-2 bg-[#F7F7F7]">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 font-serif">Total</span>
                  <span className="text-[11px] font-serif text-black italic">
                    {computedStock} unité{computedStock !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}

            {form.sizes.length === 0 && (
              <p className="text-[9px] text-black/20 font-serif italic">
                Sélectionnez les tailles disponibles ci-dessus.
              </p>
            )}
          </div>
        )}

        {/* Quick-fill form */}
        {useVariants && quickFill && (
          <div className="space-y-5">

            {/* Couleurs */}
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">Couleurs</p>
              <div className="p-3 border border-black/8 bg-[#F7F7F7] space-y-2">
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = quickColors.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        title={c.name}
                        onClick={() =>
                          setQuickColors((prev) =>
                            isSelected ? prev.filter((x) => x !== c.name) : [...prev, c.name]
                          )
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-black scale-110 shadow-sm"
                            : "border-black/10 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>
                {quickColors.length > 0 && (
                  <p className="text-[8px] text-black/40 font-serif italic">
                    {quickColors.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Tailles */}
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">Tailles</p>
              <div className="p-3 border border-black/8 bg-[#F7F7F7]">
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((s) => {
                    const isSelected = quickSizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setQuickSizes((prev) =>
                            isSelected ? prev.filter((x) => x !== s) : [...prev, s]
                          );
                          if (isSelected) {
                            setQuickQty((prev) => {
                              const next = { ...prev };
                              delete next[s];
                              return next;
                            });
                          } else {
                            setQuickQty((prev) => ({ ...prev, [s]: 1 }));
                          }
                        }}
                        className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all font-serif ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-black/40 border-black/10 hover:border-black/30"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantité des tailles */}
            {quickSizes.length > 0 && (
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">
                  Quantité des tailles
                </p>
                <div className="border border-black/8 divide-y divide-black/5">
                  {quickSizes.map((s) => {
                    const qty = quickQty[s] ?? 0;
                    return (
                      <div key={s} className="grid grid-cols-[1fr_auto] items-center px-3 py-2">
                        <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif">{s}</span>
                        <div className="flex items-center w-32">
                          <button
                            type="button"
                            onClick={() =>
                              setQuickQty((prev) => ({ ...prev, [s]: Math.max(0, (prev[s] ?? 0) - 1) }))
                            }
                            className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={qty}
                            onChange={(e) =>
                              setQuickQty((prev) => ({
                                ...prev,
                                [s]: Math.max(0, Number(e.target.value)),
                              }))
                            }
                            className="w-14 text-center text-[11px] font-serif border-x border-black/8 py-1.5 focus:outline-none bg-[#F7F7F7] focus:bg-white transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setQuickQty((prev) => ({ ...prev, [s]: (prev[s] ?? 0) + 1 }))
                            }
                            className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={applyQuickFill}
                disabled={!canValidateQuick}
                className={`flex-1 py-2.5 text-[9px] uppercase tracking-widest font-serif transition-all ${
                  canValidateQuick
                    ? "bg-black text-white hover:bg-black/80"
                    : "bg-black/8 text-black/25 cursor-not-allowed"
                }`}
              >
                {canValidateQuick
                  ? `Appliquer à ${quickColors.length} couleur${quickColors.length > 1 ? "s" : ""}`
                  : "Valider"}
              </button>
              <button
                type="button"
                onClick={() => setQuickFill(false)}
                className="px-4 py-2.5 border text-[9px] uppercase tracking-widest text-black/40 hover:text-black hover:border-black/30 transition-all font-serif border-black/10"
              >
                Saisir manuellement
              </button>
            </div>
          </div>
        )}

        {/* Color variants — manual VariantBuilder */}
        {useVariants && !quickFill && (
          <div className="space-y-3">
            {(form.variants?.length ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-[8px] text-black/30 font-serif italic">
                  {form.variants!.length} couleur{form.variants!.length > 1 ? "s" : ""} — {computedStock} unités totales
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuickColors([]);
                    setQuickSizes([]);
                    setQuickQty({});
                    setQuickFill(true);
                  }}
                  className="text-[8px] uppercase tracking-widest text-black/30 hover:text-black font-serif transition-colors border-b border-transparent hover:border-black/30"
                >
                  ↺ Recommencer
                </button>
              </div>
            )}
            <VariantBuilder
              variants={form.variants ?? []}
              sizeOptions={sizeOptions}
              onChange={(variants) =>
                setForm((f) => ({ ...f, variants, stock: totalVariantsStock(variants) }))
              }
            />
          </div>
        )}
      </div>
    );
  }
}
