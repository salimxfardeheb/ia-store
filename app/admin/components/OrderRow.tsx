import { useEffect, useState } from "react";
import { formatDate, Order, OrderStatus, STATUS_CONFIG, STATUS_FLOW } from "@/app/variables";
import { getAllowedTransitions } from "@/lib/orderStatus";
import { reportRefusal } from "@/services/admin";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

const REFUSAL_REASONS = [
  "Client absent",
  "Client a changé d'avis",
  "Client a refusé sans motif",
  "Autre",
] as const;

export function OrderRow({
  order,
  onStatusChange,
}: {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [showRefusalModal, setShowRefusalModal] = useState(false);
  const [refusalReason, setRefusalReason] = useState<string>(REFUSAL_REASONS[0]);
  const [reportingRefusal, setReportingRefusal] = useState(false);
  const [refusalReported, setRefusalReported] = useState(false);
  const [refusalError, setRefusalError] = useState<string | null>(null);
  const [refusalToast, setRefusalToast] = useState<string | null>(null);

  useEffect(() => {
    if (!refusalToast) return;
    const t = setTimeout(() => setRefusalToast(null), 3000);
    return () => clearTimeout(t);
  }, [refusalToast]);

  const cfg = STATUS_CONFIG[order.status];
  const allowedTransitions = getAllowedTransitions(order.status);

  const handleStatus = async (status: OrderStatus) => {
    setChangingStatus(true);
    setStatusError(null);
    try {
      await onStatusChange(order.id, status);
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Transition invalide");
    } finally {
      setChangingStatus(false);
    }
  };

  const handleReportRefusal = async () => {
    setReportingRefusal(true);
    setRefusalError(null);
    try {
      await reportRefusal(order.id, refusalReason);
      setRefusalReported(true);
      setShowRefusalModal(false);
      setRefusalToast("Signalement envoyé à Flowmerce");
    } catch (err) {
      setRefusalError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setReportingRefusal(false);
    }
  };

  const canReportRefusal = order.status === "delivered" || order.status === "returned";

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-[rgba(0,0,0,0.08)] bg-white"
      >
        {/* Row principale */}
        <div
          className="grid grid-cols-12 items-center px-5 py-4 cursor-pointer hover:bg-black/1.5 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Réf */}
          <div className="col-span-3">
            <p className="text-[12px] uppercase tracking-[0.25em] text-black/30 font-serif mb-0.5">
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-[14px] font-serif text-black">{order.form.name}</p>
            <p className="text-[13px] text-black/30 font-serif">{order.form.phone}</p>
          </div>

          {/* Wilaya */}
          <div className="col-span-2">
            <p className="text-[13px] font-serif text-black/70">
              {order.form.city ?? (order.channel === "offline" ? "Vente magasin" : "—")}
            </p>
            <p className="text-[12px] text-black/30 font-serif capitalize">
              {order.form.deliveryType === "home"
                ? "À domicile"
                : order.form.deliveryType === "store"
                ? "Magasin"
                : "Bureau"}
            </p>
          </div>

          {/* Articles */}
          <div className="col-span-2">
            <div className="flex -space-x-2 mb-1.5">
              {order.items.slice(0, 3).map((item, i) => (
                <div key={i} className="w-9 h-11 border border-white bg-[#f5f5f5] overflow-hidden shrink-0">
                  <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="w-9 h-11 border border-white bg-black/5 flex items-center justify-center">
                  <span className="text-[8px] font-serif text-black/60">+{order.items.length - 3}</span>
                </div>
              )}
            </div>
            <div className="space-y-0.5">
              {order.items.slice(0, 2).map((item, i) => (
                <p key={i} className="text-[12px] text-black/50 font-serif leading-tight truncate max-w-32">
                  {item.quantity}× {item.name}
                  {item.selectedColor && <span className="text-black/30"> · {item.selectedColor}</span>}
                  {item.selectedSize  && <span className="text-black/30"> · {item.selectedSize}</span>}
                </p>
              ))}
              {order.items.length > 2 && (
                <p className="text-[12px] text-black/30 font-serif italic">
                  +{order.items.length - 2} autre{order.items.length - 2 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {/* Total */}
          <div className="col-span-2">
            <p className="font-serif italic text-base">{order.total.toLocaleString("fr-FR")} DA</p>
            <p className="text-[13px] text-black/30 font-serif uppercase tracking-widest">
              {order.form.paymentMethod === "cash" ? "Cash" : "Carte"}
            </p>
          </div>

          {/* Status */}
          <div className="col-span-2 flex items-center justify-between">
            <span className={`text-[12px] uppercase tracking-widest px-2.5 py-1 font-serif ${cfg.color} ${cfg.bg}`}>
              {cfg.label}
            </span>
            <div className="flex items-center gap-2 text-black/20">
              <span className="text-[12px] font-serif">{formatDate(order.createdAt)}</span>
              {expanded
                ? <ChevronUp size={12} strokeWidth={1.5} />
                : <ChevronDown size={12} strokeWidth={1.5} />
              }
            </div>
          </div>
        </div>

        {/* Détail expandé */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[rgba(0,0,0,0.06)]"
            >
              <div className="px-5 py-6 grid grid-cols-2 gap-8">

                {/* Articles */}
                <div>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-serif mb-4">
                    Articles commandés
                  </p>
                  <div className="space-y-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 border border-[rgba(0,0,0,0.06)] p-2.5">
                        <div className="w-14 h-16 bg-[#f5f5f5] overflow-hidden shrink-0">
                          <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="grow min-w-0">
                          <p className="font-serif text-[12px] italic text-black leading-snug truncate">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-black/30 uppercase tracking-widest mt-0.5">
                            {item.category}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {item.selectedColor && (
                              <span className="text-[9px] uppercase tracking-widest border border-black/15 px-1.5 py-0.5 font-serif text-black/60">
                                {item.selectedColor}
                              </span>
                            )}
                            {item.selectedSize && (
                              <span className="text-[9px] uppercase tracking-widest border border-black/15 px-1.5 py-0.5 font-serif text-black/60">
                                Taille {item.selectedSize}
                              </span>
                            )}
                            <span className="text-[9px] text-black/60 font-serif">
                              × {item.quantity}
                            </span>
                            <span className="text-[9px] text-black/30 font-serif">
                              ({item.price.toLocaleString("fr-FR")} DA / u)
                            </span>
                          </div>
                        </div>
                        <span className="font-serif text-[12px] italic shrink-0 text-black">
                          {(item.price * item.quantity).toLocaleString("fr-FR")} DA
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)] flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-[0.25em] text-black/30 font-serif">
                      Total commande
                    </span>
                    <span className="font-serif italic text-sm text-black">
                      {order.total.toLocaleString("fr-FR")} DA
                    </span>
                  </div>
                </div>

                {/* Adresse + changer statut */}
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-serif mb-3">
                      {order.channel === "offline" ? "Contact (vente magasin)" : "Adresse de livraison"}
                    </p>
                    <p className="font-serif text-[11px] text-black">{order.form.name}</p>
                    {order.form.address && (
                      <p className="font-serif text-[11px] text-black/50">{order.form.address}</p>
                    )}
                    {(order.form.postalCode || order.form.city) && (
                      <p className="font-serif text-[11px] text-black/50">
                        {[order.form.postalCode, order.form.city].filter(Boolean).join(" — ")}
                      </p>
                    )}
                    <p className="font-serif text-[11px] text-black/50 mt-1">{order.form.phone}</p>
                  </div>

                  {/* Changer le statut */}
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-serif mb-3">
                      Changer le statut
                    </p>
                    <div className="mb-3">
                      <span className={`px-3 py-1.5 text-[9px] uppercase tracking-widest font-serif border-transparent ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {allowedTransitions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allowedTransitions.map((s) => {
                          const c = STATUS_CONFIG[s];
                          return (
                            <button
                            type="button"
                              key={s}
                              disabled={changingStatus}
                              onClick={(e) => { e.stopPropagation(); handleStatus(s); }}
                              className="px-3 py-1.5 text-[9px] uppercase tracking-widest font-serif transition-all border border-black/8 text-black/60 hover:border-black/30 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              → {c.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[9px] text-black/30 font-serif italic">
                        État final — aucune modification possible
                      </p>
                    )}
                    {statusError && (
                      <p className="mt-2 text-[9px] text-red-500 font-serif">
                        {statusError}
                      </p>
                    )}
                  </div>

                  {/* Signaler refus livraison */}
                  {canReportRefusal && (
                    <div className="pt-4 border-t border-[rgba(0,0,0,0.06)]">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-black/30 font-serif mb-3">
                        Signalement Flowmerce
                      </p>
                      {refusalReported ? (
                        <p className="text-[9px] text-emerald-600 font-serif">
                          ✓ Refus signalé
                        </p>
                      ) : (
                        <button
                        type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRefusalReason(REFUSAL_REASONS[0]);
                            setRefusalError(null);
                            setShowRefusalModal(true);
                          }}
                          className="text-[9px] uppercase tracking-widest font-serif border border-orange-200 text-orange-600 hover:border-orange-400 hover:bg-orange-50 px-3 py-1.5 transition-all"
                        >
                          Signaler refus livraison
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal confirmation */}
      {showRefusalModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowRefusalModal(false)}
        >
          <div
            className="bg-white p-8 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] uppercase tracking-[0.3em] text-black/60 font-serif mb-6">
              Signaler un refus de livraison
            </p>

            <div className="mb-4">
              <label className="text-[9px] uppercase tracking-widest text-black/60 font-serif block mb-2">
                Raison
              </label>
              <select
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                className="w-full border border-[rgba(0,0,0,0.12)] text-[11px] font-serif py-2 px-3 bg-white focus:outline-none focus:border-black transition-colors"
              >
                {REFUSAL_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <p className="text-[10px] font-serif text-black/60 mb-6">
              Cette action signalera le client à Flowmerce et mettra à jour son score de confiance.
            </p>

            {refusalError && (
              <p className="text-[9px] text-red-500 font-serif mb-4">{refusalError}</p>
            )}

            <div className="flex gap-3">
              <button
              type="button"
                onClick={() => setShowRefusalModal(false)}
                disabled={reportingRefusal}
                className="flex-1 text-[9px] uppercase tracking-widest font-serif border border-black/10 text-black/60 hover:border-black/30 py-2.5 transition-all disabled:opacity-50"
              >
                Annuler
              </button>
              <button
              type="button"
                onClick={handleReportRefusal}
                disabled={reportingRefusal}
                className="flex-1 text-[9px] uppercase tracking-widest font-serif bg-black text-white hover:bg-black/80 py-2.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportingRefusal ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {refusalToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white text-[10px] font-serif px-4 py-3 tracking-widest">
          {refusalToast}
        </div>
      )}
    </>
  );
}
