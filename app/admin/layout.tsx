import "./globals.css";

import AdminSidebar from "./components/AdminSidebar";
import AdminGuard from "./components/AdminGuard";

export const metadata = { title: "Admin — I.A Store" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen flex bg-[#F7F7F7]">
        <AdminSidebar />
        <main className="flex-1 ml-56 p-8 min-h-screen">{children}</main>
      </div>
    </AdminGuard>
  );
}
