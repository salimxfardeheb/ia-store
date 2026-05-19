"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Check, FileText, Image as ImageIcon, Layers, AlertCircle } from "lucide-react";
import { uploadImage } from "@/services/admin";
import { Product, ProductImage, SIZE_OPTIONS, SHOE_SIZE_OPTIONS, SizeEntry, VariantEntry } from "@/app/variables";
import { StepBasicInfo, type FieldErrors } from "./product-model/StepBasicInfo";
import { StepImages, type ExtraItem } from "./product-model/StepImages";
import { StepVariants } from "./product-model/StepVariants";

type StepId = 0 | 1 | 2;

const totalStock = (sizes: SizeEntry[]) =>
  sizes.reduce((sum, s) => sum + s.quantity, 0);

const totalVariantsStock = (variants: VariantEntry[]) =>
  variants.reduce((sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0), 0);

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

  const [step, setStep]               = useState<StepId>(0);
  const [uploading, setUploading]     = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errors, setErrors]           = useState<FieldErrors>({});
  const [colorPickerIdx, setColorPickerIdx] = useState(-1);
  const [showAddCategory, setShowAddCategory] = useState(validCategories.length === 0);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [useVariants, setUseVariants] = useState(() => (product?.variants?.length ?? 0) > 0);
  const [quickFill,   setQuickFill]   = useState(true);
  const [quickColors, setQuickColors] = useState<string[]>([]);
  const [quickSizes,  setQuickSizes]  = useState<string[]>([]);
  const [quickQty,    setQuickQty]    = useState<Record<string, number>>({});
  const [mainPreview, setMainPreview] = useState(product?.mainImage ?? "");
  const [mainFile,    setMainFile]    = useState<File | null>(null);
  const [extraItems, setExtraItems]   = useState<ExtraItem[]>(() =>
    (product?.extraImages ?? []).map((img) => ({ kind: "existing" as const, url: img.url, color: img.color }))
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

  const sizeOptions = form.category.toLowerCase().includes("chaussure")
    ? SHOE_SIZE_OPTIONS
    : SIZE_OPTIONS;

  const computedStock = useVariants
    ? totalVariantsStock(form.variants ?? [])
    : totalStock(form.sizes);

  const validateStep = useCallback((s: StepId): FieldErrors => {
    const e: FieldErrors = {};
    if (s === 0) {
      if (!form.name.trim()) e.name     = "Le nom est requis";
      if (!form.category)    e.category = "La catégorie est requise";
      if (form.price <= 0)   e.price    = "Le prix doit être supérieur à 0";
    }
    if (s === 1) {
      if (!mainPreview) e.mainImage = "L'image principale est requise";
    }
    return e;
  }, [form.name, form.category, form.price, mainPreview]);

  const step0HasError = () => Object.keys(validateStep(0)).length > 0;
  const step1HasError = () => Object.keys(validateStep(1)).length > 0;

  const setField = useCallback(<K extends keyof Product>(key: K, value: Product[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const blurValidate = useCallback((field: keyof FieldErrors) => {
    const fieldErrors = validateStep(step);
    if (fieldErrors[field]) {
      setErrors((e) => {
        if (e[field] === fieldErrors[field]) return e;
        return { ...e, [field]: fieldErrors[field] };
      });
    }
  }, [step, validateStep]);

  const toggleSize = useCallback((size: string) => {
    setForm((f) => {
      const exists = f.sizes.find((s) => s.size === size);
      const sizes  = exists
        ? f.sizes.filter((s) => s.size !== size)
        : [...f.sizes, { size, quantity: 1 }];
      return { ...f, sizes, stock: totalStock(sizes) };
    });
  }, []);

  const updateQuantity = useCallback((size: string, quantity: number) => {
    setForm((f) => {
      const sizes = f.sizes.map((s) =>
        s.size === size ? { ...s, quantity: Math.max(0, quantity) } : s
      );
      return { ...f, sizes, stock: totalStock(sizes) };
    });
  }, []);

  const handleAddCategory = useCallback(() => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    onAddCategory(trimmed);
    setForm((f) => ({ ...f, category: trimmed }));
    setErrors((e) => ({ ...e, category: undefined }));
    setNewCategoryInput("");
    setShowAddCategory(false);
  }, [newCategoryInput, categories, onAddCategory]);

  const handleMainImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainFile(file);
    setMainPreview(URL.createObjectURL(file));
    setErrors((e) => ({ ...e, mainImage: undefined }));
  }, []);

  const handleExtraImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setExtraItems((prev) => [
      ...prev,
      ...files.map((file) => ({ kind: "new" as const, file, preview: URL.createObjectURL(file), color: undefined })),
    ]);
    e.target.value = "";
  }, []);

  const removeExtraImage = useCallback((index: number) => {
    setExtraItems((prev) => prev.filter((_, i) => i !== index));
    if (colorPickerIdx === index) setColorPickerIdx(-1);
  }, [colorPickerIdx]);

  const setImageColor = useCallback((index: number, color: string | undefined) => {
    setExtraItems((prev) => prev.map((item, i) => (i === index ? { ...item, color } : item)));
    // Ne pas fermer le picker ici — l'utilisateur le ferme en cliquant ailleurs
  }, []);

  const goNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) { setErrors(stepErrors); return; }
    setStep((s) => Math.min(2, s + 1) as StepId);
  };

  const goPrev = () => setStep((s) => Math.max(0, s - 1) as StepId);

  const handleSubmit = async () => {
    // step 0 = Infos, step 2 = Images (step 1 = Variantes, pas de validation bloquante)
    const allErrors = { ...validateStep(0), ...validateStep(1) };
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (Object.keys(validateStep(0)).length > 0) { setStep(0); return; }
      if (Object.keys(validateStep(1)).length > 0) { setStep(2); return; }
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
      await onSave({ ...form, stock: computedStock, variants: normalizedVariants, mainImage: mainImageUrl, extraImages });
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

  const STEPS = [
    { id: 0 as StepId, label: "Infos de base", Icon: FileText,  hasError: () => step > 0 && step0HasError() },
    { id: 1 as StepId, label: "Variantes",     Icon: Layers,    hasError: () => false },
    { id: 2 as StepId, label: "Images",        Icon: ImageIcon, hasError: () => step > 2 && step1HasError() },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
        {/* Header */}
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
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-black/5 transition-colors rounded">
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Step tabs */}
        <div className="flex border-b border-black/8 shrink-0">
          {STEPS.map(({ id, label, Icon, hasError }) => {
            const isActive = step === id;
            const isDone   = id < step && !hasError();
            const isErr    = hasError();
            return (
              <button
                key={id}
                type="button"
                onClick={() => setStep(id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-[8px] uppercase tracking-[0.2em] font-serif transition-all border-b-2 ${
                  isActive ? "border-black text-black"
                  : isErr   ? "border-red-300 text-red-400 hover:text-red-500"
                  : isDone  ? "border-transparent text-black/60 hover:text-black/70"
                           : "border-transparent text-black/30 hover:text-black/60"
                }`}
              >
                {isDone ? <Check size={10} strokeWidth={2.5} className="text-black/60" /> : <Icon size={11} strokeWidth={1.5} />}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5 min-h-0"
          onClick={() => setColorPickerIdx(-1)}
        >
          {step === 0 && (
            <StepBasicInfo
              form={form} errors={errors} setField={setField} blurValidate={blurValidate}
              validCategories={validCategories} showAddCategory={showAddCategory}
              setShowAddCategory={setShowAddCategory} newCategoryInput={newCategoryInput}
              setNewCategoryInput={setNewCategoryInput} handleAddCategory={handleAddCategory}
              useVariants={useVariants} setQuickFill={setQuickFill}
              setQuickSizes={setQuickSizes} setQuickQty={setQuickQty}
              setQuickColors={setQuickColors} setErrors={setErrors}
            />
          )}
          {step === 1 && (
            <StepVariants
              form={form} useVariants={useVariants} setUseVariants={setUseVariants}
              quickFill={quickFill} setQuickFill={setQuickFill}
              quickColors={quickColors} setQuickColors={setQuickColors}
              quickSizes={quickSizes} setQuickSizes={setQuickSizes}
              quickQty={quickQty} setQuickQty={setQuickQty}
              sizeOptions={sizeOptions} computedStock={computedStock}
              toggleSize={toggleSize} updateQuantity={updateQuantity} setForm={setForm}
            />
          )}
          {step === 2 && (
            <StepImages
              mainPreview={mainPreview} errors={errors}
              mainInputRef={mainInputRef} extraInputRef={extraInputRef}
              extraItems={extraItems} colorPickerIdx={colorPickerIdx}
              setColorPickerIdx={setColorPickerIdx}
              handleMainImageChange={handleMainImageChange}
              handleExtraImagesChange={handleExtraImagesChange}
              removeExtraImage={removeExtraImage} setImageColor={setImageColor}
              variants={useVariants ? (form.variants ?? []) : []}
            />
          )}
        </div>

        {submitError && (
          <div className="px-6 py-3 border-t border-red-100 bg-red-50 shrink-0">
            <div className="flex items-start gap-2 text-[9px] text-red-500 font-serif leading-relaxed">
              <AlertCircle size={12} className="shrink-0 mt-px" />
              {submitError}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between border-t border-black/8 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border text-[9px] uppercase tracking-widest text-black/60 hover:text-black hover:border-black/30 transition-all font-serif border-black/10"
          >
            Annuler
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={goPrev}
                className="px-4 py-2 border text-[9px] uppercase tracking-widest text-black/60 hover:text-black hover:border-black/30 transition-all font-serif border-black/10"
              >
                ← Précédent
              </button>
            )}
            {step < 2 ? (
              <button
                type="button"
                onClick={goNext}
                className="px-5 py-2 bg-black text-white text-[9px] uppercase tracking-widest font-serif hover:bg-black/80 transition-all"
              >
                Suivant →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={uploading}
                className={`px-6 py-2 text-white text-[9px] uppercase tracking-widest font-serif flex items-center gap-2 transition-all ${
                  uploading ? "bg-black/30 cursor-not-allowed" : "bg-black hover:bg-black/80"
                }`}
              >
                {uploading && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {uploading ? "Envoi en cours…" : isNew ? "Créer le produit" : "Enregistrer"}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
