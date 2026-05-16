"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  AlertTriangle, Sun, Plus, TrendingUp, Download, Calendar, MoreVertical,
  ShoppingBag, Users, Package, ChevronRight,
} from "lucide-react";
import AdminHeader from "./components/AdminHeader";
import { KPICard } from "./components/KpiCard";
import { getDashboard, DashboardData } from "@/services/admin";

const RevenueCharts = dynamic(() => import("./components/RevenueCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white border p-7 border-[rgba(0,0,0,0.08)] h-85 flex items-center justify-center">
        <p className="font-serif italic text-black/20">Chargement…</p>
      </div>
      <div className="bg-white border p-7 border-[rgba(0,0,0,0.08)] h-85 flex items-center justify-center">
        <p className="font-serif italic text-black/20">Chargement…</p>
      </div>
    </div>
  ),
});
import { useAuth } from "@/app/context/AuthContext";

// ─── Shared sub-components ───────────────────────────────────────────────────

function QuickAction({ icon: Icon, label, dark = false }: { icon: any; label: string; dark?: boolean }) {
  return (
    <button
    type="button"
      className={`flex flex-col items-center justify-center p-5 border transition-all hover:scale-[1.015] duration-200 ${
        dark ? "bg-black text-white border-black" : "bg-white text-black border-black/8 hover:border-black/25"
      }`}
    >
      <Icon size={18} strokeWidth={1.5} className="mb-2.5" />
      <span className="text-[9px] uppercase tracking-tight font-serif">{label}</span>
    </button>
  );
}

