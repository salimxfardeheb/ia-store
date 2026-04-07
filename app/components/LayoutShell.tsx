"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/app/components/NavBar";
import Footer from "@/app/components/Footer";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="grow">{children}</main>
      <Footer />
    </div>
  );
}
