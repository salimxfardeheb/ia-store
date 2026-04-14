"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import GlobalSearch from "./GlobalSearch";
import NotificationDropdown from "./NotificationDropdown";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day:     "numeric",
    month:   "long",
  });
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { user } = useAuth();
  const initials = user?.name ? getInitials(user.name) : "AD";

  return (
    <header className="flex justify-between items-start mb-10">
      {/* Title */}
      <div>
        {subtitle && (
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-px w-6 bg-black/30" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-black/35 font-serif">
              {subtitle}
            </span>
          </div>
        )}
        <h1 className="text-black leading-none italic text-4xl font-light font-serif">
          {title}
        </h1>
        <p className="text-[10px] text-black/30 font-serif mt-2 capitalize">
          {getTodayLabel()}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2.5">
        <Link
          href="/"
          className="flex items-center space-x-2 p-2.5 border bg-white hover:bg-black hover:text-white transition-colors border-[rgba(0,0,0,0.08)] group"
          title="Retour à l'accueil"
        >
          <Home size={15} strokeWidth={1.5} className="text-black group-hover:text-white" />
          <span className="text-[9px] uppercase tracking-widest font-serif text-black group-hover:text-white">
            Accueil
          </span>
        </Link>

        <GlobalSearch />
        <NotificationDropdown />

        <div
          className="w-9 h-9 flex items-center justify-center bg-black text-white text-[9px] uppercase tracking-widest font-serif cursor-default"
          title={user?.name ?? "Admin"}
          aria-label={user?.name ?? "Admin"}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