function StockPanel({ loading, lowStock }: { loading: boolean; lowStock: DashboardData["lowStock"] }) {
  return (
    <div className="bg-white border p-6 border-[rgba(0,0,0,0.08)]">
      <div className="flex items-center space-x-2 mb-6">
        <AlertTriangle size={14} strokeWidth={1.5} className="text-black/50" />
        <h3 className="text-lg text-black font-serif italic font-light">Alertes stock</h3>
      </div>
      {loading ? (
        <p className="font-serif italic text-black/20 text-center py-8">Chargement…</p>
      ) : lowStock.length === 0 ? (
        <p className="font-serif italic text-black/20 text-center py-8">Aucune alerte</p>
      ) : (
        <div className="space-y-3">
          {lowStock.map((item) => (
            <div key={`${item.name}-${item.size}`} className="p-4 border border-[rgba(0,0,0,0.08)]">
              <div className="flex justify-between items-start mb-2.5">
                <h4 className="text-[10px] text-black pr-2 leading-snug font-serif">{item.name}</h4>
                <span className="text-[7px] uppercase tracking-widest bg-black text-white px-2 py-0.5 shrink-0 font-serif">{item.size}</span>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-black/30 mb-0.5 font-serif">En stock</p>
                  <p className="text-xl font-serif italic font-light" style={{ color: item.stock === 0 ? "#000" : "#555" }}>
                    {item.stock}
                  </p>
                </div>
                <button type="button" className="text-[8px] uppercase tracking-widest border-b border-black text-black pb-0.5 hover:opacity-50 transition-opacity font-serif">
                  Restock
                </button>
              </div>
              <div className="mt-2.5 h-px w-full bg-black/8">
                <div className="h-full bg-black transition-all" style={{ width: `${Math.min((item.stock / item.threshold) * 100, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <button type="button" className="w-full mt-4 py-3 border border-black/10 text-[9px] uppercase tracking-[0.25em] text-black hover:bg-black hover:text-white transition-all font-serif">
        Rapport complet
      </button>
    </div>
  );
}

function OrdersTable({ loading, recentOrders }: { loading: boolean; recentOrders: DashboardData["recentOrders"] }) {
  return (
    <div className="bg-white border overflow-hidden border-[rgba(0,0,0,0.08)]">
      <div className="px-7 py-5 border-b flex justify-between items-center border-[rgba(0,0,0,0.08)]">
        <h3 className="text-lg text-black font-serif italic font-light">Commandes récentes</h3>
        <a href="/admin/orders" className="text-[9px] uppercase tracking-widest border-b border-black pb-0.5 text-black hover:opacity-50 transition-opacity font-serif">
          Tout voir
        </a>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b text-[9px] uppercase tracking-[0.25em] text-black/30 border-[rgba(0,0,0,0.08)]">
            {["N° Commande", "Client", "Statut", "Montant", ""].map((h) => (
              <th key={h} className="px-6 py-3 font-normal font-serif">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center font-serif italic text-black/20">Chargement…</td>
            </tr>
          ) : recentOrders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center font-serif italic text-black/20">Aucune commande</td>
            </tr>
          ) : (
            recentOrders.map((order, i) => (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="border-b hover:bg-black/2 transition-colors border-[rgba(0,0,0,0.08)]"
              >
                <td className="px-6 py-3.5 text-[10px] text-black/60 font-serif">{order.id}</td>
                <td className="px-6 py-3.5 text-[10px] text-black font-serif">{order.customer}</td>
                <td className="px-6 py-3.5">
                  <span className={`px-2.5 py-0.5 text-[8px] uppercase tracking-widest font-serif ${order.statusStyle}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-[10px] text-black font-serif italic">{order.amount}</td>
                <td className="px-6 py-3.5">
                  <button type="button" className="p-1 text-black/20 hover:text-black hover:bg-black/5 transition-colors">
                    <MoreVertical size={12} strokeWidth={1.5} />
                  </button>
                </td>
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── SELLER view ─────────────────────────────────────────────────────────────

function SellerNavCard({
  href, icon: Icon, label, sub,
}: { href: string; icon: any; label: string; sub: string }) {
  return (
    <a href={href}>
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white border border-[rgba(0,0,0,0.08)] p-6 flex items-center justify-between group cursor-pointer hover:border-black/20 transition-colors"
      >
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-black/4 flex items-center justify-center">
            <Icon size={16} strokeWidth={1.5} className="text-black/50" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] font-serif text-black">{label}</p>
            <p className="text-[9px] text-black/35 font-serif mt-0.5">{sub}</p>
          </div>
        </div>
        <ChevronRight size={14} strokeWidth={1.5} className="text-black/20 group-hover:text-black/50 transition-colors" />
      </motion.div>
    </a>
  );
}

function SellerDashboard({
  data, loading, userName,
}: { data: DashboardData | null; loading: boolean; userName: string }) {
  const kpiOrders  = data?.kpis.orders ?? { value: "—", trend: "—", isUp: true, subtitle: "vs mois dernier" };
  const recentOrders = data?.recentOrders ?? [];
  const lowStock     = data?.lowStock     ?? [];

  const zeroStock   = lowStock.filter((i) => i.stock === 0).length;
  const kpiStock = {
    value:    loading ? "—" : String(lowStock.length),
    trend:    loading ? "—" : zeroStock > 0 ? `${zeroStock} épuisé${zeroStock > 1 ? "s" : ""}` : "OK",
    isUp:     zeroStock === 0,
    subtitle: "produits sous le seuil",
  };

  return (
    <>
      <AdminHeader title="Mon espace" subtitle="Tableau de bord vendeur" />

      <div className="space-y-6">
        {/* Greeting + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Greeting card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-black p-8 relative overflow-hidden flex flex-col justify-between min-h-52"
          >
            <div className="relative z-10">
              <span className="text-[9px] uppercase tracking-[0.4em] text-white/35 font-serif">Bienvenue</span>
              <h2 className="text-white font-serif text-[2rem] italic font-light mt-2 mb-3 leading-snug">
                {userName}
              </h2>
              <p className="text-white/35 text-sm font-serif leading-relaxed max-w-xs">
                Prêt pour une nouvelle journée de ventes.
              </p>
            </div>
            <a href="/admin/pos" className="self-start mt-6">
              <button type="button" className="px-6 py-3 bg-white text-black text-[9px] uppercase tracking-[0.25em] hover:bg-white/85 transition-all font-serif flex items-center space-x-2.5">
                <ShoppingBag size={12} strokeWidth={1.5} />
                <span>Nouvelle vente</span>
              </button>
            </a>
            {/* Decorative */}
            <div className="absolute -right-8 -bottom-8 pointer-events-none opacity-[0.03]">
              <ShoppingBag size={180} />
            </div>
          </motion.div>

          {/* KPIs */}
          <div className="flex flex-col gap-4">
            {[
              { title: "Commandes",     ...kpiOrders },
              { title: "Alertes stock", ...kpiStock  },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
              >
                <KPICard {...kpi} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SellerNavCard href="/admin/pos"       icon={ShoppingBag} label="Nouvelle vente" sub="Ouvrir le point de vente" />
          <SellerNavCard href="/admin/customers" icon={Users}       label="Clients"        sub="Consulter la base clients" />
          <SellerNavCard href="/admin/orders"    icon={Package}     label="Commandes"      sub="Suivre les commandes" />
          <SellerNavCard href="/admin/catalog"   icon={Plus}        label="Catalogue"      sub="Parcourir les produits" />
        </div>

        {/* Orders + Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OrdersTable loading={loading} recentOrders={recentOrders} />
          </div>
          <StockPanel loading={loading} lowStock={lowStock} />
        </div>
      </div>
    </>
  );
}

// ─── ADMIN view ───────────────────────────────────────────────────────────────

function AdminDashboard({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const kpis = data
    ? [
        { title: "Chiffre d'affaires", ...data.kpis.revenue },
        { title: "Commandes",          ...data.kpis.orders   },
        { title: "Panier moyen",       ...data.kpis.avgBasket },
      ]
    : [
        { title: "Chiffre d'affaires", value: "—", trend: "—", isUp: true, subtitle: "vs mois dernier" },
        { title: "Commandes",          value: "—", trend: "—", isUp: true, subtitle: "vs mois dernier" },
        { title: "Panier moyen",       value: "—", trend: "—", isUp: true, subtitle: "vs mois dernier" },
      ];

  const revenueChart = data?.revenueChart ?? [];
  const categoryData = data?.categoryData ?? [];
  const recentOrders = data?.recentOrders ?? [];
  const lowStock     = data?.lowStock     ?? [];

  return (
    <>
      <AdminHeader title="Tableau de bord" subtitle="Vue d'ensemble" />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <KPICard {...kpi} />
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white border p-7 border-[rgba(0,0,0,0.08)] h-85 flex items-center justify-center">
              <p className="font-serif italic text-black/20">Chargement…</p>
            </div>
            <div className="bg-white border p-7 border-[rgba(0,0,0,0.08)] h-85 flex items-center justify-center">
              <p className="font-serif italic text-black/20">Chargement…</p>
            </div>
          </div>
        ) : (
          <RevenueCharts revenueChart={revenueChart} categoryData={categoryData} />
        )}

        {/* Orders + Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <OrdersTable loading={loading} recentOrders={recentOrders} />
          </div>
          <StockPanel loading={loading} lowStock={lowStock} />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Seasonal */}
          <div className="bg-black p-8 relative overflow-hidden flex flex-col justify-between min-h-55">
            <div className="relative z-10">
              <div className="flex items-center space-x-2.5 mb-4">
                <Sun size={14} strokeWidth={1.5} className="text-white/50" />
                <span className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-serif">Analyse saisonnière</span>
              </div>
              <h3 className="text-white mb-3 font-serif text-[1.5rem] italic font-light leading-5">
                Transition printemps<br />approche
              </h3>
              <p className="text-white/40 text-sm mb-6 max-w-xs leading-relaxed font-serif">
                La demande en lin et soie légère devrait augmenter de 40% la semaine prochaine.
              </p>
            </div>
            <button type="button" className="self-start px-6 py-2.5 bg-white text-black text-[9px] uppercase tracking-[0.25em] hover:bg-white/80 transition-all font-serif">
              Mettre à jour la vitrine
            </button>
            <div className="absolute -right-6 -bottom-6 pointer-events-none opacity-[0.04]">
              <Sun size={160} />
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white border p-7 border-[rgba(0,0,0,0.08)]">
            <h3 className="text-lg text-black mb-5 font-serif italic font-light">Actions rapides</h3>
            <div className="grid grid-cols-2 gap-3">
              <a href="/admin/catalog">
                <QuickAction icon={Plus}       label="Ajouter produit" dark />
              </a>
              <QuickAction icon={TrendingUp} label="Créer une promo" />
              <QuickAction icon={Download}   label="Exporter ventes" />
              <QuickAction icon={Calendar}   label="Plan campagne" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page entry point ─────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { user } = useAuth();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (user?.role === "SELLER") {
    return (
      <SellerDashboard
        data={data}
        loading={loading}
        userName={user.name}
      />
    );
  }

  return <AdminDashboard data={data} loading={loading} />;
}
