"use client";

import { useEffect, useRef } from "react";
import { X, Upload, ImagePlus, Palette, AlertCircle, Plus, Link2, Check } from "lucide-react";
import type { FieldErrors } from "./StepBasicInfo";
import type { VariantEntry } from "@/app/variables";

export type ExtraItem =
  | { kind: "existing"; url: string; color?: string }
  | { kind: "new"; file: File; preview: string; color?: string };

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

export interface StepImagesProps {
  mainPreview: string;
  errors: FieldErrors;
  mainInputRef: React.RefObject<HTMLInputElement | null>;
  extraInputRef: React.RefObject<HTMLInputElement | null>;
  extraItems: ExtraItem[];
  colorPickerIdx: number;
  setColorPickerIdx: (v: number) => void;
  handleMainImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleExtraImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeExtraImage: (i: number) => void;
  setImageColor: (i: number, color: string | undefined) => void;
  variants?: VariantEntry[];
}

// ── Picker isolé avec détection clic extérieur ──────────────────────────────
function ColorPicker({
  item,
  index,
  variantColors,
  onSelect,
  onClose,
}: {
  item: ExtraItem;
  index: number;
  variantColors: string[];
  onSelect: (i: number, color: string | undefined) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // délai pour ne pas capturer le clic qui a ouvert le picker
    const timer = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const hasVariantColors = variantColors.length > 0;

  return (
    <div
      ref={ref}
      className="absolute top-[calc(100%+6px)] left-0 z-50 bg-white border border-black/12 shadow-xl p-3 w-60"
      style={{ minWidth: "220px" }}
    >
      {/* Section variantes */}
      {hasVariantColors && (
        <>
          <p className="text-[7px] uppercase tracking-[0.3em] text-black/40 font-serif mb-2 flex items-center gap-1">
            <Link2 size={8} strokeWidth={2} />
            Variantes du produit
          </p>
          <div className="flex flex-col gap-1 mb-3">
            {variantColors.map((colorName) => {
              const hex = hexOf(colorName);
              const isSelected = item.color === colorName;
              return (
                <button
                  key={colorName}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(index, colorName);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 border text-[9px] font-serif transition-all w-full text-left ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-black/10 hover:border-black/40 hover:bg-black/3 text-black/70"
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="flex-1">{colorName}</span>
                  {isSelected && <Check size={10} strokeWidth={2.5} />}
                </button>
              );
            })}
          </div>
          <div className="h-px bg-black/8 mb-2.5" />
        </>
      )}

      {/* Presets */}
      <p className="text-[7px] uppercase tracking-[0.3em] text-black/30 font-serif mb-2">
        {hasVariantColors ? "Autre couleur" : "Choisir une couleur"}
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            title={c.name}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(index, c.name);
            }}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${
              item.color === c.name ? "border-black scale-110" : "border-black/10"
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      {item.color && (
        <>
          <div className="h-px bg-black/6 mb-2" />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(index, undefined);
            }}
            className="text-[8px] text-black/35 hover:text-red-500 font-serif transition-colors"
          >
            ✕ Retirer la couleur
          </button>
        </>
      )}
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────
export function StepImages({
  mainPreview, errors, mainInputRef, extraInputRef,
  extraItems, colorPickerIdx, setColorPickerIdx,
  handleMainImageChange, handleExtraImagesChange,
  removeExtraImage, setImageColor, variants = [],
}: StepImagesProps) {
  const variantColors    = variants.map((v) => v.color.trim()).filter(Boolean);
  const hasVariantColors = variantColors.length > 0;

  return (
    <div className="space-y-6">

      {/* Bandeau info variantes */}
      {hasVariantColors && (
        <div className="flex items-start gap-2.5 bg-[#F2F0ED] border border-black/8 px-4 py-3">
          <Link2 size={13} strokeWidth={1.5} className="text-black/40 shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] uppercase tracking-[0.25em] text-black/60 font-serif font-semibold mb-1">
              Images liées aux variantes
            </p>
            <p className="text-[8px] text-black/40 font-serif leading-relaxed">
              Variantes :{" "}
              <span className="font-semibold text-black/60">{variantColors.join(", ")}</span>.{" "}
              Cliquez sur <Palette size={9} className="inline" /> sous chaque image pour l'associer à une couleur.
            </p>
          </div>
        </div>
      )}

      {/* Image principale */}
      <div>
        <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 mb-3 font-serif">
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
            <p className="text-[9px] text-black/60 font-serif leading-relaxed">
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

      {/* Images supplémentaires */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-[8px] uppercase tracking-[0.3em] text-black/60 font-serif">
            Images supplémentaires
            {extraItems.length > 0 && (
              <span className="text-black/20 italic normal-case ml-1">({extraItems.length})</span>
            )}
          </label>
          <button
            type="button"
            onClick={() => extraInputRef.current?.click()}
            className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-black/60 hover:text-black border border-black/8 hover:border-black/30 px-3 py-1.5 font-serif transition-all"
          >
            <Plus size={10} strokeWidth={1.5} />
            Ajouter
          </button>
        </div>

        {extraItems.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {extraItems.map((item, i) => {
              const src          = item.kind === "existing" ? item.url : item.preview;
              const isPickerOpen = colorPickerIdx === i;

              return (
                <div
                  key={i}
                  className="relative shrink-0"
                  style={{ width: 80 }}
                >
                  {/* Card image */}
                  <div
                    className={`relative w-20 overflow-hidden border ${
                      hasVariantColors && !item.color
                        ? "border-amber-300"
                        : item.color
                        ? "border-black/25"
                        : "border-black/8"
                    }`}
                    style={{ height: 88 }}
                  >
                    <img src={src} alt={`extra-${i}`} className="w-full h-full object-cover" />

                    {/* Bouton supprimer */}
                    <button
                      type="button"
                      onClick={() => {
                        if (colorPickerIdx === i) setColorPickerIdx(-1);
                        removeExtraImage(i);
                      }}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-black p-0.5 z-10 transition-colors"
                    >
                      <X size={9} className="text-white" />
                    </button>

                    {/* Bouton palette — bas de l'image */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setColorPickerIdx(isPickerOpen ? -1 : i);
                      }}
                      className={`absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 py-1 transition-all ${
                        isPickerOpen
                          ? "bg-black/70"
                          : item.color
                          ? "bg-black/50 hover:bg-black/65"
                          : "bg-black/0 hover:bg-black/40"
                      }`}
                      title={item.color ? `Couleur : ${item.color}` : "Associer une couleur"}
                    >
                      {item.color ? (
                        <>
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-white/60 shrink-0"
                            style={{ backgroundColor: hexOf(item.color) }}
                          />
                          <span className="text-[7px] text-white font-serif drop-shadow truncate max-w-10">
                            {item.color}
                          </span>
                        </>
                      ) : (
                        <Palette size={11} className="text-white/70" strokeWidth={1.5} />
                      )}
                    </button>
                  </div>

                  {/* Picker couleur isolé */}
                  {isPickerOpen && (
                    <ColorPicker
                      item={item}
                      index={i}
                      variantColors={variantColors}
                      onSelect={(idx, color) => setImageColor(idx, color)}
                      onClose={() => setColorPickerIdx(-1)}
                    />
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

        {/* Récap couverture variantes */}
        {hasVariantColors && extraItems.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {variantColors.map((colorName) => {
              const covered = extraItems.some((it) => it.color === colorName);
              return (
                <div
                  key={colorName}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[8px] font-serif border ${
                    covered
                      ? "border-black/12 text-black/45 bg-black/2"
                      : "border-amber-300 text-amber-600 bg-amber-50"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: hexOf(colorName) }}
                  />
                  {colorName}
                  {covered
                    ? <Check size={9} strokeWidth={2.5} className="text-black/30 ml-0.5" />
                    : <span className="text-amber-400 ml-0.5">— manquante</span>
                  }
                </div>
              );
            })}
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
