"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { PIE_COLORS } from "@/app/variables";
import type { DashboardData } from "@/services/admin";

interface Props {
  revenueChart: DashboardData["revenueChart"];
  categoryData: DashboardData["categoryData"];
}

export default function RevenueCharts({ revenueChart, categoryData }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Area chart */}
      <div className="lg:col-span-2 bg-white border p-7 border-[rgba(0,0,0,0.08)]">
        <div className="flex justify-between items-center mb-7">
          <h3 className="text-lg text-black italic font-light font-serif">Aperçu des revenus</h3>
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="gDark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0A0A0A" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0A0A0A" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(0,0,0,0.35)", fontFamily: "'Cormorant Garamond',Georgia,serif" }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgba(0,0,0,0.35)", fontFamily: "'Cormorant Garamond',Georgia,serif" }} />
              <Tooltip contentStyle={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, backgroundColor: "#fff", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 11 }} />
              <Area type="monotone" dataKey="revenue" stroke="#0A0A0A" strokeWidth={1.5} fillOpacity={1} fill="url(#gDark)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center space-x-5 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-px bg-[#0A0A0A]" />
            <span className="text-[9px] uppercase tracking-widest text-black/60 font-serif">Revenus</span>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="bg-white border p-7 border-[rgba(0,0,0,0.08)]">
        <h3 className="text-lg text-black mb-7 font-serif italic font-light">Par catégorie</h3>
        {categoryData.length === 0 ? (
          <div className="h-45 flex items-center justify-center">
            <p className="font-serif italic text-black/20">Aucune donnée</p>
          </div>
        ) : (
          <>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={68} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 0, backgroundColor: "#fff", fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2 h-2" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-[10px] uppercase tracking-widest text-black/50 font-serif">{cat.name}</span>
                  </div>
                  <span className="text-[9px] text-black italic font-serif">{cat.value}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
