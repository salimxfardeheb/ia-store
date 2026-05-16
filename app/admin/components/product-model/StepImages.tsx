"use client";

import { X, Upload, ImagePlus, Palette, AlertCircle, Plus } from "lucide-react";
import type { FieldErrors } from "./StepBasicInfo";

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
}

export function StepImages({
  mainPreview, errors, mainInputRef, extraInputRef,
  extraItems, colorPickerIdx, setColorPickerIdx,
  handleMainImageChange, handleExtraImagesChange,
  removeExtraImage, setImageColor,
}: StepImagesProps) {
  return (
    <div className="space-y-6">
      {/* Main image */}
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

      {/* Extra images */}
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
            onClick={(e) => { e.stopPropagation(); extraInputRef.current?.click(); }}
            className="flex items-center gap-1.5 text-[8px] uppercase tracking-widest text-black/60 hover:text-black border border-black/8 hover:border-black/30 px-3 py-1.5 font-serif transition-all"
          >
            <Plus size={10} strokeWidth={1.5} />
            Ajouter
          </button>
        </div>

        {extraItems.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {extraItems.map((item, i) => {
              const src          = item.kind === "existing" ? item.url : item.preview;
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
