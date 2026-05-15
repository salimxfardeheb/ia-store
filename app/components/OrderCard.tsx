import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronUp, ChevronDown, AlertTriangle, Clock, CheckCircle2, Truck, XCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Order, OrderStatus } from "../variables";

export const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: React.ReactNode; color: string; dot: string }
> = {
  pending: {
    label: "En attente",
    icon: <Clock size={13} strokeWidth={1.5} />,
    color: "text-amber-600",
    dot: "bg-amber-400",
  },
  confirmed: {
    label: "Confirmée",
    icon: <CheckCircle2 size={13} strokeWidth={1.5} />,
    color: "text-blue-600",
    dot: "bg-blue-400",
  },
  shipped: {
    label: "Expédiée",
    icon: <Truck size={13} strokeWidth={1.5} />,
    color: "text-purple-600",
    dot: "bg-purple-400",
  },
  delivered: {
    label: "Livrée",
    icon: <CheckCircle2 size={13} strokeWidth={1.5} />,
    color: "text-emerald-600",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Annulée",
    icon: <XCircle size={13} strokeWidth={1.5} />,
    color: "text-red-500",
    dot: "bg-red-400",
  },
  returned: {
    label: "Retournée",
    icon: <RotateCcw size={13} strokeWidth={1.5} />,
    color: "text-orange-600",
    dot: "bg-orange-400",
  },
};


export function OrderCard({
  order,
  onClaim,
}: {
  order: Order;
  onClaim: (order: Order, productName: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[order.status];
  const canClaim = order.status === "delivered";

  const firstProduct = order.items[0]?.name ?? "—";
  const extraCount = order.items.length - 1;

  return (
    <motion.div
      layout
      className="border border-black/8 bg-white overflow-hidden"
    >
      {/* Card header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-black/1.5 transition-colors"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 aspect-3/4 bg-[#f5f5f5] overflow-hidden shrink-0">
            {order.items[0]?.mainImage ? (
              <img
                src={order.items[0].mainImage}
                alt={order.items[0].name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={15} strokeWidth={1.5} className="text-black/30 m-auto mt-3" />
            )}
          </div>
          <div>
            <p className="font-serif text-sm text-black/80">
              {firstProduct}
              {extraCount > 0 && (
                <span className="text-black/30 text-[10px] ml-1.5">
                  +{extraCount} article{extraCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
            <p className="text-[9px] text-black/30 mt-0.5">
              {order.createdAt instanceof Date
                ? order.createdAt.toLocaleDateString("fr-DZ", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Status badge */}
          <div className={`flex items-center gap-1.5 ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[9px] uppercase tracking-[0.2em] font-medium hidden sm:block">
              {cfg.label}
            </span>
            {cfg.icon}
          </div>

          {/* Total */}
          <span className="font-serif text-sm text-black/70">
            {order.total.toLocaleString("fr-DZ")} DA
          </span>

          {/* Chevron */}
          <span className="text-black/20">
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-black/6">
              {/* Items list */}
              <div className="mt-4 space-y-0">
                {/* Column headers */}
                <div className="flex items-center justify-between pb-2 border-b border-black/8">
                  <span className="text-[8px] uppercase tracking-[0.2em] text-black/30">Produit</span>
                  <div className="flex items-center gap-6">
                    <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 w-16 text-right">P.U</span>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 w-8 text-center">Qté</span>
                    <span className="text-[8px] uppercase tracking-[0.2em] text-black/30 w-20 text-right">Sous-total</span>
                  </div>
                </div>

                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b border-black/5 last:border-0"
                  >
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0 pr-4">
                      <span className="font-serif text-sm text-black/80 truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-black/30 uppercase tracking-[0.15em]">
                        {item.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <span className="text-[11px] text-black/50 w-16 text-right">
                        {item.price.toLocaleString("fr-DZ")} DA
                      </span>
                      <span className="text-[11px] text-black/60 w-8 text-center font-medium">
                        ×{item.quantity}
                      </span>
                      <span className="font-serif text-sm text-black/80 w-20 text-right">
                        {(item.price * item.quantity).toLocaleString("fr-DZ")} DA
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Per-product claim buttons */}
              {canClaim && (
                <div className="mt-3 space-y-1">
                  {order.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => onClaim(order, item.name)}
                      className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.2em] text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-2.5 py-1 transition-colors"
                    >
                      <AlertTriangle size={10} strokeWidth={1.5} />
                      <span>Signaler · {item.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Delivery info + Total */}
              <div className="flex items-end justify-between mt-4 pt-3 border-t border-black/6">
                <div className="space-y-0.5">
                  <p className="text-[8px] uppercase tracking-[0.2em] text-black/30">Livraison</p>
                  <p className="text-[11px] text-black/60">{order.form.name}</p>
                  {(order.form.address || order.form.city) && (
                    <p className="text-[10px] text-black/40">
                      {[order.form.address, order.form.city].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <p className="text-[9px] text-black/30 uppercase tracking-[0.15em]">
                    {order.form.deliveryType === "home"
                      ? "Domicile"
                      : order.form.deliveryType === "store"
                      ? "Magasin"
                      : "Bureau de poste"}
                    {" · "}
                    {order.form.paymentMethod === "cash" ? "Paiement à la livraison" : "Carte"}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[8px] uppercase tracking-[0.25em] text-black/30">
                    Total commande
                  </span>
                  <p className="font-serif italic text-lg text-black/80 mt-0.5">
                    {order.total.toLocaleString("fr-DZ")} DA
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}