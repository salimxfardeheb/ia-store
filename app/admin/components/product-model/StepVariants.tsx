"use client";

import { X, Layers } from "lucide-react";
import { Product, VariantEntry } from "@/app/variables";
import VariantBuilder from "@/app/admin/components/VariantBuilder";

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

function totalVariantsStock(variants: VariantEntry[]) {
  return variants.reduce((sum, v) => sum + v.sizes.reduce((s, sz) => s + sz.stock, 0), 0);
}

export interface StepVariantsProps {
  form: Product;
  useVariants: boolean;
  setUseVariants: (v: boolean) => void;
  quickFill: boolean;
  setQuickFill: (v: boolean) => void;
  quickColors: string[];
  setQuickColors: React.Dispatch<React.SetStateAction<string[]>>;
  quickSizes: string[];
  setQuickSizes: React.Dispatch<React.SetStateAction<string[]>>;
  quickQty: Record<string, number>;
  setQuickQty: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  sizeOptions: string[];
  computedStock: number;
  toggleSize: (size: string) => void;
  updateQuantity: (size: string, qty: number) => void;
  setForm: React.Dispatch<React.SetStateAction<Product>>;
}

export function StepVariants({
  form, useVariants, setUseVariants, quickFill, setQuickFill,
  quickColors, setQuickColors, quickSizes, setQuickSizes,
  quickQty, setQuickQty, sizeOptions, computedStock,
  toggleSize, updateQuantity, setForm,
}: StepVariantsProps) {
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
          onClick={() => { setUseVariants(false); setForm((f) => ({ ...f, variants: [], stock: 0 })); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] uppercase tracking-widest font-serif transition-all ${
            !useVariants ? "bg-black text-white" : "text-black/35 hover:text-black hover:bg-black/3"
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
            useVariants ? "bg-black text-white" : "text-black/35 hover:text-black hover:bg-black/3"
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
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all font-serif ${
                    isSelected ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/10 hover:border-black/30"
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
                    <button type="button" onClick={() => updateQuantity(size, quantity - 1)} className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors">−</button>
                    <input
                      type="number" min={0} value={quantity}
                      onChange={(e) => updateQuantity(size, Number(e.target.value))}
                      className="w-14 text-center text-[11px] font-serif border-x border-black/8 py-1.5 focus:outline-none bg-[#F7F7F7] focus:bg-white transition-colors"
                    />
                    <button type="button" onClick={() => updateQuantity(size, quantity + 1)} className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors">+</button>
                  </div>
                  <button type="button" onClick={() => toggleSize(size)} className="text-black/20 hover:text-red-400 transition-colors ml-1">
                    <X size={11} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 bg-[#F7F7F7]">
                <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 font-serif">Total</span>
                <span className="text-[11px] font-serif text-black italic">{computedStock} unité{computedStock !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          {form.sizes.length === 0 && (
            <p className="text-[9px] text-black/20 font-serif italic">Sélectionnez les tailles disponibles ci-dessus.</p>
          )}
        </div>
      )}

      {/* Quick-fill */}
      {useVariants && quickFill && (
        <div className="space-y-5">
          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-black/60 mb-2 font-serif">Couleurs</p>
            <div className="p-3 border border-black/8 bg-[#F7F7F7] space-y-2">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => {
                  const isSelected = quickColors.includes(c.name);
                  return (
                    <button
                      key={c.name} type="button" title={c.name}
                      onClick={() => setQuickColors((prev) => isSelected ? prev.filter((x) => x !== c.name) : [...prev, c.name])}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${isSelected ? "border-black scale-110 shadow-sm" : "border-black/10 hover:scale-105"}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  );
                })}
              </div>
              {quickColors.length > 0 && (
                <p className="text-[8px] text-black/60 font-serif italic">{quickColors.join(", ")}</p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[8px] uppercase tracking-[0.3em] text-black/60 mb-2 font-serif">Tailles</p>
            <div className="p-3 border border-black/8 bg-[#F7F7F7]">
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((s) => {
                  const isSelected = quickSizes.includes(s);
                  return (
                    <button key={s} type="button"
                      onClick={() => {
                        setQuickSizes((prev) => isSelected ? prev.filter((x) => x !== s) : [...prev, s]);
                        if (isSelected) {
                          setQuickQty((prev) => { const next = { ...prev }; delete next[s]; return next; });
                        } else {
                          setQuickQty((prev) => ({ ...prev, [s]: 1 }));
                        }
                      }}
                      className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all font-serif ${isSelected ? "bg-black text-white border-black" : "bg-white text-black/60 border-black/10 hover:border-black/30"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {quickSizes.length > 0 && (
            <div>
              <p className="text-[8px] uppercase tracking-[0.3em] text-black/60 mb-2 font-serif">Quantité des tailles</p>
              <div className="border border-black/8 divide-y divide-black/5">
                {quickSizes.map((s) => {
                  const qty = quickQty[s] ?? 0;
                  return (
                    <div key={s} className="grid grid-cols-[1fr_auto] items-center px-3 py-2">
                      <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif">{s}</span>
                      <div className="flex items-center w-32">
                        <button type="button" onClick={() => setQuickQty((prev) => ({ ...prev, [s]: Math.max(0, (prev[s] ?? 0) - 1) }))} className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors">−</button>
                        <input
                          type="number" min={0} value={qty}
                          onChange={(e) => setQuickQty((prev) => ({ ...prev, [s]: Math.max(0, Number(e.target.value)) }))}
                          className="w-14 text-center text-[11px] font-serif border-x border-black/8 py-1.5 focus:outline-none bg-[#F7F7F7] focus:bg-white transition-colors"
                        />
                        <button type="button" onClick={() => setQuickQty((prev) => ({ ...prev, [s]: (prev[s] ?? 0) + 1 }))} className="w-7 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button" onClick={applyQuickFill} disabled={!canValidateQuick}
              className={`flex-1 py-2.5 text-[9px] uppercase tracking-widest font-serif transition-all ${canValidateQuick ? "bg-black text-white hover:bg-black/80" : "bg-black/8 text-black/25 cursor-not-allowed"}`}
            >
              {canValidateQuick ? `Appliquer à ${quickColors.length} couleur${quickColors.length > 1 ? "s" : ""}` : "Valider"}
            </button>
            <button
              type="button" onClick={() => setQuickFill(false)}
              className="px-4 py-2.5 border text-[9px] uppercase tracking-widest text-black/60 hover:text-black hover:border-black/30 transition-all font-serif border-black/10"
            >
              Saisir manuellement
            </button>
          </div>
        </div>
      )}

      {/* Manual VariantBuilder */}
      {useVariants && !quickFill && (
        <div className="space-y-3">
          {(form.variants?.length ?? 0) > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-[8px] text-black/30 font-serif italic">
                {form.variants!.length} couleur{form.variants!.length > 1 ? "s" : ""} — {computedStock} unités totales
              </p>
              <button
                type="button"
                onClick={() => { setQuickColors([]); setQuickSizes([]); setQuickQty({}); setQuickFill(true); }}
                className="text-[8px] uppercase tracking-widest text-black/30 hover:text-black font-serif transition-colors border-b border-transparent hover:border-black/30"
              >
                ↺ Recommencer
              </button>
            </div>
          )}
          <VariantBuilder
            variants={form.variants ?? []}
            sizeOptions={sizeOptions}
            onChange={(variants) => setForm((f) => ({ ...f, variants, stock: totalVariantsStock(variants) }))}
          />
        </div>
      )}
    </div>
  );
}
