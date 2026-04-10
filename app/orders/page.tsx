"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import { Order, OrderStatus } from "../variables";
import { ReclamationModal } from "../components/ReclamationModal";
import { OrderCard, STATUS_CONFIG } from "../components/OrderCard";
import { getOrders } from "@/services/orders";

export default function OrdersPage() {
  const { user, getToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [claimTarget, setClaimTarget] = useState<{
    orderId: string;
    productName: string;
  } | null>(null);

  useEffect(() => {
    if (!user) { router.push("/"); return; }
    const token = getToken();
    if (!token) return;
    getOrders(token).then(setOrders);
  }, [user]);

  const openClaim = (order: Order, productName: string) => {
    setClaimTarget({ orderId: order.id, productName });
  };

  return (
    <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <button
            onClick={() => router.push("/profile")}
            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-black/30 hover:text-black transition-colors mb-4"
          >
            <ArrowLeft size={12} strokeWidth={1.5} />
            <span>Mon profil</span>
          </button>
          <h1 className="font-serif text-5xl italic mb-2">Commandes</h1>
          <p className="text-black/30 text-[11px] uppercase tracking-[0.3em]">
            {orders.length} commande{orders.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 mb-8">
        {(
          Object.entries(STATUS_CONFIG) as [
            OrderStatus,
            (typeof STATUS_CONFIG)[OrderStatus],
          ][]
        ).map(([key, cfg]) => (
          <div key={key} className={`flex items-center gap-1.5 ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className="text-[9px] uppercase tracking-[0.2em]">
              {cfg.label}
            </span>
          </div>
        ))}
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={28} strokeWidth={1} className="text-black/15 mx-auto mb-4" />
          <p className="font-serif italic text-black/30 text-sm">
            Aucune commande pour le moment
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onClaim={openClaim} />
          ))}
        </div>
      )}

      {/* Reclamation modal */}
      <AnimatePresence>
        {claimTarget && (
          <ReclamationModal
            initial={claimTarget}
            onClose={() => setClaimTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}