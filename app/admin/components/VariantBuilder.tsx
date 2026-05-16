"use client";

import { useState } from "react";
import { X, Plus, AlertCircle, ChevronDown, ChevronsRight, Zap, Copy } from "lucide-react";
import type { VariantEntry } from "@/app/variables";

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

// Sizes auto-filled when adding a new color variant (clothing default)
const DEFAULT_AUTO_SIZES = new Set(["S", "M", "L", "XL"]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function totalVariantStock(v: VariantEntry) {
  return v.sizes.reduce((s, sz) => s + sz.stock, 0);
}

const norm = (s: string) => s.toLowerCase().trim();

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  variants: VariantEntry[];
  sizeOptions: string[];
  onChange: (variants: VariantEntry[]) => void;
}

export default function VariantBuilder({ variants, sizeOptions, onChange }: Props) {
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [autoOpen,     setAutoOpen]     = useState(false);
  const [autoStocks,   setAutoStocks]   = useState<Record<string, number>>({});
  const [bulkStock,    setBulkStock]    = useState(1);
  const [applied,      setApplied]      = useState(false);

  const autoSelected = sizeOptions.filter((s) => s in autoStocks);

  // ── Auto-fill helpers ─────────────────────────────────────────────────────

  const toggleAutoSize = (s: string) =>
    setAutoStocks((prev) => {
      if (s in prev) { const next = { ...prev }; delete next[s]; return next; }
      return { ...prev, [s]: bulkStock };
    });

  const updateAutoStock = (size: string, stock: number) =>
    setAutoStocks((prev) => ({ ...prev, [size]: Math.max(0, stock) }));

  const applyBulkToAll = () =>
    setAutoStocks((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, bulkStock]))
    );

  const applyAuto = () => {
    if (!autoSelected.length || !variants.length) return;
    onChange(
      variants.map((v) => ({
        ...v,
        sizes: autoSelected.map((name) => ({ name, stock: autoStocks[name] ?? 1 })),
      }))
    );
    setApplied(true);
    setTimeout(() => setApplied(false), 1500);
  };

  // ── Variant-level helpers ─────────────────────────────────────────────────

  const addVariant = () => {
    // Auto-fill clothing sizes (S/M/L/XL) — no-op for shoes (numeric sizes)
    const defaultSizes = sizeOptions
      .filter((s) => DEFAULT_AUTO_SIZES.has(s))
      .map((s) => ({ name: s, stock: 0 }));

    onChange([...variants, { color: "", sku: "", sizes: defaultSizes }]);
  };

  const removeVariant = (idx: number) =>
    onChange(variants.filter((_, i) => i !== idx));

  const duplicateVariant = (idx: number) => {
    const original = variants[idx];
    const newColor = original.color ? `${original.color} (copie)` : "";
    const duplicate: VariantEntry = { ...original, id: undefined, color: newColor };
    onChange([
      ...variants.slice(0, idx + 1),
      duplicate,
      ...variants.slice(idx + 1),
    ]);
  };

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

  const updateStock = (variantIdx: number, sizeName: string, stock: number) =>
    patchVariant(variantIdx, {
      sizes: variants[variantIdx].sizes.map((s) =>
        s.name === sizeName ? { ...s, stock: Math.max(0, stock) } : s
      ),
    });

  const updatePrice = (variantIdx: number, sizeName: string, price: number | undefined) =>
    patchVariant(variantIdx, {
      sizes: variants[variantIdx].sizes.map((s) =>
        s.name === sizeName ? { ...s, price } : s
      ),
    });

  const addCustomSize = (variantIdx: number) => {
    const raw = (customInputs[variantIdx] ?? "").trim();
    if (!raw) return;
    const v = variants[variantIdx];
    if (v.sizes.some((s) => s.name === raw)) return;
    patchVariant(variantIdx, { sizes: [...v.sizes, { name: raw, stock: 0 }] });
    setCustomInputs((prev) => ({ ...prev, [variantIdx]: "" }));
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* ══ AUTO-FILL PANEL ═══════════════════════════════════════════════════ */}
      <div className={`border transition-colors ${
        applied
          ? "border-black/30 bg-black/[0.02]"
          : autoOpen
          ? "border-black/15"
          : "border-dashed border-black/12"
      }`}>
        <button
          type="button"
          onClick={() => setAutoOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Zap size={11} strokeWidth={1.5} className={autoOpen ? "text-black" : "text-black/30"} />
            <span className={`text-[8px] uppercase tracking-[0.3em] font-serif ${autoOpen ? "text-black/60" : "text-black/35"}`}>
              Remplissage automatique
            </span>
            {autoSelected.length > 0 && (
              <span className="text-[7px] text-black/30 font-serif italic">
                — {autoSelected.join(", ")}
              </span>
            )}
          </div>
          <ChevronDown
            size={11}
            strokeWidth={1.5}
            className={`text-black/30 transition-transform duration-200 ${autoOpen ? "rotate-180" : ""}`}
          />
        </button>

        {autoOpen && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-black/7">

            {/* Step 1: sizes */}
            <div>
              <p className="text-[7px] uppercase tracking-[0.25em] text-black/30 font-serif mb-2">
                1 — Tailles à appliquer
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sizeOptions.map((s) => {
                  const isSelected = s in autoStocks;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleAutoSize(s)}
                      className={`px-2.5 py-1 text-[9px] uppercase tracking-widest border transition-all font-serif ${
                        isSelected
                          ? "bg-black text-white border-black"
                          : "bg-white text-black/60 border-black/10 hover:border-black/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: stock per size */}
            {autoSelected.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[7px] uppercase tracking-[0.25em] text-black/30 font-serif">
                    2 — Stock par taille
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] text-black/20 font-serif">Tout à</span>
                    <div className="flex items-center border border-black/10">
                      <button type="button" onClick={() => setBulkStock((n) => Math.max(0, n - 1))}
                        className="w-5 h-5 flex items-center justify-center text-black/30 hover:text-black transition-colors text-xs">−</button>
                      <input
                        type="number" min={0} value={bulkStock}
                        onChange={(e) => setBulkStock(Math.max(0, Number(e.target.value)))}
                        className="w-8 text-center text-[9px] font-serif border-x border-black/10 h-5 focus:outline-none bg-white"
                      />
                      <button type="button" onClick={() => setBulkStock((n) => n + 1)}
                        className="w-5 h-5 flex items-center justify-center text-black/30 hover:text-black transition-colors text-xs">+</button>
                    </div>
                    <button type="button" onClick={applyBulkToAll}
                      className="text-[7px] uppercase tracking-widest text-black/60 hover:text-black font-serif transition-colors border-b border-transparent hover:border-black/40">
                      ↵ ok
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {autoSelected.map((s) => (
                    <div key={s} className="flex items-center border border-black/8 bg-white">
                      <span className="text-[9px] uppercase tracking-widest text-black/50 font-serif px-2.5 w-10 shrink-0">{s}</span>
                      <div className="flex items-center flex-1 border-l border-black/8">
                        <button type="button" onClick={() => updateAutoStock(s, (autoStocks[s] ?? 1) - 1)}
                          className="w-6 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors text-sm">−</button>
                        <input
                          type="number" min={0} value={autoStocks[s] ?? 1}
                          onChange={(e) => updateAutoStock(s, Number(e.target.value))}
                          className="flex-1 text-center text-[10px] font-serif border-x border-black/8 h-7 focus:outline-none bg-white"
                        />
                        <button type="button" onClick={() => updateAutoStock(s, (autoStocks[s] ?? 1) + 1)}
                          className="w-6 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors text-sm">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={applyAuto}
              disabled={!autoSelected.length || !variants.length}
              className={`w-full py-2.5 text-[9px] uppercase tracking-widest font-serif flex items-center justify-center gap-2 transition-all ${
                applied
                  ? "bg-black/80 text-white"
                  : !autoSelected.length || !variants.length
                  ? "bg-black/8 text-black/25 cursor-not-allowed"
                  : "bg-black text-white hover:bg-black/80"
              }`}
            >
              <ChevronsRight size={12} strokeWidth={1.5} />
              {applied
                ? "Appliqué ✓"
                : `Appliquer à toutes les couleurs${variants.length ? ` (${variants.length})` : ""}`}
            </button>

            {variants.length === 0 && (
              <p className="text-[8px] text-black/20 font-serif italic text-center -mt-1">
                Ajoutez au moins une couleur pour utiliser le remplissage automatique.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ══ VARIANT LIST ══════════════════════════════════════════════════════ */}
      {variants.map((variant, idx) => {
        const colorNorm  = norm(variant.color);
        const isDuplicate =
          !!colorNorm &&
          variants.some((v, i) => i !== idx && norm(v.color) === colorNorm);

        const usedByOthers = new Set(
          variants
            .filter((_, i) => i !== idx)
            .map((v) => norm(v.color))
            .filter(Boolean)
        );

        return (
          <div
            key={idx}
            className={`border bg-[#FAFAFA] p-4 space-y-4 transition-colors ${
              isDuplicate ? "border-red-300 bg-red-50/20" : "border-black/10"
            }`}
          >
            {/* ── Color header ────────────────────────────────────────────── */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-1.5 font-serif">
                  Couleur <span className="text-black/50">*</span>
                </label>
                <input
                  value={variant.color}
                  onChange={(e) => patchVariant(idx, { color: e.target.value })}
                  placeholder="Ex: Rouge, Marine, Ivoire…"
                  className={`w-full border text-[11px] py-2 px-3 focus:outline-none bg-white font-serif transition-colors ${
                    isDuplicate
                      ? "border-red-400 focus:border-red-400"
                      : "border-black/12 focus:border-black"
                  }`}
                />

                {isDuplicate && (
                  <p className="flex items-center gap-1 mt-1 text-[8px] text-red-400 font-serif">
                    <AlertCircle size={10} className="shrink-0" />
                    Couleur déjà utilisée par une autre variante
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {PRESET_COLORS.map((c) => {
                    const isSelected = variant.color === c.name;
                    const isUsed     = usedByOthers.has(c.name.toLowerCase());
                    return (
                      <button
                        key={c.name}
                        type="button"
                        title={isUsed ? `${c.name} — déjà utilisé` : c.name}
                        onClick={() => patchVariant(idx, { color: c.name })}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          isSelected
                            ? "border-black scale-110"
                            : isUsed
                            ? "border-black/8 opacity-25 cursor-not-allowed"
                            : "border-black/10 hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* SKU */}
              <div className="w-36 shrink-0">
                <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-1.5 font-serif">
                  SKU <span className="text-black/25 italic normal-case">(opt.)</span>
                </label>
                <input
                  value={variant.sku ?? ""}
                  onChange={(e) => patchVariant(idx, { sku: e.target.value })}
                  placeholder="PROD-RED-001"
                  className="w-full border text-[10px] py-2 px-3 focus:outline-none focus:border-black bg-white font-serif border-black/12 transition-colors"
                />
              </div>

              {/* Duplicate + Delete */}
              <div className="flex flex-col gap-1 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => duplicateVariant(idx)}
                  title="Dupliquer cette couleur"
                  className="text-black/20 hover:text-black transition-colors"
                >
                  <Copy size={13} strokeWidth={1.5} />
                </button>
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  title="Supprimer cette couleur"
                  className="text-black/20 hover:text-red-500 transition-colors"
                >
                  <X size={13} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* ── Size selector ────────────────────────────────────────────── */}
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-2 font-serif">
                Tailles disponibles
              </label>

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
                          : "bg-white text-black/60 border-black/10 hover:border-black/30"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-2">
                <input
                  value={customInputs[idx] ?? ""}
                  onChange={(e) => setCustomInputs((prev) => ({ ...prev, [idx]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(idx); } }}
                  placeholder="Taille personnalisée…"
                  className="flex-1 border text-[10px] py-1.5 px-2.5 focus:outline-none focus:border-black bg-white font-serif border-black/12 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => addCustomSize(idx)}
                  className="px-3 py-1.5 border text-[9px] uppercase tracking-widest text-black/50 hover:text-black hover:border-black/30 font-serif border-black/12 transition-all flex items-center gap-1"
                >
                  <Plus size={10} strokeWidth={2} />
                  Ajouter
                </button>
              </div>
            </div>

            {/* ── Stock + price table ───────────────────────────────────────── */}
            {variant.sizes.length > 0 && (
              <div className="border border-black/8 divide-y divide-black/5">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-1.5 bg-[#F2F0ED]">
                  <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif">Taille</span>
                  <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif w-24 text-center">Stock</span>
                  <span className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif w-24 text-center">Prix (DA)</span>
                  <span className="w-5" />
                </div>

                {variant.sizes.map(({ name, stock, price }) => (
                  <div key={name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2">
                    <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif truncate">{name}</span>

                    <div className="flex items-center w-24">
                      <button type="button" onClick={() => updateStock(idx, name, stock - 1)}
                        className="w-6 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors text-sm">−</button>
                      <input type="number" min={0} value={stock}
                        onChange={(e) => updateStock(idx, name, Number(e.target.value))}
                        className="w-10 text-center text-[10px] font-serif border-x border-black/8 py-1 focus:outline-none bg-white" />
                      <button type="button" onClick={() => updateStock(idx, name, stock + 1)}
                        className="w-6 h-7 flex items-center justify-center text-black/30 hover:text-black transition-colors text-sm">+</button>
                    </div>

                    <input
                      type="number" min={0} value={price ?? ""}
                      onChange={(e) => updatePrice(idx, name, e.target.value === "" ? undefined : Number(e.target.value))}
                      placeholder="Base"
                      className="w-24 text-center text-[10px] font-serif border border-black/8 py-1 px-2 focus:outline-none bg-white focus:border-black transition-colors"
                    />

                    <button type="button" onClick={() => toggleSize(idx, name)}
                      className="text-black/20 hover:text-red-400 transition-colors">
                      <X size={10} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}

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
        );
      })}

      {/* Add color button */}
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
