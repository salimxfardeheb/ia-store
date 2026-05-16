"use client";

import { ChevronDown, X } from "lucide-react";
import { Product } from "@/app/variables";

const STATUS_OPTIONS = [
  { value: "Brouillon" as const, label: "Brouillon", active: "bg-black/50 text-white" },
  { value: "Actif"     as const, label: "Actif",     active: "bg-emerald-600 text-white" },
  { value: "Archivé"   as const, label: "Archivé",   active: "bg-black/30 text-white" },
];

export type FieldErrors = Partial<{
  name: string;
  category: string;
  price: string;
  mainImage: string;
}>;

export interface StepBasicInfoProps {
  form: Product;
  errors: FieldErrors;
  setField: <K extends keyof Product>(key: K, value: Product[K]) => void;
  blurValidate: (field: keyof FieldErrors) => void;
  validCategories: string[];
  showAddCategory: boolean;
  setShowAddCategory: (v: boolean) => void;
  newCategoryInput: string;
  setNewCategoryInput: (v: string) => void;
  handleAddCategory: () => void;
  useVariants: boolean;
  setQuickFill: (v: boolean) => void;
  setQuickSizes: (v: string[]) => void;
  setQuickQty: (v: Record<string, number>) => void;
  setQuickColors: (v: string[]) => void;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
}

export function StepBasicInfo({
  form, errors, setField, blurValidate,
  validCategories, showAddCategory, setShowAddCategory,
  newCategoryInput, setNewCategoryInput, handleAddCategory,
  useVariants, setQuickFill, setQuickSizes, setQuickQty, setQuickColors,
  setErrors,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-1.5 font-serif">
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
          <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-1.5 font-serif">
            Catégorie <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <select
              value={form.category}
              onChange={(e) => {
                if (e.target.value === "__add__") {
                  setShowAddCategory(true);
                } else {
                  setField("category", e.target.value);
                  setErrors((prev) => ({ ...prev, category: undefined }));
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
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); }}
                placeholder="Nouvelle catégorie…"
                className="flex-1 border border-black/12 text-[11px] py-2 px-2.5 focus:outline-none focus:border-black bg-[#F7F7F7] font-serif"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-3 py-2 bg-black text-white text-[9px] uppercase tracking-widest font-serif hover:bg-black/80 transition-colors"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => { setShowAddCategory(false); setNewCategoryInput(""); }}
                className="p-2 text-black/30 hover:text-black transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-1.5 font-serif">
            Prix (DA) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            min={0}
            value={form.price || ""}
            onChange={(e) => setField("price", Number(e.target.value))}
            onBlur={() => blurValidate("price")}
            placeholder="0"
            className={`w-full border text-sm py-2.5 px-3 focus:outline-none transition-colors bg-[#F7F7F7] font-serif ${
              errors.price
                ? "border-red-300 focus:border-red-400"
                : "border-black/8 focus:border-black"
            }`}
          />
          {errors.price && (
            <p className="mt-1 text-[8px] text-red-400 font-serif">{errors.price}</p>
          )}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-2 font-serif">
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
