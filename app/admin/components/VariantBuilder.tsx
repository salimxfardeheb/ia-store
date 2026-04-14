"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import type { VariantEntry } from "@/app/variables";

// ─── Couleurs prédéfinies ─────────────────────────────────────────────────────

const PRESET_COLORS: { name: string; hex: string }[] = [
  { name: "Noir",    hex: "#0A0A0A" },
  { name: "Blanc",   hex: "#FFFFFF" },
  { name: "Gris",    hex: "#6B7280" },
  { name: "Beige",   hex: "#D2B48C" },
  { name: "Marine",  hex: "#1E3A5F" },
  { name: "Bleu",    hex: "#3B82F6" },
  { name: "Rouge",   hex: "#EF4444" },
  { name: "Rose",    hex: "#EC4899" },
  { name: "Orange",  hex: "#F97316" },
  { name: "Jaune",   hex: "#EAB308" },
  { name: "Vert",    hex: "#22C55E" },
  { name: "Violet",  hex: "#A855F7" },
  { name: "Marron",  hex: "#92400E" },
  { name: "Bordeaux",hex: "#881337" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalVariantStock(v: VariantEntry) {
  return v.sizes.reduce((s, sz) => s + sz.stock, 0);
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface Props {
  variants: VariantEntry[];
  sizeOptions: string[];
  onChange: (variants: VariantEntry[]) => void;
}

export default function VariantBuilder({ variants, sizeOptions, onChange }: Props) {
  // Input "taille personnalisée" par variante (index → valeur)
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});

  // ── Variant-level helpers ─────────────────────────────────────────────────

  const addVariant = () =>
    onChange([...variants, { color: "", sku: "", sizes: [] }]);

  const removeVariant = (idx: number) =>
    onChange(variants.filter((_, i) => i !== idx));

  const patchVariant = (idx: number, patch: Partial<VariantEntry>) =>
    onChange(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  // ── Size-level helpers ────────────────────────────────────────────────────

  const toggleSize = (variantIdx: number, sizeName: string) => {
    const v = variants[variantIdx];
    const exists = v.sizes.some((s) => s.name === sizeName);
    const sizes = exists
      ? v.sizes.filter((s) => s.name !== sizeName)
      : [...v.sizes, { name: sizeName, stock: 0 }];
    patchVariant(variantIdx, { sizes });
  };

  const updateStock = (variantIdx: number, sizeName: string, stock: number) => {
    const v = variants[variantIdx];
    patchVariant(variantIdx, {
      sizes: v.sizes.map((s) =>
        s.name === sizeName ? { ...s, stock: Math.max(0, stock) } : s,
      ),
    });
  };

  const updatePrice = (variantIdx: number, sizeName: string, price: number | undefined) => {
    const v = variants[variantIdx];
    patchVariant(variantIdx, {
      sizes: v.sizes.map((s) =>
        s.name === sizeName ? { ...s, price } : s,
      ),
    });
  };

  const addCustomSize = (variantIdx: number) => {
    const raw = (customInputs[variantIdx] ?? "").trim();
    if (!raw) return;
    const v = variants[variantIdx];
    if (v.sizes.some((s) => s.name === raw)) return; // doublon
    patchVariant(variantIdx, { sizes: [...v.sizes, { name: raw, stock: 0 }] });
    setCustomInputs((prev) => ({ ...prev, [variantIdx]: "" }));
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {variants.map((variant, idx) => (
        <div
          key={idx}
          className="border border-[rgba(0,0,0,0.1)] bg-[#FAFAFA] p-4 space-y-4"
        >
          {/* ── En-tête couleur ───────────────────────────────────────────── */}
          <div className="flex items-start gap-3">
            {/* Champ couleur libre */}
            <div className="flex-1 min-w-0">
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                Couleur <span className="text-black/50">*</span>
              </label>
              <input
                value={variant.color}
                onChange={(e) => patchVariant(idx, { color: e.target.value })}
                placeholder="Ex: Rouge, Marine, Ivoire…"
                className="w-full border text-[11px] py-2 px-3 focus:outline-none focus:border-black bg-white font-serif border-[rgba(0,0,0,0.12)] transition-colors"
              />

              {/* Pastilles de couleurs prédéfinies */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    onClick={() => patchVariant(idx, { color: c.name })}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      variant.color === c.name
                        ? "border-black scale-110"
                        : "border-[rgba(0,0,0,0.1)] hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* SKU optionnel */}
            <div className="w-36 shrink-0">
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-1.5 font-serif">
                SKU <span className="text-black/25 italic normal-case">(opt.)</span>
              </label>
              <input
                value={variant.sku ?? ""}
                onChange={(e) => patchVariant(idx, { sku: e.target.value })}
                placeholder="PROD-RED-001"
                className="w-full border text-[10px] py-2 px-3 focus:outline-none focus:border-black bg-white font-serif border-[rgba(0,0,0,0.12)] transition-colors"
              />
            </div>

            {/* Supprimer variante */}
            <button
              type="button"
              onClick={() => removeVariant(idx)}
              title="Supprimer cette couleur"
              className="mt-6 text-black/20 hover:text-black transition-colors shrink-0"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>

          {/* ── Sélection des tailles ──────────────────────────────────────── */}
          <div>
            <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">
              Tailles disponibles
            </label>

            {/* Tailles prédéfinies */}
            <div className="flex flex-wrap gap-1.5">
              {sizeOptions.map((s) => {
                const isSelected = variant.sizes.some((vs) => vs.name === s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSize(idx, s)}
                    className={`px-2.5 py-1 text-[9px] uppercase tracking-widest border transition-all font-serif ${
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

            {/* Taille personnalisée */}
            <div className="flex gap-2 mt-2">
              <input
                value={customInputs[idx] ?? ""}
                onChange={(e) =>
                  setCustomInputs((prev) => ({ ...prev, [idx]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addCustomSize(idx); }
                }}
                placeholder="Taille personnalisée…"
                className="flex-1 border text-[10px] py-1.5 px-2.5 focus:outline-none focus:border-black bg-white font-serif border-[rgba(0,0,0,0.12)] transition-colors"
              />
              <button
                type="button"
                onClick={() => addCustomSize(idx)}
                className="px-3 py-1.5 border text-[9px] uppercase tracking-widest text-black/50 hover:text-black hover:border-black/30 font-serif border-[rgba(0,0,0,0.12)] transition-all flex items-center gap-1"
              >
                <Plus size={10} strokeWidth={2} />
                Ajouter
              </button>
            </div>
          </div>

          {/* ── Stocks (+ prix optionnel) par taille ──────────────────────── */}
          {variant.sizes.length > 0 && (
            <div className="border border-[rgba(0,0,0,0.08)] divide-y divide-[rgba(0,0,0,0.05)]">
              {/* En-têtes */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 bg-[#F2F0ED]">
                <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif">Taille</span>
                <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif w-24 text-center">Stock</span>
                <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif w-24 text-center">Prix (DA)</span>
                <span className="w-5" />
              </div>

              {variant.sizes.map(({ name, stock, price }) => (
                <div
                  key={name}
                  className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2"
                >
                  {/* Nom taille */}
                  <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif truncate">
                    {name}
                  </span>

                  {/* Stock +/- */}
                  <div className="flex items-center w-24">
                    <button
                      type="button"
                      onClick={() => updateStock(idx, name, stock - 1)}
                      className="w-6 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors text-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => updateStock(idx, name, Number(e.target.value))}
                      className="w-10 text-center text-[10px] font-serif border-x border-[rgba(0,0,0,0.08)] py-1 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => updateStock(idx, name, stock + 1)}
                      className="w-6 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Prix optionnel */}
                  <input
                    type="number"
                    min={0}
                    value={price ?? ""}
                    onChange={(e) =>
                      updatePrice(
                        idx,
                        name,
                        e.target.value === "" ? undefined : Number(e.target.value),
                      )
                    }
                    placeholder="Base"
                    className="w-24 text-center text-[10px] font-serif border border-[rgba(0,0,0,0.08)] py-1 px-2 focus:outline-none bg-white focus:border-black transition-colors"
                  />

                  {/* Supprimer taille */}
                  <button
                    type="button"
                    onClick={() => toggleSize(idx, name)}
                    className="text-black/20 hover:text-black transition-colors"
                  >
                    <X size={10} strokeWidth={1.5} />
                  </button>
                </div>
              ))}

              {/* Total stock pour cette couleur */}
              <div className="flex items-center justify-between px-3 py-2 bg-[#F7F7F7]">
                <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 font-serif">
                  Stock — {variant.color || "couleur"}
                </span>
                <span className="text-[10px] font-serif text-black italic">
                  {totalVariantStock(variant)} unité{totalVariantStock(variant) !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {variant.sizes.length === 0 && (
            <p className="text-[9px] text-black/20 font-serif italic">
              Sélectionnez les tailles disponibles pour cette couleur.
            </p>
          )}
        </div>
      ))}

      {/* Bouton ajouter couleur */}
      <button
        type="button"
        onClick={addVariant}
        className="w-full py-3 border-2 border-dashed border-black/10 hover:border-black/25 text-[9px] uppercase tracking-widest text-black/35 hover:text-black font-serif flex items-center justify-center gap-2 transition-all"
      >
        <Plus size={12} strokeWidth={1.5} />
        Ajouter une couleur
      </button>
    </div>
  );
}
