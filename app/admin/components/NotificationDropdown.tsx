"use client";

import { Bell, ShoppingBag, Package, X } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface Notif {
  id:       string;
  type:     "pending_order" | "low_stock";
  title:    string;
  subtitle: string;
  href:     string;
}

// Shape returned by /api/admin/dashboard
interface DashboardData {
  recentOrders: Array<{ id: string; customer: string; status: string; amount: string; date: string }>;
  lowStock:     Array<{ name: string; size: string; stock: number }>;
}

function buildNotifs(data: DashboardData): Notif[] {
  const items: Notif[] = [];

  for (const o of data.recentOrders) {
    if (o.status !== "En attente") continue;
    items.push({
      id:       `order-${o.id}`,
      type:     "pending_order",
      title:    `Commande de ${o.customer}`,
      subtitle: `${o.amount} · ${o.date}`,
      href:     "/admin/orders",
    });
  }

  for (const p of data.lowStock) {
    items.push({
      id:       `stock-${p.name}-${p.size}`,
      type:     "low_stock",
      title:    p.name,
      subtitle: `Stock faible — ${p.stock} restant${p.stock > 1 ? "s" : ""} (taille ${p.size})`,
      href:     "/admin/catalog",
    });
  }

  return items;
}

export default function NotificationDropdown() {
  const [isOpen,  setIsOpen]  = useState(false);
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [hasBadge, setHasBadge] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const router       = useRouter();
  const { getToken } = useAuth();

  const fetchNotifs = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch("/api/admin/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
        cache:   "no-store",
      });
      if (!res.ok) return;
      const data: DashboardData = await res.json();
      const items = buildNotifs(data);
      setNotifs(items);
      if (items.length > 0) setHasBadge(true);
    } catch {
      // ignore network errors silently
    }
  }, [getToken]);

  // Initial fetch + poll every 60s
  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  // Click outside → close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setHasBadge(false); // mark as seen on open
  };

  const navigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2.5 border bg-white hover:bg-black/5 transition-colors border-[rgba(0,0,0,0.08)]"
        aria-label={hasBadge ? `${notifs.length} alertes` : "Notifications"}
      >
        <Bell size={15} strokeWidth={1.5} className="text-black" />
        {hasBadge && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-80 bg-white border border-[rgba(0,0,0,0.08)] shadow-sm z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(0,0,0,0.05)]">
            <span className="text-[10px] uppercase tracking-[0.35em] font-serif text-black/40">
              Alertes
              {notifs.length > 0 && (
                <span className="ml-2 text-black/60">{notifs.length}</span>
              )}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-black/20 hover:text-black/50 transition-colors"
              aria-label="Fermer"
            >
              <X size={11} />
            </button>
          </div>

          {/* Body */}
          {notifs.length === 0 ? (
            <p className="px-4 py-6 text-center text-[10px] text-black/30 font-serif">
              Aucune alerte active
            </p>
          ) : (
            <div className="divide-y divide-[rgba(0,0,0,0.04)] max-h-80 overflow-y-auto">
              {notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => navigate(n.href)}
                  className="w-full flex items-start space-x-3 px-4 py-3 hover:bg-black/5 transition-colors text-left"
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === "pending_order" ? (
                      <ShoppingBag size={12} strokeWidth={1.5} className="text-black/35" />
                    ) : (
                      <Package size={12} strokeWidth={1.5} className="text-black/35" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-serif text-black truncate">{n.title}</p>
                    <p className="text-[9px] text-black/35 font-serif mt-0.5 leading-relaxed">
                      {n.subtitle}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Footer groupé par type */}
          {notifs.length > 0 && (
            <div className="flex border-t border-[rgba(0,0,0,0.05)]">
              {notifs.some((n) => n.type === "pending_order") && (
                <button
                  onClick={() => navigate("/admin/orders")}
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-[0.25em] font-serif text-black/40 hover:text-black hover:bg-black/5 transition-colors border-r border-[rgba(0,0,0,0.05)] last:border-r-0"
                >
                  Voir commandes
                </button>
              )}
              {notifs.some((n) => n.type === "low_stock") && (
                <button
                  onClick={() => navigate("/admin/catalog")}
                  className="flex-1 py-2.5 text-[9px] uppercase tracking-[0.25em] font-serif text-black/40 hover:text-black hover:bg-black/5 transition-colors"
                >
                  Voir catalogue
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
