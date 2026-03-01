"use client";

import { ChevronRight, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { C, serif, NAV_ITEMS, BOTTOM_NAV } from "../variables";

function SidebarLink({
  href, icon: Icon, label, active,
}: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`w-full flex items-center space-x-3 px-4 py-2.5 transition-all duration-150 text-left ${
        active
          ? "bg-black text-white"
          : "text-black/35 hover:bg-black/5 hover:text-black"
      }`}
    >
      <Icon size={15} strokeWidth={1.5} />
      <span className="text-[10px] uppercase tracking-[0.25em] flex-1" style={serif}>
        {label}
      </span>
      {active && <ChevronRight size={9} className="opacity-40" />}
    </Link>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <aside
      className="w-56 fixed inset-y-0 left-0 z-30 flex flex-col border-r"
      style={{ backgroundColor: C.white, borderColor: C.border }}
    >
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b" style={{ borderColor: C.border }}>
        <Link href="/" className="flex flex-col">
          <span
            className="text-[1.6rem] text-black leading-none"
            style={{ ...serif, fontStyle: "italic", fontWeight: 300, letterSpacing: "-0.02em" }}
          >
            I.A
          </span>
          <span
            className="text-[7px] uppercase tracking-[0.45em] text-black/30 mt-1"
            style={serif}
          >
            Admin Console
          </span>
        </Link>
      </div>

      {/* Thin rule */}
      <div className="mx-6 h-px" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />

      {/* Primary nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </nav>

      {/* Bottom nav + user */}
      <div className="border-t py-4 px-2 space-y-0.5" style={{ borderColor: C.border }}>
        {BOTTOM_NAV.map((item) => (
          <SidebarLink
            key={item.id}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={pathname.startsWith(item.href)}
          />
        ))}

        {/* User row */}
        <div className="px-4 pt-4 mt-2 border-t" style={{ borderColor: C.border }}>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-black truncate" style={serif}>
                {user?.email?.split("@")[0] || "Admin"}
              </p>
              <p className="text-[8px] text-black/30 truncate mt-0.5">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-1.5 text-black/25 hover:text-black hover:bg-black/6 transition-colors flex-shrink-0"
            >
              <LogOut size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}