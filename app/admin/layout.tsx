import { redirect } from "next/navigation";
import AdminSidebar from "./components/AdminSidebar";
import { getServerSession } from "@/lib/getServerSession";

export const metadata = { title: "Admin — I.A Store" };

// Server-side gate: read the cookie, verify JWT + Redis blocklist + DB role.
// The client-side AdminGuard still runs for instant UX feedback, but the
// real access control now happens here — before any HTML is sent.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session || session.role === "CLIENT") {
    redirect("/");
  }

  return (
    <div className="admin-layout min-h-screen flex bg-[#F7F7F7]">
      <AdminSidebar />
      <main className="flex-1 ml-72 p-10 min-h-screen">{children}</main>
      <style>{`
        .admin-layout .font-serif { font-weight: 500; }
        .admin-layout .font-serif.font-light { font-weight: 400; }
        .admin-layout .font-serif.font-bold { font-weight: 650; }

        .admin-layout .text-\\[7px\\],
        .admin-layout .text-\\[8px\\],
        .admin-layout .text-\\[9px\\],
        .admin-layout .text-\\[10px\\],
        .admin-layout .text-\\[11px\\] {
          font-size: 12px !important;
        }
        .admin-layout .text-\\[12px\\],
        .admin-layout .text-\\[13px\\] {
          font-size: 13px !important;
        }
      `}</style>
    </div>
  );
}
