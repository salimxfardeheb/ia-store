import { motion } from "framer-motion";
import { AlertTriangle, X, CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { ReclamationForm } from "../variables";

const RECLAMATION_TYPES = [
  "Produit non reçu",
  "Produit endommagé",
  "Produit ne correspond pas à la description",
  "Produit défectueux",
  "Mauvaise quantité reçue",
  "Autre",
];

// ── Reclamation Modal ──────────────────────────────────────────────────────
export function ReclamationModal({
  initial,
  onClose,
}: {
  initial: { orderId: string; productName: string };
  onClose: () => void;
}) {
  const [form, setForm] = useState<ReclamationForm>({
    orderId: initial.orderId,
    productName: initial.productName,
    type: "",
    description: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.type || !form.description.trim()) return;
    setSending(true);
    // TODO: replace with real Firestore / email submit
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
        className="bg-white w-full max-w-lg max-h-[92vh] overflow-y-auto"
      >
        {/* Modal header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-5 border-b border-black/8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                size={14}
                strokeWidth={1.5}
                className="text-red-400"
              />
              <span className="text-[9px] uppercase tracking-[0.3em] text-black/40">
                Réclamation produit
              </span>
            </div>
            <h2 className="font-serif text-xl italic text-black/80">
              Signaler un problème
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-black/20 hover:text-black/60 transition-colors mt-1"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {submitted ? (
          // ── Success state ──
          <div className="px-6 py-12 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <CheckCircle2
                size={40}
                strokeWidth={1}
                className="text-emerald-500 mx-auto mb-4"
              />
              <h3 className="font-serif italic text-lg text-black/70 mb-2">
                Réclamation envoyée
              </h3>
              <p className="text-[11px] text-black/40 leading-relaxed max-w-xs mx-auto">
                Votre signalement a bien été enregistré. Notre équipe vous
                contactera dans les 48h.
              </p>
              <button
                onClick={onClose}
                className="mt-8 text-[10px] uppercase tracking-[0.25em] text-black/40 hover:text-black border border-black/10 hover:border-black/30 px-6 py-2.5 transition-colors"
              >
                Fermer
              </button>
            </motion.div>
          </div>
        ) : (
          // ── Form ──
          <div className="px-6 pt-5 pb-6 space-y-5">
            {/* Context info (read-only) */}
            <div className="bg-[#F7F6F3] px-4 py-3 space-y-1">
              <div className="flex justify-between">
                <span className="text-[8px] uppercase tracking-[0.25em] text-black/30">
                  Commande
                </span>
                <span className="font-serif text-xs text-black/60">
                  {form.orderId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[8px] uppercase tracking-[0.25em] text-black/30">
                  Produit
                </span>
                <span className="font-serif text-xs text-black/60 text-right max-w-[55%]">
                  {form.productName}
                </span>
              </div>
            </div>

            {/* Type de problème */}
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">
                Type de problème <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {RECLAMATION_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, type: t })}
                    className={`text-left px-3 py-2.5 border text-xs font-serif transition-colors ${
                      form.type === t
                        ? "border-black bg-black text-white"
                        : "border-black/10 text-black/60 hover:border-black/30"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[8px] uppercase tracking-[0.3em] text-black/40 mb-2 font-serif">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Décrivez le problème rencontré avec ce produit..."
                className="w-full border border-black/10 text-sm py-3 px-3 bg-[#F7F7F7] font-serif focus:outline-none focus:border-black transition-colors resize-none text-black/70 placeholder:text-black/20"
              />
              <p className="text-[8px] text-black/25 mt-1 text-right">
                {form.description.length}/500
              </p>
            </div>

            {/* Submit */}
            <motion.button
              onClick={handleSubmit}
              disabled={sending || !form.type || !form.description.trim()}
              animate={{
                opacity:
                  sending || !form.type || !form.description.trim() ? 0.45 : 1,
              }}
              className="w-full bg-black text-white py-4 text-[10px] uppercase tracking-[0.25em] font-bold flex items-center justify-center gap-2.5 hover:bg-black/80 transition-all disabled:cursor-not-allowed"
            >
              {sending ? (
                <span>Envoi en cours...</span>
              ) : (
                <>
                  <Send size={13} strokeWidth={2} />
                  <span>Envoyer la réclamation</span>
                </>
              )}
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}